import { createAsyncThunk } from '@reduxjs/toolkit'
import { services } from '@/services'
import type { CreateSemesterData, UpdateSemesterData } from '@/services'
import { 
  setLoading, 
  setError, 
  setCreating, 
  setUpdating, 
  setDeleting,
  setSemesters,
  addSemester,
  updateSemester,
  removeSemester
} from '../slices/semestersSlice'

// Fetch all semesters
export const fetchSemesters = createAsyncThunk(
  'semesters/fetchSemesters',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const response = await services.semesters.getAll()
      dispatch(setSemesters(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch semesters'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setLoading(false))
    }
  }
)

// Fetch semester by ID
export const fetchSemesterById = createAsyncThunk(
  'semesters/fetchSemesterById',
  async (semesterId: number, { dispatch }) => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const response = await services.semesters.getById(semesterId)
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch semester'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setLoading(false))
    }
  }
)

// Create new semester
export const createSemester = createAsyncThunk(
  'semesters/createSemester',
  async (semesterData: CreateSemesterData, { dispatch }) => {
    try {
      dispatch(setCreating(true))
      dispatch(setError(null))

      const response = await services.semesters.create(semesterData)
      dispatch(addSemester(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create semester'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setCreating(false))
    }
  }
)

// Update semester
export const updateSemesterById = createAsyncThunk(
  'semesters/updateSemester',
  async ({ id, data }: { id: number; data: UpdateSemesterData }, { dispatch }) => {
    try {
      dispatch(setUpdating(true))
      dispatch(setError(null))

      const response = await services.semesters.update(id, data)
      dispatch(updateSemester(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update semester'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setUpdating(false))
    }
  }
)

// Delete semester
export const deleteSemester = createAsyncThunk(
  'semesters/deleteSemester',
  async (semesterId: number, { dispatch }) => {
    try {
      dispatch(setDeleting(true))
      dispatch(setError(null))

      await services.semesters.delete(semesterId)
      dispatch(removeSemester(semesterId))
      return semesterId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete semester'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setDeleting(false))
    }
  }
)
