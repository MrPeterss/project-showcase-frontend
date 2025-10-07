import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { services } from '@/services'
import type { ApiResponse } from '@/lib/api'

/**
 * Hook for verifying Firebase token with the backend API
 * 
 * This mutation is used after Firebase authentication to verify the Firebase token
 * with your backend and get an access token in return. After verification, you'll
 * need to call /users/me to get the user information.
 * 
 * @param options - Optional React Query mutation options
 * @returns Mutation object for verifying Firebase token with the backend
 * 
 * @example
 * ```tsx
 * import { api } from '@/lib/api'
 * 
 * const verifyToken = useVerifyToken({
 *   onSuccess: async (response) => {
 *     const { accessToken } = response.data
 *     localStorage.setItem('access_token', accessToken)
 *     
 *     // Get user information after token verification
 *     const userResponse = await api.get('/users/me')
 *     console.log('Token verified successfully, user:', userResponse.data)
 *   },
 *   onError: (error) => {
 *     console.error('Failed to verify token:', error.message)
 *   }
 * })
 * 
 * // Called after Firebase sign-in
 * const handleFirebaseSignIn = async () => {
 *   const result = await signInWithPopup(auth, googleProvider)
 *   const firebaseToken = await result.user.getIdToken()
 *   
 *   // Save Firebase token to localStorage
 *   localStorage.setItem('firebase_token', firebaseToken)
 *   
 *   // Verify token with backend to get access token
 *   const response = await verifyToken.mutateAsync(firebaseToken)
 *   const { accessToken } = response.data
 *   localStorage.setItem('access_token', accessToken)
 * }
 * ```
 */
export const useVerifyToken = (
  options?: UseMutationOptions<ApiResponse<{ accessToken: string }>, AxiosError, string>
) => {
  return useMutation({
    mutationFn: (firebaseToken: string) => services.auth.verifyToken(firebaseToken),
    ...options,
  })
}
