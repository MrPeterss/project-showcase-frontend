import { createAsyncThunk } from '@reduxjs/toolkit'
import { services } from '@/services'
import type { CreateCourseData, UpdateCourseData } from '@/services'
import { 
  setLoading, 
  setError, 
  setCreating, 
  setUpdating, 
  setDeleting,
  setCourses,
  addCourse,
  updateCourse,
  removeCourse
} from '../slices/coursesSlice'

// Fetch all courses
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (filters: { semesterId?: number } | undefined, { dispatch }) => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      let response
      if (filters?.semesterId) {
        response = await services.courses.getBySemester(filters.semesterId)
      } else {
        response = await services.courses.getAll()
      }

      dispatch(setCourses(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courses'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setLoading(false))
    }
  }
)

// Fetch course by ID
export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (courseId: number, { dispatch }) => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const response = await services.courses.getById(courseId)
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch course'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setLoading(false))
    }
  }
)

// Create new course
export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData: CreateCourseData, { dispatch }) => {
    try {
      dispatch(setCreating(true))
      dispatch(setError(null))

      const response = await services.courses.create(courseData)
      dispatch(addCourse(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create course'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setCreating(false))
    }
  }
)

// Update course
export const updateCourseById = createAsyncThunk(
  'courses/updateCourse',
  async ({ id, data }: { id: number; data: UpdateCourseData }, { dispatch }) => {
    try {
      dispatch(setUpdating(true))
      dispatch(setError(null))

      const response = await services.courses.update(id, data)
      dispatch(updateCourse(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update course'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setUpdating(false))
    }
  }
)

// Delete course
export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (courseId: number, { dispatch }) => {
    try {
      dispatch(setDeleting(true))
      dispatch(setError(null))

      await services.courses.delete(courseId)
      dispatch(removeCourse(courseId))
      return courseId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete course'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setDeleting(false))
    }
  }
)
