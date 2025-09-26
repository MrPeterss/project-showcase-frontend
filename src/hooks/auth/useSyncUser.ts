import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { services } from '@/services'
import type { User } from '@/services'
import type { ApiResponse } from '@/lib/api'

/**
 * Hook for syncing a Firebase user with the backend API
 * 
 * This mutation is used after Firebase authentication to sync the user with your backend.
 * The idToken is automatically sent in the Authorization header via the API client interceptor.
 * 
 * @param options - Optional React Query mutation options
 * @returns Mutation object for syncing Firebase user data with the backend
 * 
 * @example
 * ```tsx
 * const syncUser = useSyncUser({
 *   onSuccess: (response) => {
 *     const user = response.data
 *     console.log('User synced successfully:', user.displayName)
 *     // The user object contains your backend user representation
 *   },
 *   onError: (error) => {
 *     console.error('Failed to sync user:', error.message)
 *   }
 * })
 * 
 * // Called after Firebase sign-in
 * const handleFirebaseSignIn = async () => {
 *   const result = await signInWithPopup(auth, googleProvider)
 *   const idToken = await result.user.getIdToken()
 *   
 *   // Save token to localStorage for API requests
 *   localStorage.setItem('firebase_token', idToken)
 *   
 *   // Sync user with backend (token is automatically included in request)
 *   const response = await syncUser.mutateAsync()
 *   const backendUser = response.data // This is your backend user representation
 * }
 * ```
 */
export const useSyncUser = (
  options?: UseMutationOptions<ApiResponse<User>, AxiosError, void>
) => {
  return useMutation({
    mutationFn: () => services.auth.syncUser(),
    ...options,
  })
}
