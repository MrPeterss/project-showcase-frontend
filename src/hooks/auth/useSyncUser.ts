import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { services } from '@/services'
import type { ApiResponse } from '@/lib/api'

/**
 * Hook for verifying Firebase token with the backend API
 * 
 * This mutation is used after Firebase authentication to verify the Firebase token
 * with backend and get an access token in return. The access token is stored
 * in memory. After verification, users/me is called to get the user information.
 * 
 * @param options - Optional React Query mutation options
 * @returns Mutation object for verifying Firebase token with the backend
 * 
 */
export const useVerifyToken = (
  options?: UseMutationOptions<ApiResponse<{ accessToken: string }>, AxiosError, string>
) => {
  return useMutation({
    mutationFn: (firebaseToken: string) => services.auth.verifyToken(firebaseToken),
    ...options,
  })
}
