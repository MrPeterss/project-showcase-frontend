import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Semester } from '@/services'

export interface SemestersState {
  semesters: Semester[]
  selectedSemester: Semester | null
  isLoading: boolean
  error: string | null
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

const initialState: SemestersState = {
  semesters: [],
  selectedSemester: null,
  isLoading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
}

const semestersSlice = createSlice({
  name: 'semesters',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Semester data management
    setSemesters: (state, action: PayloadAction<Semester[]>) => {
      state.semesters = action.payload
      state.error = null
    },

    addSemester: (state, action: PayloadAction<Semester>) => {
      state.semesters.push(action.payload)
      state.error = null
    },

    updateSemester: (state, action: PayloadAction<Semester>) => {
      const index = state.semesters.findIndex(semester => semester.id === action.payload.id)
      if (index !== -1) {
        state.semesters[index] = action.payload
      }
      state.error = null
    },

    removeSemester: (state, action: PayloadAction<number>) => {
      state.semesters = state.semesters.filter(semester => semester.id !== action.payload)
      state.error = null
    },

    // Selected semester management
    setSelectedSemester: (state, action: PayloadAction<Semester | null>) => {
      state.selectedSemester = action.payload
    },

    // Async operation states
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload
    },

    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.isUpdating = action.payload
    },

    setDeleting: (state, action: PayloadAction<boolean>) => {
      state.isDeleting = action.payload
    },

    // Clear all semesters data
    clearSemesters: (state) => {
      state.semesters = []
      state.selectedSemester = null
      state.error = null
    },
  },
})

export const {
  setLoading,
  setError,
  setSemesters,
  addSemester,
  updateSemester,
  removeSemester,
  setSelectedSemester,
  setCreating,
  setUpdating,
  setDeleting,
  clearSemesters,
} = semestersSlice.actions

export default semestersSlice.reducer
