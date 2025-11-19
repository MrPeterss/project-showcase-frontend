import { api, type ApiResponse } from '@/lib/api'
import type { Project, CreateProjectData, UpdateProjectData } from './types'
import type { ParsedLogLine } from './projects'

export interface DeployProjectData {
  teamId: number
  githubUrl: string
  dataFile?: File // Optional data file for deployment
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
  // Deploy a project (spin up container) - streaming version
  // Note: This returns a ReadableStream, not a Promise
  deployStreaming: async (
    data: DeployProjectData,
    onLog: (log: ParsedLogLine) => void,
    onComplete: (project: Project) => void,
    onError: (error: Error) => void,
    onStreamStarted?: () => void
  ): Promise<void> => {
    // Import dynamically to avoid circular dependencies
    const { apiClient } = await import('@/lib/api')
    const { tokenManager } = await import('@/lib/tokenManager')
    const accessToken = tokenManager.getToken()
    
    // Use fetch with axios configuration for streaming
    // Note: Axios doesn't support streaming responses in browsers, so we use fetch
    // but leverage axios configuration (baseURL, headers) for consistency
    // This endpoint uses FormData, not JSON
    const baseURL = apiClient.defaults.baseURL || '/api'
    const url = `${baseURL}/projects/deploy-streaming`
    
    // Create FormData for the request
    const formData = new FormData()
    formData.append('teamId', String(data.teamId))
    formData.append('githubUrl', data.githubUrl)
    
    // Only append dataFile if it's provided
    if (data.dataFile) {
      formData.append('dataFile', data.dataFile)
    }
    
    // Get headers from axios instance for consistency
    // Don't set Content-Type for FormData - browser will set it with boundary
    const headers: Record<string, string> = {
      ...(apiClient.defaults.headers.common as Record<string, string>),
    }
    
    // Remove Content-Type header to let browser set it with boundary for FormData
    delete headers['Content-Type']
    
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Deployment failed: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('No response body for streaming')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let logIdCounter = 0
    let hasCompleted = false

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue

          let jsonData = line.trim()
          if (jsonData.startsWith('data: ')) {
            jsonData = jsonData.substring(6).trim()
          }

          try {
            const parsed = JSON.parse(jsonData)
            
            // Handle "start" message - stream has started but don't display it
            if (parsed.type === 'start') {
              // Stream has started, notify callback but don't display this message
              if (onStreamStarted) {
                onStreamStarted()
              }
              // Continue to next line
              continue
            }

            // Handle build log messages
            if (parsed.type === 'log' && parsed.data) {
              // Extract the actual log message from the data field
              let logMessage = parsed.data
              
              // Strip ANSI color codes (e.g., \u001b[31m, \u001b[0m)
              logMessage = logMessage.replace(/\u001b\[[0-9;]*m/g, '')
              
              // Extract timestamp from the log message if present (format: 2025-11-18T19:07:07.421942198Z)
              const timestampMatch = logMessage.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/)
              let timestamp = ''
              let message = logMessage
              
              if (timestampMatch) {
                timestamp = timestampMatch[1]
                message = logMessage.substring(timestampMatch[0].length).trim()
              }
              
              // Determine log level based on stream and message content
              let level: 'INFO' | 'WARN' | 'ERROR'
              
              // stderr is typically errors
              if (parsed.stream === 'stderr') {
                level = 'ERROR'
              } else {
                // Check message content for warnings
                const messageUpper = message.toUpperCase()
                if (messageUpper.includes('WARNING') || messageUpper.includes('WARN')) {
                  level = 'WARN'
                } else if (messageUpper.includes('ERROR') || messageUpper.includes('ERR')) {
                  level = 'ERROR'
                } else {
                  level = 'INFO'
                }
              }

              logIdCounter += 1
              const parsedLog: ParsedLogLine = {
                id: logIdCounter,
                timestamp: timestamp || parsed.timestamp || new Date().toISOString(),
                message: message.trim(),
                level,
              }

              onLog(parsedLog)
            } else if (parsed.type === 'info' && parsed.project) {
              // Handle info messages (like project status updates)
              // These are informational, not actual build logs, so we can skip them
              // or show them as INFO level
              if (parsed.project) {
                // Skip project status updates as they're not build logs
                // They'll be handled by the completion handler
              }
            } else if (parsed.log || parsed.message) {
              // Fallback for other log formats
              const logMessage = parsed.log || parsed.message || jsonData
              const logLines = logMessage.split('\n').filter((l: string) => l.trim())

              logLines.forEach((logLine: string) => {
                logIdCounter += 1
                const timestampMatch = logLine.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/)
                let timestamp = ''
                let message = logLine
                let level: 'INFO' | 'WARN' | 'ERROR' | undefined

                if (timestampMatch) {
                  timestamp = timestampMatch[1]
                  message = logLine.substring(timestampMatch[0].length).trim()
                }

                const messageUpper = message.toUpperCase()
                if (messageUpper.includes('ERROR') || messageUpper.includes('ERR')) {
                  level = 'ERROR'
                } else if (messageUpper.includes('WARN') || messageUpper.includes('WARNING')) {
                  level = 'WARN'
                } else {
                  level = 'INFO'
                }

                const parsedLog: ParsedLogLine = {
                  id: logIdCounter,
                  timestamp: timestamp || new Date().toISOString(),
                  message: message || logLine,
                  level,
                }

                onLog(parsedLog)
              })
            }

            // Handle completion
            if (parsed.type === 'complete' || (parsed.project && !hasCompleted) || (parsed.id && parsed.gitHubLink && !hasCompleted)) {
              const project = parsed.project || parsed
              if (!hasCompleted) {
                hasCompleted = true
                onComplete(project)
                // Don't return - continue reading stream for any remaining logs
              }
            }
          } catch (parseError) {
            // Not JSON - treat as plain text log line
            const logMessage = jsonData.trim()
            if (logMessage) {
              // Strip ANSI color codes
              const cleanMessage = logMessage.replace(/\u001b\[[0-9;]*m/g, '')
              
              // Extract timestamp if present
              const timestampMatch = cleanMessage.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/)
              let timestamp = ''
              let message = cleanMessage
              
              if (timestampMatch) {
                timestamp = timestampMatch[1]
                message = cleanMessage.substring(timestampMatch[0].length).trim()
              }
              
              // Determine level
              const messageUpper = message.toUpperCase()
              let level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
              if (messageUpper.includes('ERROR') || messageUpper.includes('ERR')) {
                level = 'ERROR'
              } else if (messageUpper.includes('WARNING') || messageUpper.includes('WARN')) {
                level = 'WARN'
              }
              
              logIdCounter += 1
              onLog({
                id: logIdCounter,
                timestamp: timestamp || new Date().toISOString(),
                message: message.trim(),
                level,
              })
            }
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer)
          if (parsed.type === 'log' && parsed.data) {
            // Process remaining log in buffer
            let logMessage = parsed.data
            logMessage = logMessage.replace(/\u001b\[[0-9;]*m/g, '')
            const timestampMatch = logMessage.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/)
            let timestamp = ''
            let message = logMessage
            
            if (timestampMatch) {
              timestamp = timestampMatch[1]
              message = logMessage.substring(timestampMatch[0].length).trim()
            }
            
            let level: 'INFO' | 'WARN' | 'ERROR' = parsed.stream === 'stderr' ? 'ERROR' : 'INFO'
            const messageUpper = message.toUpperCase()
            if (messageUpper.includes('WARNING') || messageUpper.includes('WARN')) {
              level = 'WARN'
            } else if (messageUpper.includes('ERROR') || messageUpper.includes('ERR')) {
              level = 'ERROR'
            }
            
            logIdCounter += 1
            onLog({
              id: logIdCounter,
              timestamp: timestamp || parsed.timestamp || new Date().toISOString(),
              message: message.trim(),
              level,
            })
          } else if (parsed.project && !hasCompleted) {
            hasCompleted = true
            onComplete(parsed.project || parsed)
          }
        } catch {
          // Ignore parse errors for buffer
        }
      }
      
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Streaming error'))
    }
  },

  // Deploy a project (spin up container) - legacy non-streaming version
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

