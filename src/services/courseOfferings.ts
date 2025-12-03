import { api, type ApiResponse } from '@/lib/api'
import type { CourseOffering, CreateCourseOfferingData, UpdateCourseOfferingData } from './types'

export const courseOfferingServices = {
  // Get all course offerings (filtered by user enrollment, or all if admin)
  getAll: (params?: { role?: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER' }): Promise<ApiResponse<CourseOffering[]>> =>
    api.get('/course-offerings', { params }),

  // Get course offering by ID
  getById: (id: number): Promise<ApiResponse<CourseOffering>> =>
    api.get(`/course-offerings/${id}`),

  // Create new course offering (Admin only)
  create: (data: CreateCourseOfferingData): Promise<ApiResponse<CourseOffering>> =>
    api.post('/course-offerings', data),

  // Update course offering (Admin or Instructor)
  update: (id: number, data: UpdateCourseOfferingData): Promise<ApiResponse<CourseOffering>> =>
    api.put(`/course-offerings/${id}`, data),

  // Delete course offering (Admin only)
  delete: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/course-offerings/${id}`),

  // Lock course offering deployments (Admin or Instructor)
  lock: (id: number): Promise<ApiResponse<CourseOffering>> =>
    api.post(`/course-offerings/${id}/lock`),

  // Unlock course offering deployments (Admin or Instructor)
  unlock: (id: number): Promise<ApiResponse<CourseOffering>> =>
    api.post(`/course-offerings/${id}/unlock`),
}

export default courseOfferingServices

