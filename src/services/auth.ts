import { api, type ApiResponse } from '@/lib/api'
import type { User } from './types'

// Auth Services
export const authServices = {
  syncUser: (): Promise<ApiResponse<User>> =>
    api.post('/users/protected-data'),
}

export default authServices
