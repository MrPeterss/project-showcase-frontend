import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import type {
	CreateEnrollmentData,
	UpdateEnrollmentData,
} from '@/services/types'

export const enrollmentKeys = {
	all: ['enrollments'] as const,
	lists: () => [...enrollmentKeys.all, 'list'] as const,
	listByOffering: (offeringId: number) => [...enrollmentKeys.lists(), { offeringId }] as const,
	details: () => [...enrollmentKeys.all, 'detail'] as const,
	detail: (offeringId: number, userId: number) =>
		[...enrollmentKeys.details(), { offeringId, userId }] as const,
}

export const useEnrollmentsByOffering = (offeringId: number | undefined) => {
	return useQuery({
		queryKey: offeringId
			? enrollmentKeys.listByOffering(offeringId)
			: enrollmentKeys.listByOffering(0),
		enabled: !!offeringId,
		queryFn: async () => {
			const response = await services.enrollments.getByCourseOffering(offeringId as number)
			return response.data
		},
	})
}

export const useCreateEnrollments = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ offeringId, data }: { offeringId: number; data: CreateEnrollmentData }) =>
			services.enrollments.create(offeringId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: enrollmentKeys.listByOffering(variables.offeringId),
			})
		},
	})
}

export const useUpdateEnrollment = (offeringId: number, userId: number) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: UpdateEnrollmentData) =>
			services.enrollments.update(offeringId, userId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: enrollmentKeys.listByOffering(offeringId),
			})
		},
	})
}

export const useDeleteEnrollment = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ offeringId, userId }: { offeringId: number; userId: number }) =>
			services.enrollments.delete(offeringId, userId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: enrollmentKeys.listByOffering(variables.offeringId),
			})
		},
	})
}


