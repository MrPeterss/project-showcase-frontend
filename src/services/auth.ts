import { api, type ApiResponse } from '@/lib/api'
import type { User } from './types'

// Auth Services
export const authServices = {
  syncUser: (): Promise<ApiResponse<User>> =>
    api.get('/teams/me'),
}

export default authServices
