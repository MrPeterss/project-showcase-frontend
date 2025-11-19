import { useEffect, useRef, useState, useCallback } from 'react'
import { tokenManager } from '@/lib/tokenManager'
import { createEventSource, closeEventSource } from '@/lib/streaming'
import type { ParsedLogLine } from '@/services/projects'

// Base API URL - matches api.ts
const API_BASE_URL = '/api'

/**
 * Hook for streaming build logs during deployment
 */
export function useStreamingBuildLogs(
  projectId: number | undefined,
  enabled: boolean = true
) {
  const [logs, setLogs] = useState<ParsedLogLine[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const logIdCounterRef = useRef(0)

  useEffect(() => {
    if (!enabled || !projectId) {
      // Clear logs when disabled
      if (!enabled) {
        setLogs([])
        setIsStreaming(false)
      }
      return
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      closeEventSource(eventSourceRef.current)
    }

    setIsStreaming(true)
    setError(null)
    setLogs([]) // Clear previous logs when starting new stream
    logIdCounterRef.current = 0

    const url = `${API_BASE_URL}/projects/${projectId}/build-logs/stream`
    const eventSource = createEventSource(
      url,
      (data: string) => {
        try {
          // Parse the incoming log line
          const lines = data.split('\n').filter((line: string) => line.trim())
          const newLogs: ParsedLogLine[] = lines.map((line: string) => {
            logIdCounterRef.current += 1
            const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/)
            let timestamp = ''
            let message = line
            let level: 'INFO' | 'WARN' | 'ERROR' | undefined

            if (timestampMatch) {
              timestamp = timestampMatch[1]
              message = line.substring(timestampMatch[0].length).trim()
            }

            const messageUpper = message.toUpperCase()
            if (messageUpper.includes('ERROR') || messageUpper.includes('ERR')) {
              level = 'ERROR'
            } else if (messageUpper.includes('WARN') || messageUpper.includes('WARNING')) {
              level = 'WARN'
            } else {
              level = 'INFO'
            }

            return {
              id: logIdCounterRef.current,
              timestamp: timestamp || new Date().toISOString(),
              message: message || line,
              level,
            }
          })

          setLogs((prev) => [...prev, ...newLogs])
        } catch (err) {
          console.error('Error parsing log data:', err)
        }
      },
      (err: Event) => {
        console.error('EventSource error:', err)
        setError(new Error('Failed to stream build logs'))
        setIsStreaming(false)
      },
      () => {
        setIsStreaming(true)
      }
    )

    eventSourceRef.current = eventSource

    return () => {
      closeEventSource(eventSourceRef.current)
      eventSourceRef.current = null
      setIsStreaming(false)
    }
  }, [enabled, projectId])

  const clearLogs = useCallback(() => {
    setLogs([])
    logIdCounterRef.current = 0
  }, [])

  return { logs, isStreaming, error, clearLogs }
}

/**
 * Hook for streaming container logs
 * Uses fetch with Authorization header (not EventSource with URL params)
 */
