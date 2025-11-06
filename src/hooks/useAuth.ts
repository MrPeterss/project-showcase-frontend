import { useEffect, useCallback, useState } from 'react'
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
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user)
      dispatch(setLoading(true))
      dispatch(setError(null))

      if (user) {
        try {
          const idToken = await user.getIdToken()
          localStorage.setItem('firebase_token', idToken)

          await syncUser()
        } catch (error) {
          console.error('Error syncing user:', error)
          dispatch(setError('Failed to sync user profile'))
        }
      } else {
        localStorage.removeItem('firebase_token')
        // Clear access token from memory
        tokenManager.clearToken()
        dispatch(clearUser())
      }

      dispatch(setLoading(false))
    })

    return unsubscribe
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
