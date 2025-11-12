import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import type {
	CourseOffering,
	CreateCourseOfferingData,
	UpdateCourseOfferingData,
} from '@/services/types'

export const courseOfferingKeys = {
	all: ['course-offerings'] as const,
	lists: () => [...courseOfferingKeys.all, 'list'] as const,
	list: (filters?: Record<string, unknown>) =>
		[...courseOfferingKeys.lists(), { filters: filters || {} }] as const,
	details: () => [...courseOfferingKeys.all, 'detail'] as const,
	detail: (id: number) => [...courseOfferingKeys.details(), id] as const,
}

export const useCourseOfferings = (params?: { role?: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER' }) => {
	return useQuery({
		queryKey: courseOfferingKeys.list(params),
		queryFn: async () => {
			const response = await services.courseOfferings.getAll(params)
			return response.data
		},
	})
}

export const useCourseOffering = (id: number | undefined) => {
	return useQuery({
		queryKey: id ? courseOfferingKeys.detail(id) : courseOfferingKeys.detail(0),
		enabled: !!id,
		queryFn: async (): Promise<CourseOffering> => {
			const response = await services.courseOfferings.getById(id as number)
			return response.data
		},
	})
}

export const useCreateCourseOffering = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: CreateCourseOfferingData) => services.courseOfferings.create(data),
		onSuccess: (created) => {
			queryClient.invalidateQueries({ queryKey: courseOfferingKeys.lists() })
			queryClient.setQueryData(courseOfferingKeys.detail(created.data.id), created.data)
		},
	})
}

export const useUpdateCourseOffering = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateCourseOfferingData }) =>
			services.courseOfferings.update(id, data),
		onSuccess: (updated, vars) => {
			queryClient.setQueryData(courseOfferingKeys.detail(vars.id), updated.data)
			queryClient.invalidateQueries({ queryKey: courseOfferingKeys.lists() })
		},
	})
}

export const useDeleteCourseOffering = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => services.courseOfferings.delete(id),
		onSuccess: (_, id) => {
			queryClient.removeQueries({ queryKey: courseOfferingKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: courseOfferingKeys.lists() })
		},
	})
}


