import { api, type ApiResponse } from '@/lib/api'
import type { Course, CreateCourseData, UpdateCourseData } from './types'

export const courseServices = {
  // Get all courses
  getAll: (): Promise<ApiResponse<Course[]>> =>
    api.get('/courses'),

  // Get course by ID
  getById: (id: number): Promise<ApiResponse<Course>> =>
    api.get(`/courses/${id}`),

  // Get courses by semester
  getBySemester: (semesterId: number): Promise<ApiResponse<Course[]>> =>
    api.get(`/courses?semesterId=${semesterId}`),

  // Create new course
  create: (data: CreateCourseData): Promise<ApiResponse<Course>> =>
    api.post('/courses', data),

  // Update course
  update: (id: number, data: UpdateCourseData): Promise<ApiResponse<Course>> =>
    api.put(`/courses/${id}`, data),

  // Delete course
  delete: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/courses/${id}`),
}

export default courseServices
