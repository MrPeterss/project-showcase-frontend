import { api, type ApiResponse } from '@/lib/api'
import type { Project, CreateProjectData, UpdateProjectData } from './types'

export interface DeployProjectData {
  teamId: number
  githubUrl: string
}

export interface ContainerLog {
  id: number
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
}

export interface ContainerLogsResponse {
  projectId: number
  containerId: string | null
  containerName: string | null
  status: string
  containerState?: {
    Status: string
    Running: boolean
    Paused: boolean
    Restarting: boolean
    OOMKilled: boolean
    Dead: boolean
    Pid: number
    ExitCode: number
    Error: string
    StartedAt: string
    FinishedAt: string
  }
  logs: string // Newline-separated log lines
}

export const projectServices = {
  // Deploy a project (spin up container)
  deploy: (data: DeployProjectData): Promise<ApiResponse<Project>> =>
    api.post('/projects/deploy', data, { timeout: 0 }), // no timeout

  // Deploy a legacy project (admin only)
  // Deploys Flask backend with MySQL database
  deployLegacy: (data: DeployProjectData): Promise<ApiResponse<Project>> =>
    api.post('/projects/deploy-legacy', data, { timeout: 0 }), // no timeout

  // Get project by ID
  getById: (projectId: number): Promise<ApiResponse<Project>> =>
    api.get(`/projects/${projectId}`),

  // Get all projects for a team
  getByTeam: (teamId: number): Promise<ApiResponse<Project[]>> =>
    api.get(`/projects/team/${teamId}`),

  // Stop a running container
  stop: (projectId: number): Promise<ApiResponse<void>> =>
    api.post(`/projects/${projectId}/stop`),

  // Get container logs
  // Optional query params: tail (number), since (timestamp), timestamps (boolean)
  getLogs: (
    projectId: number,
    options?: { tail?: number; since?: string; timestamps?: boolean }
  ): Promise<ApiResponse<ContainerLogsResponse>> => {
    const params = new URLSearchParams()
    if (options?.tail) params.append('tail', options.tail.toString())
    if (options?.since) params.append('since', options.since)
    if (options?.timestamps !== undefined)
      params.append('timestamps', options.timestamps.toString())

    const queryString = params.toString()
    const url = `/projects/${projectId}/logs${queryString ? `?${queryString}` : ''}`
    return api.get(url)
  },

  // List all running containers (admin only)
  listContainers: (): Promise<ApiResponse<Project[]>> =>
    api.get('/projects/containers'),

  // Create project
  create: (data: CreateProjectData): Promise<ApiResponse<Project>> =>
    api.post('/projects', data),

  // Update project
  update: (projectId: number, data: UpdateProjectData): Promise<ApiResponse<Project>> =>
    api.put(`/projects/${projectId}`, data),

  // Delete project
  delete: (projectId: number): Promise<ApiResponse<void>> =>
    api.delete(`/projects/${projectId}`),
}

export default projectServices

// Helper to parse log string into individual log entries
export interface ParsedLogLine {
  id: number
  timestamp: string
  message: string
  level?: 'INFO' | 'WARN' | 'ERROR'
}

export const parseLogs = (logsString: string): ParsedLogLine[] => {
  if (!logsString || !logsString.trim()) {
    return []
  }

  const lines = logsString.split('\n').filter((line) => line.trim())
  return lines.map((line, index) => {
    // Try to parse timestamp from the beginning of the line
    // Format: 2024-01-01T12:00:01.123Z message content
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/)
    let timestamp = ''
    let message = line
    let level: 'INFO' | 'WARN' | 'ERROR' | undefined

    if (timestampMatch) {
      timestamp = timestampMatch[1]
      message = line.substring(timestampMatch[0].length).trim()
    }

    // Try to detect log level from message
    const messageUpper = message.toUpperCase()
    if (messageUpper.includes('ERROR') || messageUpper.includes('ERR')) {
      level = 'ERROR'
    } else if (messageUpper.includes('WARN') || messageUpper.includes('WARNING')) {
      level = 'WARN'
    } else {
      level = 'INFO'
    }

    return {
      id: index + 1,
      timestamp: timestamp || new Date().toISOString(),
      message: message || line,
      level,
    }
  })
}

