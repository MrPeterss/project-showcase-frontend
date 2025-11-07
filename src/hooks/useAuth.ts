import { useEffect, useCallback, useState, useRef } from 'react'
import { onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { services } from '@/services'
import { api } from '@/lib/api'
import { tokenManager } from '@/lib/tokenManager'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setUser,
  setLoading,
  setError,
  clearUser,
} from '@/store/slices/userSlice'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const userState = useAppSelector((state) => state.user)

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const lastSyncedTokenRef = useRef<string | null>(null)

  const syncUser = useCallback(async () => {
    try {
      const firebaseToken = localStorage.getItem('firebase_token')
      if (!firebaseToken) {
        throw new Error('No Firebase token available')
      }
      
      // Verify token with backend to get access token
      // The backend will set the refresh token cookie automatically
      const response = await services.auth.verifyToken(firebaseToken)
      const accessToken = response.data.accessToken
      
      // Store access token in memory
      tokenManager.setToken(accessToken)
      
      // Get user information from /users/me endpoint
      const userResponse = await api.get('/users/me')
      dispatch(setUser(userResponse.data))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify token'
      dispatch(setError(errorMessage))
      throw error
    }
  }, [dispatch])

  useEffect(() => {
    let isMounted = true
    let hasInitialized = false

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!isMounted) return

      setFirebaseUser(user)
      
      // Only set loading on first initialization (not on subsequent token changes)
      if (!hasInitialized) {
        dispatch(setLoading(true))
        hasInitialized = true
      }
      dispatch(setError(null))

      if (user) {
        try {
          const idToken = await user.getIdToken()
          const storedToken = localStorage.getItem('firebase_token')
          
          // Check if token actually changed (not just on initial load)
          const tokenChanged = storedToken !== null && storedToken !== idToken
          
          // Check current state - if we have user and token, and token hasn't changed, skip sync
          const hasUser = userState.user !== null
          const hasToken = tokenManager.getToken() !== null
          const alreadySyncedThisToken = lastSyncedTokenRef.current === idToken
          
          // Only sync if:
          // 1. Token changed (refresh), OR
          // 2. We don't have a user in state yet (initial load or page reload), OR
          // 3. We don't have an access token in memory (page reload - token lost)
          // AND we haven't already synced with this exact token
          const needsSync = (tokenChanged || !hasUser || !hasToken) && !alreadySyncedThisToken
          
          if (needsSync) {
            localStorage.setItem('firebase_token', idToken)
            lastSyncedTokenRef.current = idToken
            await syncUser()
          } else {
            // Token is the same, user is loaded, and we have a token
            // Just update the stored token in case it was updated by Firebase
            localStorage.setItem('firebase_token', idToken)
            if (isMounted && hasInitialized && hasUser) {
              dispatch(setLoading(false))
            }
          }
        } catch (error) {
          console.error('Error syncing user:', error)
          if (isMounted) {
            dispatch(setError('Failed to sync user profile'))
            dispatch(setLoading(false))
          }
        }
      } else {
        localStorage.removeItem('firebase_token')
        lastSyncedTokenRef.current = null
        // Clear access token from memory
        tokenManager.clearToken()
        dispatch(clearUser())
        if (isMounted) {
          dispatch(setLoading(false))
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [dispatch, syncUser, userState.user])

  // Also sync user when token is refreshed (e.g., from API interceptor)
  useEffect(() => {
    const handleTokenRefresh = async () => {
      const accessToken = tokenManager.getToken()
      // Only fetch user if we have a token but no user, or if token was refreshed
      if (accessToken && firebaseUser && (!userState.user || userState.tokenRefreshTrigger > 0)) {
        try {
          // Get user information from /users/me endpoint
          const userResponse = await api.get('/users/me')
          dispatch(setUser(userResponse.data))
        } catch (error) {
          console.error('Error syncing user from refreshed token:', error)
        }
      }
    }

    // Watch for tokenRefreshTrigger changes (dispatched by API interceptor)
    // Only run if tokenRefreshTrigger actually changed (not on initial mount)
    if (userState.tokenRefreshTrigger > 0) {
      handleTokenRefresh()
    }
  }, [firebaseUser, userState.tokenRefreshTrigger, userState.user, dispatch])

  const signInWithGoogle = async () => {
    dispatch(setError(null))
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed'
      dispatch(setError(errorMessage))
      throw error
    }
  }

  const signOutUser = async () => {
    dispatch(setError(null))
    try {
      localStorage.removeItem('firebase_token')
      // Clear access token from memory
      tokenManager.clearToken()
      await signOut(auth)
      setFirebaseUser(null)
      dispatch(clearUser())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-out failed'
      dispatch(setError(errorMessage))
      throw error
    }
  }

  return {
    // Redux state
    user: userState.user,
    isLoading: userState.isLoading,
    error: userState.error,

    // Local state
    firebaseUser,

    // Computed state
    isAuthenticated: !!userState.user,

    // Actions
    signIn: signInWithGoogle,
    signOut: signOutUser,
  }
}
