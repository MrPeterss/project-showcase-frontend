import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import type { CreateSemesterData, UpdateSemesterData } from '@/services/types'

// Query keys for React Query
export const semesterKeys = {
  all: ['semesters'] as const,
  lists: () => [...semesterKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...semesterKeys.lists(), { filters }] as const,
  details: () => [...semesterKeys.all, 'detail'] as const,
  detail: (id: number) => [...semesterKeys.details(), id] as const,
}

export const useSemesters = () => {
  return useQuery({
    queryKey: semesterKeys.list({}),
    queryFn: async () => {
      const response = await services.semesters.getAll()
      return response.data
    },
  })
}

export const useSemester = (id: number) => {
  return useQuery({
    queryKey: semesterKeys.detail(id),
    queryFn: async () => {
      const response = await services.semesters.getById(id)
      return response.data
    },
    enabled: !!id,
  })
}

export const useCreateSemester = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSemesterData) => services.semesters.create(data),
    onSuccess: (newSemester) => {
      // Invalidate and refetch semesters list
      queryClient.invalidateQueries({ queryKey: semesterKeys.lists() })
      
      // Add the new semester to the cache
      queryClient.setQueryData(semesterKeys.detail(newSemester.data.id), newSemester.data)
    },
  })
}

export const useUpdateSemester = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSemesterData }) =>
      services.semesters.update(id, data),
    onSuccess: (updatedSemester, variables) => {
      // Update the semester in cache
      queryClient.setQueryData(semesterKeys.detail(variables.id), updatedSemester.data)
      
      // Invalidate semesters list to ensure consistency
      queryClient.invalidateQueries({ queryKey: semesterKeys.lists() })
    },
  })
}

export const useDeleteSemester = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => services.semesters.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the semester from cache
      queryClient.removeQueries({ queryKey: semesterKeys.detail(deletedId) })
      
      // Invalidate semesters list
      queryClient.invalidateQueries({ queryKey: semesterKeys.lists() })
    },
  })
}

// Hook that combines all semester operations
export const useSemesterManagement = () => {
  const createSemester = useCreateSemester()
  const updateSemester = useUpdateSemester()
  const deleteSemester = useDeleteSemester()

  return {
    create: createSemester.mutateAsync,
    update: (id: number, data: UpdateSemesterData) => updateSemester.mutateAsync({ id, data }),
    remove: deleteSemester.mutateAsync,
    isCreating: createSemester.isPending,
    isUpdating: updateSemester.isPending,
    isDeleting: deleteSemester.isPending,
    createError: createSemester.error,
    updateError: updateSemester.error,
    deleteError: deleteSemester.error,
  }
}
