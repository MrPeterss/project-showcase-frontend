import { api, type ApiResponse } from '@/lib/api'

// Auth Services
export const authServices = {
  /**
   * 
   * @param firebaseToken - The Firebase token to verify
   * @returns The access token
   */
  verifyToken: (firebaseToken: string): Promise<ApiResponse<{ accessToken: string }>> =>
    api.post('/auth/verify-token', { firebaseToken }),
  
  /**
   * Refresh the access token using the refresh token cookie
   * The backend automatically reads the refresh token from the HTTP-only cookie
   * @returns The access token
   */
  refreshToken: (): Promise<ApiResponse<{ accessToken: string }>> =>
    api.post('/auth/refresh-token'),
}

export default authServices
