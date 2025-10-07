import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Course, CreateCourseData, UpdateCourseData } from '@/services'

export interface CoursesState {
  courses: Course[]
  selectedCourse: Course | null
  selectedSemesterId: string
  isLoading: boolean
  error: string | null
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

const initialState: CoursesState = {
  courses: [],
  selectedCourse: null,
  selectedSemesterId: '',
  isLoading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
}

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Course data management
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload
      state.error = null
    },

    addCourse: (state, action: PayloadAction<Course>) => {
      state.courses.push(action.payload)
      state.error = null
    },

    updateCourse: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(course => course.id === action.payload.id)
      if (index !== -1) {
        state.courses[index] = action.payload
      }
      state.error = null
    },

    removeCourse: (state, action: PayloadAction<number>) => {
      state.courses = state.courses.filter(course => course.id !== action.payload)
      state.error = null
    },

    // Selected course management
    setSelectedCourse: (state, action: PayloadAction<Course | null>) => {
      state.selectedCourse = action.payload
    },

    // Semester filtering
    setSelectedSemesterId: (state, action: PayloadAction<string>) => {
      state.selectedSemesterId = action.payload
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

    // Clear all courses data
    clearCourses: (state) => {
      state.courses = []
      state.selectedCourse = null
      state.selectedSemesterId = ''
      state.error = null
    },
  },
})

export const {
  setLoading,
  setError,
  setCourses,
  addCourse,
  updateCourse,
  removeCourse,
  setSelectedCourse,
  setSelectedSemesterId,
  setCreating,
  setUpdating,
  setDeleting,
  clearCourses,
} = coursesSlice.actions

export default coursesSlice.reducer
