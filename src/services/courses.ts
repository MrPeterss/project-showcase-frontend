import { api, type ApiResponse } from '@/lib/api'
import type { Course, CreateCourseData, UpdateCourseData } from './types'

export const courseServices = {
  // Get all courses (Admin only - returns course templates)
  getAll: (): Promise<ApiResponse<Course[]>> =>
    api.get('/courses'),

  // Get course by ID (Admin only)
  getById: (id: number): Promise<ApiResponse<Course>> =>
    api.get(`/courses/${id}`),

  // Create new course template (Admin only)
  create: (data: CreateCourseData): Promise<ApiResponse<Course>> =>
    api.post('/courses', data),

  // Update course template (Admin only)
  update: (id: number, data: UpdateCourseData): Promise<ApiResponse<Course>> =>
    api.put(`/courses/${id}`, data),

  // Delete course template (Admin only)
  delete: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/courses/${id}`),
}

export default courseServices
