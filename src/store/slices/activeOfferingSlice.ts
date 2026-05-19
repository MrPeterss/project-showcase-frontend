import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { services } from '@/services';
import type { CourseOffering } from '@/services/types';

export const fetchActiveOffering = createAsyncThunk(
  'activeOffering/fetch',
  async (offeringId: number, { rejectWithValue }) => {
    try {
      const response = await services.courseOfferings.getById(offeringId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load course offering',
      );
    }
  },
);

interface ActiveOfferingState {
  offering: CourseOffering | null;
  loading: boolean;
  error: string | null;
}

const initialState: ActiveOfferingState = {
  offering: null,
  loading: true,
  error: null,
};

const activeOfferingSlice = createSlice({
  name: 'activeOffering',
  initialState,
  reducers: {
    clearActiveOffering(state) {
      state.offering = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveOffering.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchActiveOffering.fulfilled,
        (state, action: PayloadAction<CourseOffering>) => {
          state.loading = false;
          state.offering = action.payload;
        },
      )
      .addCase(fetchActiveOffering.rejected, (state, action) => {
        state.loading = false;
        state.offering = null;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          'Failed to load course';
      });
  },
});

export const { clearActiveOffering } = activeOfferingSlice.actions;
export default activeOfferingSlice.reducer;
