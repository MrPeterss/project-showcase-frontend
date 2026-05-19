import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Enrollment } from '@/services/types';

interface EnrollmentsState {
  byOfferingId: Record<number, Enrollment[]>;
  loadingByOffering: Record<number, boolean>;
  errorByOffering: Record<number, string | null>;
}

const initialState: EnrollmentsState = {
  byOfferingId: {},
  loadingByOffering: {},
  errorByOffering: {},
};

const enrollmentsSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {
    setEnrollmentsLoading(
      state,
      action: PayloadAction<{ offeringId: number; loading: boolean }>,
    ) {
      state.loadingByOffering[action.payload.offeringId] = action.payload.loading;
    },
    setEnrollments(
      state,
      action: PayloadAction<{ offeringId: number; enrollments: Enrollment[] }>,
    ) {
      state.byOfferingId[action.payload.offeringId] = action.payload.enrollments;
      state.errorByOffering[action.payload.offeringId] = null;
    },
    setEnrollmentsError(
      state,
      action: PayloadAction<{ offeringId: number; error: string | null }>,
    ) {
      state.errorByOffering[action.payload.offeringId] = action.payload.error;
    },
    clearEnrollmentsForOffering(state, action: PayloadAction<number>) {
      delete state.byOfferingId[action.payload];
      delete state.loadingByOffering[action.payload];
      delete state.errorByOffering[action.payload];
    },
  },
});

export const {
  setEnrollmentsLoading,
  setEnrollments,
  setEnrollmentsError,
  clearEnrollmentsForOffering,
} = enrollmentsSlice.actions;

export default enrollmentsSlice.reducer;
