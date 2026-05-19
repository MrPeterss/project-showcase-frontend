import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  SparkKey,
  SparkKeyStats,
  SparkAggregatedKeysStats,
} from '@/services/types';

interface SparkState {
  keysByOfferingId: Record<number, SparkKey[]>;
  keysLoadingByOffering: Record<number, boolean>;
  keysErrorByOffering: Record<number, string | null>;
  aggregatedStatsByOffering: Record<number, SparkAggregatedKeysStats | undefined>;
  aggregatedLoadingByOffering: Record<number, boolean>;
  statsByKey: Record<string, SparkKeyStats>;
  statsLoadingByKey: Record<string, boolean>;
}

const initialState: SparkState = {
  keysByOfferingId: {},
  keysLoadingByOffering: {},
  keysErrorByOffering: {},
  aggregatedStatsByOffering: {},
  aggregatedLoadingByOffering: {},
  statsByKey: {},
  statsLoadingByKey: {},
};

function statsKey(offeringId: number, sparkKeyId: number) {
  return `${offeringId}:${sparkKeyId}`;
}

const sparkSlice = createSlice({
  name: 'spark',
  initialState,
  reducers: {
    setSparkKeysLoading(
      state,
      action: PayloadAction<{ offeringId: number; loading: boolean }>,
    ) {
      state.keysLoadingByOffering[action.payload.offeringId] =
        action.payload.loading;
    },
    setSparkKeys(
      state,
      action: PayloadAction<{ offeringId: number; keys: SparkKey[] }>,
    ) {
      state.keysByOfferingId[action.payload.offeringId] = action.payload.keys;
      state.keysErrorByOffering[action.payload.offeringId] = null;
    },
    setSparkKeysError(
      state,
      action: PayloadAction<{ offeringId: number; error: string | null }>,
    ) {
      state.keysErrorByOffering[action.payload.offeringId] = action.payload.error;
    },
    setSparkAggregatedLoading(
      state,
      action: PayloadAction<{ offeringId: number; loading: boolean }>,
    ) {
      state.aggregatedLoadingByOffering[action.payload.offeringId] =
        action.payload.loading;
    },
    setSparkAggregatedStats(
      state,
      action: PayloadAction<{
        offeringId: number;
        stats: SparkAggregatedKeysStats | undefined;
      }>,
    ) {
      state.aggregatedStatsByOffering[action.payload.offeringId] =
        action.payload.stats;
    },
    setSparkKeyStats(
      state,
      action: PayloadAction<{
        offeringId: number;
        sparkKeyId: number;
        stats: SparkKeyStats | undefined;
      }>,
    ) {
      const k = statsKey(
        action.payload.offeringId,
        action.payload.sparkKeyId,
      );
      if (action.payload.stats) {
        state.statsByKey[k] = action.payload.stats;
      } else {
        delete state.statsByKey[k];
      }
    },
    setSparkKeyStatsLoading(
      state,
      action: PayloadAction<{
        offeringId: number;
        sparkKeyId: number;
        loading: boolean;
      }>,
    ) {
      const k = statsKey(
        action.payload.offeringId,
        action.payload.sparkKeyId,
      );
      state.statsLoadingByKey[k] = action.payload.loading;
    },
    clearSparkForOffering(state, action: PayloadAction<number>) {
      const id = action.payload;
      delete state.keysByOfferingId[id];
      delete state.keysLoadingByOffering[id];
      delete state.keysErrorByOffering[id];
      delete state.aggregatedStatsByOffering[id];
      delete state.aggregatedLoadingByOffering[id];
    },
  },
});

export const {
  setSparkKeysLoading,
  setSparkKeys,
  setSparkKeysError,
  setSparkAggregatedLoading,
  setSparkAggregatedStats,
  setSparkKeyStats,
  setSparkKeyStatsLoading,
  clearSparkForOffering,
} = sparkSlice.actions;

export default sparkSlice.reducer;
