import { api, type ApiResponse } from '@/lib/api'
import type { Team, CreateTeamData, UpdateTeamData } from './types'

export const teamServices = {
  // Get teams for a course offering
  getByCourseOffering: (offeringId: number): Promise<ApiResponse<Team[]>> =>
    api.get(`/course-offerings/${offeringId}/teams`),

  // Create team for a course offering
  create: (offeringId: number, data: CreateTeamData): Promise<ApiResponse<Team>> =>
    api.post(`/course-offerings/${offeringId}/teams`, data),

  // Update team
  update: (offeringId: number, teamId: number, data: UpdateTeamData): Promise<ApiResponse<Team>> =>
    api.put(`/course-offerings/${offeringId}/teams/${teamId}`, data),

  // Delete team
  delete: (offeringId: number, teamId: number): Promise<ApiResponse<void>> =>
    api.delete(`/course-offerings/${offeringId}/teams/${teamId}`),
}

export default teamServices

