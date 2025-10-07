import { api, type ApiResponse } from '@/lib/api'
import type { Semester, CreateSemesterData, UpdateSemesterData } from './types'

export const semesterServices = {
  // Get all semesters
  getAll: (): Promise<ApiResponse<Semester[]>> =>
    api.get('/semesters'),

  // Get semester by ID
  getById: (id: number): Promise<ApiResponse<Semester>> =>
    api.get(`/semesters/${id}`),

  // Create new semester
  create: (data: CreateSemesterData): Promise<ApiResponse<Semester>> =>
    api.post('/semesters', data),

  // Update semester
  update: (id: number, data: UpdateSemesterData): Promise<ApiResponse<Semester>> =>
    api.put(`/semesters/${id}`, data),

  // Delete semester
  delete: (id: number): Promise<ApiResponse<void>> =>
    api.delete(`/semesters/${id}`),
}

export default semesterServices
