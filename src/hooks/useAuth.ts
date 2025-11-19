import { useEffect, useState } from 'react'
import { onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { services } from '@/services'
import { api } from '@/lib/api'
import { tokenManager } from '@/lib/tokenManager'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { store, type AppDispatch } from '@/store'
import {
  setUser,
  setLoading,
  setError,
  clearUser,
} from '@/store/slices/userSlice'

type FirebaseUserListener = (user: FirebaseUser | null) => void

const firebaseUserListeners = new Set<FirebaseUserListener>()
let firebaseUserSnapshot: FirebaseUser | null = auth.currentUser
let authUnsubscribe: (() => void) | null = null
let hasInitializedLoading = false
let lastSyncedToken: string | null = null
let syncInFlightToken: string | null = null
let syncInFlightPromise: Promise<void> | null = null
let profileFetchPromise: Promise<void> | null = null
let lastProcessedTokenRefresh = store.getState().user.tokenRefreshTrigger

const notifyFirebaseListeners = (user: FirebaseUser | null) => {
  firebaseUserSnapshot = user
  firebaseUserListeners.forEach((listener) => listener(user))
}

const subscribeToFirebaseUser = (listener: FirebaseUserListener) => {
  listener(firebaseUserSnapshot)
  firebaseUserListeners.add(listener)
  return () => {
    firebaseUserListeners.delete(listener)
  }
}

const fetchUserProfile = async (dispatch: AppDispatch) => {
  if (!profileFetchPromise) {
    profileFetchPromise = (async () => {
      const userResponse = await api.get('/users/me')
      dispatch(setUser(userResponse.data))
    })().finally(() => {
      profileFetchPromise = null
    })
  }

  await profileFetchPromise
}

const shouldSyncUser = (idToken: string) => {
  const hasUser = store.getState().user.user !== null
  const hasAccessToken = tokenManager.getToken() !== null
  const tokenChanged = lastSyncedToken !== idToken
  return tokenChanged || !hasUser || !hasAccessToken
}

const syncUserProfile = async (idToken: string, dispatch: AppDispatch) => {
  localStorage.setItem('firebase_token', idToken)

  if (!shouldSyncUser(idToken)) {
    dispatch(setLoading(false))
    return
  }

  if (syncInFlightPromise && syncInFlightToken === idToken) {
    await syncInFlightPromise
    return
  }

  syncInFlightToken = idToken
  syncInFlightPromise = (async () => {
    const response = await services.auth.verifyToken(idToken)
    tokenManager.setToken(response.data.accessToken)
    await fetchUserProfile(dispatch)
    lastSyncedToken = idToken
    dispatch(setLoading(false))
  })().catch((error) => {
    lastSyncedToken = null
    throw error
  }).finally(() => {
    syncInFlightToken = null
    syncInFlightPromise = null
  })

  await syncInFlightPromise
}

const handleSignedOut = (dispatch: AppDispatch) => {
  localStorage.removeItem('firebase_token')
  tokenManager.clearToken()
  lastSyncedToken = null
  dispatch(clearUser())
  dispatch(setLoading(false))
}

const ensureAuthListener = (dispatch: AppDispatch) => {
  if (authUnsubscribe) {
    return
  }

  authUnsubscribe = onIdTokenChanged(auth, async (user) => {
    notifyFirebaseListeners(user)

    if (!hasInitializedLoading) {
      dispatch(setLoading(true))
      hasInitializedLoading = true
    }

    dispatch(setError(null))

    if (user) {
      try {
        const idToken = await user.getIdToken()
        await syncUserProfile(idToken, dispatch)
      } catch (error) {
        console.error('Error syncing user:', error)
        dispatch(setError('Failed to sync user profile'))
        dispatch(setLoading(false))
      }
    } else {
      handleSignedOut(dispatch)
    }
  })
}

const refreshUserFromAccessToken = async (dispatch: AppDispatch) => {
  try {
    await fetchUserProfile(dispatch)
  } catch (error) {
    console.error('Error syncing user from refreshed token:', error)
  }
}

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const userState = useAppSelector((state) => state.user)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(firebaseUserSnapshot)

  useEffect(() => {
    ensureAuthListener(dispatch)
    return subscribeToFirebaseUser(setFirebaseUser)
  }, [dispatch])

  useEffect(() => {
    if (userState.tokenRefreshTrigger <= 0) return
    if (lastSyncedToken === null) return
    if (userState.tokenRefreshTrigger === lastProcessedTokenRefresh) return

    lastProcessedTokenRefresh = userState.tokenRefreshTrigger
    refreshUserFromAccessToken(dispatch)
  }, [userState.tokenRefreshTrigger, dispatch])

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
