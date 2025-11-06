import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User, Role } from '@/services'

export interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  tokenRefreshTrigger: number // Increment this to trigger user refresh
}

const initialState: UserState = {
  user: null,
  isLoading: true,
  error: null,
  tokenRefreshTrigger: 0,
}

// Transform backend user response to match frontend User type
const transformUser = (userData: any): User | null => {
  if (!userData) return null
  
  // If backend returns isAdmin boolean, convert to role
  if (userData.isAdmin !== undefined && !userData.role) {
    return {
      ...userData,
      role: userData.isAdmin ? 'ADMIN' : 'STUDENT' as Role,
    }
  }
  
  return userData as User
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.user = transformUser(action.payload)
      state.error = null
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearUser: (state) => {
      state.user = null
      state.error = null
    },

    triggerUserRefresh: (state) => {
      // Increment to trigger useEffect in useAuth hook
      state.tokenRefreshTrigger += 1
    },
  },
})

export const {
  setUser,
  setLoading,
  setError,
  clearUser,
  triggerUserRefresh,
} = userSlice.actions

export default userSlice.reducer
