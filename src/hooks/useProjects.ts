import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import type { CreateProjectData, UpdateProjectData } from '@/services/types'
import type { DeployProjectData } from '@/services/projects'

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  listByTeam: (teamId: number) => [...projectKeys.lists(), { teamId }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  containers: () => [...projectKeys.all, 'containers'] as const,
  logs: (projectId: number) => [...projectKeys.detail(projectId), 'logs'] as const,
}

export const useProject = (projectId: number | undefined) => {
  return useQuery({
    queryKey: projectId ? projectKeys.detail(projectId) : projectKeys.detail(0),
    enabled: !!projectId,
    queryFn: async () => {
      const response = await services.projects.getById(projectId as number)
      return response.data
    },
  })
}

export const useProjectsByTeam = (teamId: number | undefined) => {
  return useQuery({
    queryKey: teamId
      ? projectKeys.listByTeam(teamId)
      : projectKeys.listByTeam(0),
    enabled: !!teamId,
    queryFn: async () => {
      const response = await services.projects.getByTeam(teamId as number)
      return response.data
    },
  })
}

export const useContainerLogs = (
  projectId: number | undefined,
  enabled: boolean = true,
  options?: { tail?: number; timestamps?: boolean }
) => {
  return useQuery({
    queryKey: projectId
      ? [...projectKeys.logs(projectId), options]
      : projectKeys.logs(0),
    enabled: !!projectId && enabled,
    queryFn: async () => {
      const response = await services.projects.getLogs(projectId as number, options)
      return response.data
    },
    // Don't auto-refetch logs - user can manually refresh if needed
    refetchInterval: false,
    // Don't refetch on mount/window focus for logs
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export const useContainers = () => {
  return useQuery({
    queryKey: projectKeys.containers(),
    queryFn: async () => {
      const response = await services.projects.listContainers()
      return response.data
    },
  })
}

export const useDeployProject = (teamId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<DeployProjectData, 'teamId'>) =>
      services.projects.deploy({ ...data, teamId }),
    onSuccess: (deployed) => {
      // Invalidate team projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.listByTeam(teamId) })
      // Seed detail cache
      queryClient.setQueryData(projectKeys.detail(deployed.data.id), deployed.data)
      // Invalidate containers list
      queryClient.invalidateQueries({ queryKey: projectKeys.containers() })
    },
  })
}

export const useDeployLegacyProject = (teamId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<DeployProjectData, 'teamId'>) =>
      services.projects.deployLegacy({ ...data, teamId }),
    onSuccess: (deployed) => {
      // Invalidate team projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.listByTeam(teamId) })
      // Seed detail cache
      queryClient.setQueryData(projectKeys.detail(deployed.data.id), deployed.data)
      // Invalidate containers list
      queryClient.invalidateQueries({ queryKey: projectKeys.containers() })
    },
  })
}

export const useStopProject = (teamId?: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: number) => services.projects.stop(projectId),
    onSuccess: (_, projectId) => {
      // Invalidate project detail
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      // Invalidate team projects list if team context provided
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.listByTeam(teamId) })
      } else {
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      }
      // Invalidate containers list
      queryClient.invalidateQueries({ queryKey: projectKeys.containers() })
    },
  })
}

export const useCreateProject = (teamId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CreateProjectData, 'teamId'>) =>
      services.projects.create({ ...data, teamId }),
    onSuccess: (created) => {
      // Invalidate team projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.listByTeam(teamId) })
      // Seed detail cache
      queryClient.setQueryData(projectKeys.detail(created.data.id), created.data)
    },
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: UpdateProjectData }) =>
      services.projects.update(projectId, data),
    onSuccess: (updated, variables) => {
      // Update project detail cache
      queryClient.setQueryData(projectKeys.detail(variables.projectId), updated.data)
      // Invalidate all project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export const useDeleteProject = (teamId?: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: number) => services.projects.delete(projectId),
    onSuccess: (_, projectId) => {
      // Remove detail cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) })
      // Invalidate related lists if team context provided
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.listByTeam(teamId) })
      } else {
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      }
    },
  })
}

export const useProjectManagement = (teamId?: number) => {
  const deployProject = teamId ? useDeployProject(teamId) : null
  const stopProject = useStopProject(teamId)
  const createProject = teamId ? useCreateProject(teamId) : null
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject(teamId)

  return {
    deploy: deployProject?.mutateAsync,
    stop: stopProject.mutateAsync,
    create: createProject?.mutateAsync,
    update: (projectId: number, data: UpdateProjectData) =>
      updateProject.mutateAsync({ projectId, data }),
    remove: deleteProject.mutateAsync,
    isDeploying: deployProject?.isPending,
    isStopping: stopProject.isPending,
    isCreating: createProject?.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,
    deployError: deployProject?.error,
    stopError: stopProject.error,
    createError: createProject?.error,
    updateError: updateProject.error,
    deleteError: deleteProject.error,
  }
}

