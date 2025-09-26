import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/services'

export interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  user: null,
  isLoading: true,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
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
  },
})

export const {
  setUser,
  setLoading,
  setError,
  clearUser,
} = userSlice.actions

export default userSlice.reducer
