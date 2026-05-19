import { createAsyncThunk } from '@reduxjs/toolkit';
import { services } from '@/services';
import type {
  IssueSparkKeysData,
} from '@/services/types';
import {
  setSparkKeysLoading,
  setSparkKeys,
  setSparkKeysError,
  setSparkAggregatedLoading,
  setSparkAggregatedStats,
  setSparkKeyStatsLoading,
  setSparkKeyStats,
} from '../slices/sparkSlice';
function parseSparkKeysPayload(data: unknown): import('@/services/types').SparkKey[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.keys)) return obj.keys as import('@/services/types').SparkKey[];
    if (Array.isArray(obj.data)) return obj.data as import('@/services/types').SparkKey[];
  }
  return [];
}

export const fetchSparkKeysForOffering = createAsyncThunk(
  'spark/fetchKeys',
  async (offeringId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setSparkKeysLoading({ offeringId, loading: true }));
      const response = await services.spark.getKeys(offeringId);
      const keys = parseSparkKeysPayload(response.data);
      dispatch(setSparkKeys({ offeringId, keys }));
      return keys;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load Spark keys';
      dispatch(setSparkKeysError({ offeringId, error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setSparkKeysLoading({ offeringId, loading: false }));
    }
  },
);

export const fetchSparkAggregatedStats = createAsyncThunk(
  'spark/fetchAggregatedStats',
  async (offeringId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setSparkAggregatedLoading({ offeringId, loading: true }));
      const response = await services.spark.getAggregatedKeysStats(offeringId);
      const raw = response.data as unknown;
      let stats = raw as import('@/services/types').SparkAggregatedKeysStats;
      if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
        stats = (raw as { data: typeof stats }).data;
      }
      dispatch(setSparkAggregatedStats({ offeringId, stats }));
      return stats;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load stats',
      );
    } finally {
      dispatch(setSparkAggregatedLoading({ offeringId, loading: false }));
    }
  },
);

export const fetchSparkKeyStats = createAsyncThunk(
  'spark/fetchKeyStats',
  async (
    {
      offeringId,
      sparkKeyId,
    }: { offeringId: number; sparkKeyId: number },
    { dispatch },
  ) => {
    dispatch(
      setSparkKeyStatsLoading({
        offeringId,
        sparkKeyId,
        loading: true,
      }),
    );
    try {
      const response = await services.spark.getKeyStats(offeringId, sparkKeyId);
      const raw = response.data as unknown;
      let stats = raw as import('@/services/types').SparkKeyStats;
      if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
        stats = (raw as { data: typeof stats }).data;
      }
      dispatch(
        setSparkKeyStats({ offeringId, sparkKeyId, stats }),
      );
      return stats;
    } finally {
      dispatch(
        setSparkKeyStatsLoading({
          offeringId,
          sparkKeyId,
          loading: false,
        }),
      );
    }
  },
);

export const issueSparkKeys = createAsyncThunk(
  'spark/issueKeys',
  async (
    { offeringId, data }: { offeringId: number; data: IssueSparkKeysData },
    { dispatch },
  ) => {
    await services.spark.issueKeys(offeringId, data);
    await dispatch(fetchSparkKeysForOffering(offeringId));
    await dispatch(fetchSparkAggregatedStats(offeringId));
  },
);

export const revokeSparkKey = createAsyncThunk(
  'spark/revokeKey',
  async (
    {
      offeringId,
      sparkKeyId,
    }: { offeringId: number; sparkKeyId: number },
    { dispatch },
  ) => {
    await services.spark.revokeKey(offeringId, sparkKeyId);
    await dispatch(fetchSparkKeysForOffering(offeringId));
    dispatch(
      setSparkKeyStats({
        offeringId,
        sparkKeyId,
        stats: undefined,
      }),
    );
    await dispatch(fetchSparkAggregatedStats(offeringId));
  },
);

export const revokeSparkKeysBatch = createAsyncThunk(
  'spark/revokeMultiple',
  async (
    {
      offeringId,
      sparkKeyIds,
    }: { offeringId: number; sparkKeyIds: number[] },
    { dispatch },
  ) => {
    await Promise.all(
      sparkKeyIds.map((id) => services.spark.revokeKey(offeringId, id)),
    );
    await dispatch(fetchSparkKeysForOffering(offeringId));
    await dispatch(fetchSparkAggregatedStats(offeringId));
  },
);
