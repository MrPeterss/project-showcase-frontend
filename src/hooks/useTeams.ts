import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import type { CreateTeamData, UpdateTeamData } from '@/services/types'

export const teamKeys = {
	all: ['teams'] as const,
	lists: () => [...teamKeys.all, 'list'] as const,
	listByOffering: (offeringId: number) => [...teamKeys.lists(), { offeringId }] as const,
	listMyByOffering: (offeringId: number) =>
		[...teamKeys.lists(), { offeringId, mine: true }] as const,
	details: () => [...teamKeys.all, 'detail'] as const,
	detail: (id: number) => [...teamKeys.details(), id] as const,
}

export const useTeam = (teamId: number | undefined) => {
	return useQuery({
		queryKey: teamId ? teamKeys.detail(teamId) : teamKeys.detail(0),
		enabled: !!teamId,
		queryFn: async () => {
			const response = await services.teams.getById(teamId as number)
			return response.data
		},
	})
}

export const useTeamsByOffering = (offeringId: number | undefined) => {
	return useQuery({
		queryKey: offeringId
			? teamKeys.listByOffering(offeringId)
			: teamKeys.listByOffering(0),
		enabled: !!offeringId,
		queryFn: async () => {
			const response = await services.teams.getByCourseOffering(offeringId as number)
			return response.data
		},
	})
}

export const useMyTeamsByOffering = (offeringId: number | undefined) => {
	return useQuery({
		queryKey: offeringId
			? teamKeys.listMyByOffering(offeringId)
			: teamKeys.listMyByOffering(0),
		enabled: !!offeringId,
		queryFn: async () => {
			const response = await services.teams.getMyTeams(offeringId as number)
			return response.data
		},
	})
}

export const useCreateTeam = (offeringId: number) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: CreateTeamData) => services.teams.create(offeringId, data),
		onSuccess: (created) => {
			// Invalidate offering team lists (all and my)
			queryClient.invalidateQueries({ queryKey: teamKeys.listByOffering(offeringId) })
			queryClient.invalidateQueries({
				queryKey: teamKeys.listMyByOffering(offeringId),
			})
			// Seed detail cache
			queryClient.setQueryData(teamKeys.detail(created.data.id), created.data)
		},
	})
}

export const useUpdateTeam = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ teamId, data }: { teamId: number; data: UpdateTeamData }) =>
			services.teams.update(teamId, data),
		onSuccess: (updated, variables) => {
			// Update team detail cache
			queryClient.setQueryData(teamKeys.detail(variables.teamId), updated.data)
			// Invalidate all team lists (cheap enough, lists are small)
			queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
		},
	})
}

export const useDeleteTeam = (offeringId?: number) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (teamId: number) => services.teams.delete(teamId),
		onSuccess: (_, teamId) => {
			// Remove detail cache
			queryClient.removeQueries({ queryKey: teamKeys.detail(teamId) })
			// Invalidate related lists if offering context provided
			if (offeringId) {
				queryClient.invalidateQueries({ queryKey: teamKeys.listByOffering(offeringId) })
				queryClient.invalidateQueries({
					queryKey: teamKeys.listMyByOffering(offeringId),
				})
			} else {
				queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
			}
		},
	})
}

export const useTeamManagement = (offeringId?: number) => {
	const createTeam = offeringId ? useCreateTeam(offeringId) : null
	const updateTeam = useUpdateTeam()
	const deleteTeam = useDeleteTeam(offeringId)

	return {
		create: createTeam?.mutateAsync,
		update: (teamId: number, data: UpdateTeamData) =>
			updateTeam.mutateAsync({ teamId, data }),
		remove: deleteTeam.mutateAsync,
		isCreating: createTeam?.isPending,
		isUpdating: updateTeam.isPending,
		isDeleting: deleteTeam.isPending,
		createError: createTeam?.error,
		updateError: updateTeam.error,
		deleteError: deleteTeam.error,
	}
}