export function useStreamingContainerLogs(
  projectId: number | undefined,
  enabled: boolean = true,
  options?: { tail?: number; timestamps?: boolean }
) {
  const [logs, setLogs] = useState<ParsedLogLine[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const logIdCounterRef = useRef(0)

  useEffect(() => {
    if (!enabled || !projectId) {
      // Clear logs when disabled
      if (!enabled) {
        setLogs([])
        setIsStreaming(false)
      }
      return
    }

    // Abort existing request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsStreaming(true)
    setError(null)
    setLogs([]) // Clear previous logs when starting new stream
    logIdCounterRef.current = 0

    // Build query params
    const params = new URLSearchParams()
    if (options?.tail) params.append('tail', options.tail.toString())
    if (options?.timestamps !== undefined)
      params.append('timestamps', options.timestamps.toString())

    const queryString = params.toString()
    const url = `${API_BASE_URL}/projects/${projectId}/logs${queryString ? `?${queryString}` : ''}`

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const accessToken = tokenManager.getToken()

    fetch(url, {
      method: 'GET',
      headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to stream logs: ${response.statusText}`)
        }

        if (!response.body) {
          throw new Error('No response body for streaming')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                break
              }

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || '' // Keep incomplete line in buffer

              for (const line of lines) {
                if (!line.trim()) continue

                // Handle SSE format: "data: {...}" or just plain text
                let logData = line
                if (line.startsWith('data: ')) {
                  logData = line.substring(6)
                }

                try {
                  // Try to parse as JSON first (for structured log format)
                  const parsed = JSON.parse(logData)
                  
                  if (parsed.type === 'log' && parsed.data) {
                    // Extract the actual log message from the data field
                    let logMessage = parsed.data
                    
                    // Strip ANSI color codes (e.g., \u001b[31m, \u001b[0m)
                    logMessage = logMessage.replace(/\u001b\[[0-9;]*m/g, '')
                    
                    // Extract timestamp from the log message if present
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

                    logIdCounterRef.current += 1
                    setLogs((prev) => [...prev, {
                      id: logIdCounterRef.current,
                      timestamp: timestamp || parsed.timestamp || new Date().toISOString(),
                      message: message.trim(),
                      level,
                    }])
                  } else {
                    // Fallback: treat as plain log line
                    logIdCounterRef.current += 1
                    setLogs((prev) => [...prev, {
                      id: logIdCounterRef.current,
                      timestamp: new Date().toISOString(),
                      message: logData.trim(),
                      level: 'INFO',
                    }])
                  }
                } catch {
                  // Not JSON, treat as plain log line
                  const logLines = logData.split('\n').filter((l) => l.trim())
                  const newLogs: ParsedLogLine[] = logLines.map((line) => {
                    logIdCounterRef.current += 1
                    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/)
                    let timestamp = ''
                    let message = line
                    let level: 'INFO' | 'WARN' | 'ERROR' | undefined

                    if (timestampMatch) {
                      timestamp = timestampMatch[1]
                      message = line.substring(timestampMatch[0].length).trim()
                    }

                    const messageUpper = message.toUpperCase()
                    if (messageUpper.includes('ERROR') || messageUpper.includes('ERR')) {
                      level = 'ERROR'
                    } else if (messageUpper.includes('WARN') || messageUpper.includes('WARNING')) {
                      level = 'WARN'
                    } else {
                      level = 'INFO'
                    }

                    return {
                      id: logIdCounterRef.current,
                      timestamp: timestamp || new Date().toISOString(),
                      message: message || line,
                      level,
                    }
                  })

                  setLogs((prev) => [...prev, ...newLogs])
                }
              }
            }

            // Handle any remaining buffer
            if (buffer.trim()) {
              const logLines = buffer.split('\n').filter((l) => l.trim())
              const newLogs: ParsedLogLine[] = logLines.map((line) => {
                logIdCounterRef.current += 1
                return {
                  id: logIdCounterRef.current,
                  timestamp: new Date().toISOString(),
                  message: line,
                  level: 'INFO' as const,
                }
              })
              if (newLogs.length > 0) {
                setLogs((prev) => [...prev, ...newLogs])
              }
            }

            setIsStreaming(false)
          } catch (streamError) {
            if (streamError instanceof Error && streamError.name === 'AbortError') {
              // Request was aborted, don't set error
              return
            }
            const error = streamError instanceof Error ? streamError : new Error('Streaming error')
            setError(error)
            setIsStreaming(false)
          }
        }

        readStream()
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // Request was aborted, don't set error
          return
        }
        const error = err instanceof Error ? err : new Error('Failed to start streaming')
        setError(error)
        setIsStreaming(false)
      })

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsStreaming(false)
    }
  }, [enabled, projectId, options?.tail, options?.timestamps])

  const clearLogs = useCallback(() => {
    setLogs([])
    logIdCounterRef.current = 0
  }, [])

  return { logs, isStreaming, error, clearLogs }
}

