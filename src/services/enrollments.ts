import { api, type ApiResponse } from '@/lib/api'
import type { Enrollment, CreateEnrollmentData, UpdateEnrollmentData } from './types'

export const enrollmentServices = {
  // Get enrollments for a course offering
  getByCourseOffering: (offeringId: number): Promise<ApiResponse<Enrollment[]>> =>
    api.get(`/course-offerings/${offeringId}/enrollments`),

  // Create enrollments for a course offering
  create: (offeringId: number, data: CreateEnrollmentData): Promise<ApiResponse<Enrollment[]>> =>
    api.post(`/course-offerings/${offeringId}/enrollments`, data),

  // Update user's enrollment role
  update: (offeringId: number, userId: number, data: UpdateEnrollmentData): Promise<ApiResponse<Enrollment>> =>
    api.put(`/course-offerings/${offeringId}/enrollments/${userId}`, data),

  // Delete enrollment
  delete: (offeringId: number, userId: number): Promise<ApiResponse<void>> =>
    api.delete(`/course-offerings/${offeringId}/enrollments/${userId}`),
}

export default enrollmentServices

