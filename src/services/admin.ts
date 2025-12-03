import { api, type ApiResponse } from '@/lib/api'

// Common types
export interface AdminCourse {
  id: number
  name: string
  number: number
  department: string
}

export interface AdminSemester {
  id: number
  season: string
  year: number
}

export interface AdminCourseOffering {
  id: number
  course: AdminCourse
  semester: AdminSemester
}

export interface AdminTeam {
  id: number
  name: string
  courseOffering: AdminCourseOffering
}

export interface ProjectDataFile {
  fileName: string
  filePath: string
  size: number
  sizeFormatted: string
  created: string
  modified: string
}

export interface AdminProject {
  id: number
  githubUrl: string
  status: string
  tag?: string | null
  imageHash?: string | null
  imageName?: string | null
  containerId?: string | null
  containerName?: string | null
  dataFile?: ProjectDataFile | null
  deployedAt: string
  stoppedAt?: string | null
}

export interface TeamWithProjects {
  team: AdminTeam
  projects: AdminProject[]
}

export interface ProjectsResponse {
  totalProjects: number
  teams: TeamWithProjects[]
}

export interface PruneProjectResponse {
  message: string
  projectId: number
  errors?: string[]
}

export interface PruneResult {
  totalFound: number
  successCount: number
  errorCount: number
  errors: string[]
}

export interface PruneResponse {
  message: string
  result: PruneResult
}

export interface MigrateProjectData {
  projectName: string // Docker container name (e.g., "teamname_backend_flask_app")
  teamId: number
  githubUrl?: string // Optional: GitHub repository URL
}

export interface MigrateProjectResponse {
  message: string // "Project migrated successfully" | "Project updated successfully"
  alias: string // The assigned network alias
  project: AdminProject // Project object with team info
  containerId: string
  containerName: string
  ports: Record<string, any> // Port mappings
}

export const adminServices = {
  // Get all projects organized by team
  getProjects: (): Promise<ApiResponse<ProjectsResponse>> =>
    api.get('/admin/resources/projects'),

  // Prune a single project by ID
  pruneProject: (projectId: number): Promise<ApiResponse<PruneProjectResponse>> =>
    api.post(`/admin/projects/${projectId}/prune`),

  // Manual pruning (prune all untagged, non-running projects)
  pruneProjects: (): Promise<ApiResponse<PruneResponse>> =>
    api.post('/admin/projects/prune'),

  // Update user name (admin only)
  updateUserName: (
    userId: number,
    name: string | null
  ): Promise<
    ApiResponse<{
      message: string
      user: {
        id: number
        email: string
        name: string | null
        isAdmin: boolean
        createdAt: string
      }
    }>
  > => api.put(`/admin/users/${userId}/name`, { name }),

  // Migrate old project to new method (admin only)
  migrateProject: (
    data: MigrateProjectData
  ): Promise<ApiResponse<MigrateProjectResponse>> =>
    api.post('/admin/projects/migrate', data),
}

export default adminServices
