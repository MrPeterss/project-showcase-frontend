import { createAsyncThunk } from '@reduxjs/toolkit'
import { services } from '@/services'
import type { CreateCourseOfferingData, UpdateCourseOfferingData } from '@/services'
import {
  setLoading,
  setError,
  setOfferings,
  addOffering,
  updateOffering,
  removeOffering,
  setCreating,
  setUpdating,
  setDeleting,
} from '../slices/courseOfferingsSlice'

// Fetch all course offerings (backend filters by user/admin)
export const fetchCourseOfferings = createAsyncThunk(
  'courseOfferings/fetchAll',
  async (filters: { role?: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER' } | undefined, { dispatch }) => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const response = await services.courseOfferings.getAll(filters)
      dispatch(setOfferings(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch course offerings'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setLoading(false))
    }
  }
)

// Create course offering (Admin)
export const createCourseOffering = createAsyncThunk(
  'courseOfferings/create',
  async (data: CreateCourseOfferingData, { dispatch }) => {
    try {
      dispatch(setCreating(true))
      dispatch(setError(null))

      const response = await services.courseOfferings.create(data)
      dispatch(addOffering(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create course offering'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setCreating(false))
    }
  }
)

// Update course offering (settings)
export const updateCourseOfferingById = createAsyncThunk(
  'courseOfferings/update',
  async ({ id, data }: { id: number; data: UpdateCourseOfferingData }, { dispatch }) => {
    try {
      dispatch(setUpdating(true))
      dispatch(setError(null))

      const response = await services.courseOfferings.update(id, data)
      dispatch(updateOffering(response.data))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update course offering'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setUpdating(false))
    }
  }
)

// Delete course offering
export const deleteCourseOffering = createAsyncThunk(
  'courseOfferings/delete',
  async (id: number, { dispatch }) => {
    try {
      dispatch(setDeleting(true))
      dispatch(setError(null))

      await services.courseOfferings.delete(id)
      dispatch(removeOffering(id))
      return id
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete course offering'
      dispatch(setError(errorMessage))
      throw error
    } finally {
      dispatch(setDeleting(false))
    }
  }
)


