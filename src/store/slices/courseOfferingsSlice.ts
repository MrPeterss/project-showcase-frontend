import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CourseOffering } from '@/services'

export interface CourseOfferingsState {
  offerings: CourseOffering[]
  loading: boolean
  error: string | null
  creating: boolean
  updating: boolean
  deleting: boolean
}

const initialState: CourseOfferingsState = {
  offerings: [],
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deleting: false,
}

const courseOfferingsSlice = createSlice({
  name: 'courseOfferings',
  initialState,
  reducers: {
    setOfferings(state, action: PayloadAction<CourseOffering[]>) {
      state.offerings = action.payload
    },
    addOffering(state, action: PayloadAction<CourseOffering>) {
      state.offerings.unshift(action.payload)
    },
    updateOffering(state, action: PayloadAction<CourseOffering>) {
      const idx = state.offerings.findIndex((o) => o.id === action.payload.id)
      if (idx !== -1) state.offerings[idx] = action.payload
    },
    removeOffering(state, action: PayloadAction<number>) {
      state.offerings = state.offerings.filter((o) => o.id !== action.payload)
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setCreating(state, action: PayloadAction<boolean>) {
      state.creating = action.payload
    },
    setUpdating(state, action: PayloadAction<boolean>) {
      state.updating = action.payload
    },
    setDeleting(state, action: PayloadAction<boolean>) {
      state.deleting = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const {
  setOfferings,
  addOffering,
  updateOffering,
  removeOffering,
  setLoading,
  setCreating,
  setUpdating,
  setDeleting,
  setError,
} = courseOfferingsSlice.actions

export default courseOfferingsSlice.reducer


