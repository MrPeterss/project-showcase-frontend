import { useCallback, useRef, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  addBuildLogs,
  clearBuildLogs,
  setDeploying,
  setStreamStarted,
  setError,
  setDeployedProject,
  reset,
} from '@/store/slices/deploymentLogsSlice'
import { services } from '@/services'
import type { DeployProjectData } from '@/services/projects'
import type { Project } from '@/services/types'

interface UseStreamingDeployOptions {
  onComplete?: (project: Project) => void
  onError?: (error: Error) => void
}

/**
 * Hook for deploying a project with streaming build logs
 * Uses Redux for state management and axios-based service for streaming
 */
export function useStreamingDeploy(teamId: number, options?: UseStreamingDeployOptions) {
  const dispatch = useAppDispatch()
  const { buildLogs, isDeploying, streamStarted, error, deployedProject } = useAppSelector(
    (state) => state.deploymentLogs
  )
  const abortControllerRef = useRef<AbortController | null>(null)

  const deploy = useCallback(
    async (data: Omit<DeployProjectData, 'teamId'> & { dataFile?: File }) => {
      if (isDeploying) {
        return
      }

      // Abort any existing deployment
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      dispatch(setDeploying(true))
      dispatch(clearBuildLogs())

      try {
        await services.projects.deployStreaming(
          { ...data, teamId },
          (log) => {
            // Add log to Redux store
            dispatch(addBuildLogs([log]))
          },
          (project) => {
            // Deployment complete
            dispatch(setDeployedProject(project))
            if (options?.onComplete) {
              options.onComplete(project)
            }
          },
          (error) => {
            // Deployment error
            dispatch(setError(error.message))
            if (options?.onError) {
              options.onError(error)
            }
          },
          () => {
            // Stream started (received "start" message)
            dispatch(setStreamStarted(true))
          }
        )
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to start deployment')
        dispatch(setError(error.message))
        if (options?.onError) {
          options.onError(error)
        }
      }
    },
    [isDeploying, teamId, dispatch, options]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      dispatch(reset())
    }
  }, [dispatch])

  const clearLogs = useCallback(() => {
    dispatch(clearBuildLogs())
  }, [dispatch])

  return {
    deploy,
    isDeploying,
    streamStarted,
    buildLogs,
    error: error ? new Error(error) : null,
    deployedProject,
    clearLogs,
  }
}
