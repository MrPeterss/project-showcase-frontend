import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/services'

export interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  tokenRefreshTrigger: number
}

const initialState: UserState = {
  user: null,
  isLoading: true,
  error: null,
  tokenRefreshTrigger: 0,
}

/** Exported for unit tests — normalizes `{ isAdmin }` payloads from the backend. */
export const transformUser = (userData: unknown): User | null => {
  if (!userData || typeof userData !== 'object') return null

  const u = userData as Record<string, unknown>

  // If backend returns isAdmin boolean, convert to role
  if (u.isAdmin !== undefined && u.role === undefined) {
    return {
      ...(u as unknown as User),
      role: u.isAdmin ? 'ADMIN' : 'STUDENT',
    }
  }

  return userData as User
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<unknown>) => {
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
