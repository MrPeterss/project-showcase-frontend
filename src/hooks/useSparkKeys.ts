import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import type {
  IssueSparkKeysData,
  SparkKey,
  SparkKeyStats,
  SparkAggregatedKeysStats,
} from '@/services/types'

export const sparkKeys = {
  all: ['spark'] as const,
  lists: () => [...sparkKeys.all, 'list'] as const,
  listByOffering: (offeringId: number) =>
    [...sparkKeys.lists(), { offeringId }] as const,
  stats: () => [...sparkKeys.all, 'stats'] as const,
  statsByKey: (offeringId: number, sparkKeyId: number) =>
    [...sparkKeys.stats(), { offeringId, sparkKeyId }] as const,
  aggregatedStatsByOffering: (offeringId: number) =>
    [...sparkKeys.stats(), 'aggregated', { offeringId }] as const,
}

export const useSparkKeys = (offeringId: number | undefined) => {
  return useQuery({
    queryKey: offeringId
      ? sparkKeys.listByOffering(offeringId)
      : sparkKeys.listByOffering(0),
    enabled: !!offeringId,
    queryFn: async (): Promise<SparkKey[]> => {
      const response = await services.spark.getKeys(offeringId as number)
      const result = response.data as unknown
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object') {
        const obj = result as Record<string, unknown>
        if (Array.isArray(obj.keys)) return obj.keys as SparkKey[]
        if (Array.isArray(obj.data)) return obj.data as SparkKey[]
      }
      return []
    },
  })
}

export const useSparkKeyStats = (
  offeringId: number | undefined,
  sparkKeyId: number | undefined
) => {
  return useQuery({
    queryKey:
      offeringId && sparkKeyId
        ? sparkKeys.statsByKey(offeringId, sparkKeyId)
        : sparkKeys.statsByKey(0, 0),
    enabled: !!offeringId && !!sparkKeyId,
    queryFn: async (): Promise<SparkKeyStats> => {
      const response = await services.spark.getKeyStats(
        offeringId as number,
        sparkKeyId as number
      )
      const result = response.data as unknown
      if (result && typeof result === 'object' && 'keyId' in (result as object)) {
        return result as SparkKeyStats
      }
      if (result && typeof result === 'object' && 'data' in (result as object)) {
        return (result as any).data as SparkKeyStats
      }
      return result as SparkKeyStats
    },
  })
}

export const useSparkAggregatedKeysStats = (offeringId: number | undefined) => {
  return useQuery({
    queryKey: offeringId
      ? sparkKeys.aggregatedStatsByOffering(offeringId)
      : sparkKeys.aggregatedStatsByOffering(0),
    enabled: !!offeringId,
    queryFn: async (): Promise<SparkAggregatedKeysStats> => {
      const response = await services.spark.getAggregatedKeysStats(
        offeringId as number,
      )
      const result = response.data as unknown
      if (result && typeof result === 'object' && 'totalRequests' in (result as object)) {
        return result as SparkAggregatedKeysStats
      }
      if (result && typeof result === 'object' && 'data' in (result as object)) {
        return (result as { data: SparkAggregatedKeysStats }).data
      }
      return result as SparkAggregatedKeysStats
    },
  })
}

export const useIssueSparkKeys = (offeringId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: IssueSparkKeysData) =>
      services.spark.issueKeys(offeringId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sparkKeys.listByOffering(offeringId),
      })
      queryClient.invalidateQueries({
        queryKey: sparkKeys.aggregatedStatsByOffering(offeringId),
      })
    },
  })
}

export const useRevokeSparkKey = (offeringId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sparkKeyId: number) =>
      services.spark.revokeKey(offeringId, sparkKeyId),
    onSuccess: (_data, sparkKeyId) => {
      queryClient.invalidateQueries({
        queryKey: sparkKeys.listByOffering(offeringId),
      })
      queryClient.removeQueries({
        queryKey: sparkKeys.statsByKey(offeringId, sparkKeyId),
      })
      queryClient.invalidateQueries({
        queryKey: sparkKeys.aggregatedStatsByOffering(offeringId),
      })
    },
  })
}

export const useRevokeMultipleSparkKeys = (offeringId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sparkKeyIds: number[]) => {
      await Promise.all(
        sparkKeyIds.map((id) => services.spark.revokeKey(offeringId, id))
      )
    },
    onSuccess: (_data, sparkKeyIds) => {
      queryClient.invalidateQueries({
        queryKey: sparkKeys.listByOffering(offeringId),
      })
      sparkKeyIds.forEach((sparkKeyId) => {
        queryClient.removeQueries({
          queryKey: sparkKeys.statsByKey(offeringId, sparkKeyId),
        })
      })
      queryClient.invalidateQueries({
        queryKey: sparkKeys.aggregatedStatsByOffering(offeringId),
      })
    },
  })
}
