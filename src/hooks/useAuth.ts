import { useEffect, useCallback, useState } from 'react'
import { onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { services } from '@/services'
import { api } from '@/lib/api'
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
      const response = await services.auth.verifyToken(firebaseToken)
      localStorage.setItem('access_token', response.data.accessToken)
      
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
        localStorage.removeItem('access_token')
        dispatch(clearUser())
      }

      dispatch(setLoading(false))
    })

    return unsubscribe
  }, [dispatch, syncUser])

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
      localStorage.removeItem('access_token')
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