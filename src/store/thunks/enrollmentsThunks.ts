import { createAsyncThunk } from '@reduxjs/toolkit';
import { services } from '@/services';
import type {
  CreateEnrollmentData,
} from '@/services/types';
import {
  setEnrollmentsLoading,
  setEnrollments,
  setEnrollmentsError,
} from '../slices/enrollmentsSlice';
import {
  fetchTeamsByOffering,
} from './teamsThunks';

export const fetchEnrollmentsByOffering = createAsyncThunk(
  'enrollments/fetchByOffering',
  async (offeringId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(
        setEnrollmentsLoading({ offeringId, loading: true }),
      );
      const response =
        await services.enrollments.getByCourseOffering(offeringId);
      dispatch(
        setEnrollments({ offeringId, enrollments: response.data }),
      );
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load enrollments';
      dispatch(setEnrollmentsError({ offeringId, error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(
        setEnrollmentsLoading({ offeringId, loading: false }),
      );
    }
  },
);

export const createEnrollmentsForOffering = createAsyncThunk(
  'enrollments/create',
  async (
    {
      offeringId,
      data,
    }: { offeringId: number; data: CreateEnrollmentData },
    { dispatch },
  ) => {
    await services.enrollments.create(offeringId, data);
    await dispatch(fetchEnrollmentsByOffering(offeringId));
    await dispatch(fetchTeamsByOffering(offeringId));
  },
);

export const deleteEnrollmentForOffering = createAsyncThunk(
  'enrollments/delete',
  async (
    {
      offeringId,
      userId,
    }: { offeringId: number; userId: number },
    { dispatch },
  ) => {
    await services.enrollments.delete(offeringId, userId);
    await dispatch(fetchEnrollmentsByOffering(offeringId));
    await dispatch(fetchTeamsByOffering(offeringId));
  },
);
