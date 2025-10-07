import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import type { CreateCourseData, UpdateCourseData } from '@/services/types'

// Query keys for React Query
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...courseKeys.lists(), { filters }] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: number) => [...courseKeys.details(), id] as const,
}

export const useCourses = (filters?: { semesterId?: number }) => {
  return useQuery({
    queryKey: courseKeys.list(filters || {}),
    queryFn: async () => {
      if (filters?.semesterId) {
        return services.courses.getBySemester(filters.semesterId)
      }
      return services.courses.getAll()
    },
    select: (response) => response.data,
  })
}

export const useCourse = (id: number) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      const response = await services.courses.getById(id)
      return response.data
    },
    enabled: !!id,
  })
}

export const useCreateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCourseData) => services.courses.create(data),
    onSuccess: (newCourse) => {
      // Invalidate and refetch courses list
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      
      // Add the new course to the cache
      queryClient.setQueryData(courseKeys.detail(newCourse.data.id), newCourse.data)
    },
  })
}

export const useUpdateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCourseData }) =>
      services.courses.update(id, data),
    onSuccess: (updatedCourse, variables) => {
      // Update the course in cache
      queryClient.setQueryData(courseKeys.detail(variables.id), updatedCourse.data)
      
      // Invalidate courses list to ensure consistency
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

export const useDeleteCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => services.courses.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the course from cache
      queryClient.removeQueries({ queryKey: courseKeys.detail(deletedId) })
      
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

// Hook that combines all course operations
export const useCourseManagement = () => {
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  return {
    create: createCourse.mutateAsync,
    update: (id: number, data: UpdateCourseData) => updateCourse.mutateAsync({ id, data }),
    remove: deleteCourse.mutateAsync,
    isCreating: createCourse.isPending,
    isUpdating: updateCourse.isPending,
    isDeleting: deleteCourse.isPending,
    createError: createCourse.error,
    updateError: updateCourse.error,
    deleteError: deleteCourse.error,
  }
}
