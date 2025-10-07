import { api, type ApiResponse } from '@/lib/api'

// Auth Services
export const authServices = {
  verifyToken: (firebaseToken: string): Promise<ApiResponse<{ accessToken: string }>> =>
    api.post('/auth/verify-token', { firebaseToken }),
}

export default authServices
