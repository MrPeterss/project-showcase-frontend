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
  // Track the last processed Firebase token to avoid duplicate API calls
  const lastProcessedTokenRef = useRef<string | null>(null)
  // Track if initial load has completed
  const isInitialLoadRef = useRef(true)

  // Use ref to store the latest user state to avoid recreating the callback
  const userRef = useRef(userState.user)
  useEffect(() => {
    userRef.current = userState.user
  }, [userState.user])

  const syncUser = useCallback(async (firebaseToken: string) => {
    try {
      // Verify token with backend to get access token
      // The backend will set the refresh token cookie automatically
      const response = await services.auth.verifyToken(firebaseToken)
      const accessToken = response.data.accessToken
      
      // Store access token in memory
      tokenManager.setToken(accessToken)
      
      // Get user information from /users/me endpoint
      const userResponse = await api.get('/users/me')
      dispatch(setUser(userResponse.data))
      
      // Update the last processed token
      lastProcessedTokenRef.current = firebaseToken
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify token'
      dispatch(setError(errorMessage))
      throw error
    }
  }, [dispatch])

  useEffect(() => {
    let isMounted = true
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      // Only set loading state on initial load
      const isInitialLoad = isInitialLoadRef.current
      if (isInitialLoad) {
        dispatch(setLoading(true))
        isInitialLoadRef.current = false
      }
      dispatch(setError(null))

      if (user) {
        try {
          const idToken = await user.getIdToken()
          localStorage.setItem('firebase_token', idToken)
          
          // Update Firebase user reference (needed for other components)
          if (isMounted) {
            setFirebaseUser(user)
          }
          
          // Check if we already have valid auth state (access token + user data)
          const hasValidAuth = tokenManager.hasToken() && userRef.current
          
          // Only sync/verify if:
          // 1. This is the initial load (first time checking auth state), OR
          // 2. We don't have valid auth state (missing access token or user data)
          // Note: We don't need to verify on every Firebase token refresh if we already have a valid access token
          if (isInitialLoad || !hasValidAuth) {
            await syncUser(idToken)
          } else {
            // We have valid auth, just update the ref to track that we've seen this token
            lastProcessedTokenRef.current = idToken
          }
        } catch (error) {
          console.error('Error syncing user:', error)
          if (isMounted) {
            dispatch(setError('Failed to sync user profile'))
          }
        }
      } else {
        // User signed out
        if (isMounted) {
          setFirebaseUser(null)
          localStorage.removeItem('firebase_token')
          // Clear access token from memory
          tokenManager.clearToken()
          lastProcessedTokenRef.current = null
          dispatch(clearUser())
        }
      }

      if (isMounted) {
        dispatch(setLoading(false))
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [dispatch, syncUser])

  // Also sync user when token is refreshed (e.g., from API interceptor)
  useEffect(() => {
    const handleTokenRefresh = async () => {
      const accessToken = tokenManager.getToken()
      if (accessToken && firebaseUser) {
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
    handleTokenRefresh()
  }, [firebaseUser, userState.tokenRefreshTrigger, dispatch])

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
