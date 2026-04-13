import api, { apiClient } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { SparkKey, SparkKeyStats, IssueSparkKeysData, IssueSparkKeyResult } from './types'

export const sparkServices = {
  getKeys: (offeringId: number): Promise<ApiResponse<SparkKey[]>> =>
    api.get(`/course-offerings/${offeringId}/spark/keys`),

  issueKeys: (
    offeringId: number,
    data: IssueSparkKeysData
  ): Promise<ApiResponse<IssueSparkKeyResult[]>> =>
    api.post(`/course-offerings/${offeringId}/spark/keys`, data),

  revokeKey: (offeringId: number, sparkKeyId: number): Promise<void> =>
    apiClient
      .delete(`/course-offerings/${offeringId}/spark/keys/${sparkKeyId}`)
      .then(() => undefined),

  getKeyStats: (offeringId: number, sparkKeyId: number): Promise<ApiResponse<SparkKeyStats>> =>
    api.get(`/course-offerings/${offeringId}/spark/keys/${sparkKeyId}/stats`),
}

export default sparkServices
