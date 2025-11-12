import { api, type ApiResponse } from '@/lib/api'
import type { Team, CreateTeamData, UpdateTeamData } from './types'

export const teamServices = {
  // Get team by ID
  getById: (teamId: number): Promise<ApiResponse<Team>> =>
    api.get(`/teams/${teamId}`),

  // Get teams for a course offering
  getByCourseOffering: (offeringId: number): Promise<ApiResponse<Team[]>> =>
    api.get(`/course-offerings/${offeringId}/teams`),

  // Get current user's teams for a course offering
  getMyTeams: (offeringId: number): Promise<ApiResponse<Team[]>> =>
    api.get(`/course-offerings/${offeringId}/teams/me`),

  // Create team for a course offering
  create: (offeringId: number, data: CreateTeamData): Promise<ApiResponse<Team>> =>
    api.post(`/course-offerings/${offeringId}/teams`, data),

  // Update team
  update: (teamId: number, data: UpdateTeamData): Promise<ApiResponse<Team>> =>
    api.put(`/teams/${teamId}`, data),

  // Delete team
  delete: (teamId: number): Promise<ApiResponse<void>> =>
    api.delete(`/teams/${teamId}`),
}

export default teamServices

