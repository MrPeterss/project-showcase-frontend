import { createAsyncThunk } from '@reduxjs/toolkit';
import { services } from '@/services';
import type { CreateTeamData, UpdateTeamData } from '@/services/types';
import {
  setTeamsLoading,
  setTeams,
  setTeamsError,
  setMyTeamsLoading,
  setMyTeams,
  setMyTeamsError,
  setTeamDetail,
  setTeamDetailLoading,
  setTeamDetailError,
} from '../slices/teamsSlice';

export const fetchTeamsByOffering = createAsyncThunk(
  'teams/fetchByOffering',
  async (offeringId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setTeamsLoading({ offeringId, isLoading: true }));
      const response = await services.teams.getByCourseOffering(offeringId);
      dispatch(setTeams({ offeringId, teams: response.data }));
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load teams';
      dispatch(setTeamsError({ offeringId, error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setTeamsLoading({ offeringId, isLoading: false }));
    }
  },
);

export const fetchMyTeamsByOffering = createAsyncThunk(
  'teams/fetchMyByOffering',
  async (offeringId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setMyTeamsLoading({ offeringId, isLoading: true }));
      const response = await services.teams.getMyTeams(offeringId);
      dispatch(setMyTeams({ offeringId, teams: response.data }));
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load teams';
      dispatch(setMyTeamsError({ offeringId, error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setMyTeamsLoading({ offeringId, isLoading: false }));
    }
  },
);

export const fetchTeamById = createAsyncThunk(
  'teams/fetchById',
  async (teamId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setTeamDetailLoading({ teamId, loading: true }));
      const response = await services.teams.getById(teamId);
      dispatch(setTeamDetail(response.data));
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load team';
      dispatch(setTeamDetailError({ teamId, error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setTeamDetailLoading({ teamId, loading: false }));
    }
  },
);

export const createTeamForOffering = createAsyncThunk(
  'teams/create',
  async (
    { offeringId, data }: { offeringId: number; data: CreateTeamData },
    { dispatch },
  ) => {
    const response = await services.teams.create(offeringId, data);
    await dispatch(fetchTeamsByOffering(offeringId));
    await dispatch(fetchMyTeamsByOffering(offeringId));
    return response.data;
  },
);

export const updateTeamByIdThunk = createAsyncThunk(
  'teams/update',
  async (
    {
      teamId,
      data,
      offeringId,
    }: { teamId: number; data: UpdateTeamData; offeringId?: number },
    { dispatch },
  ) => {
    const response = await services.teams.update(teamId, data);
    if (offeringId !== undefined) {
      await dispatch(fetchTeamsByOffering(offeringId));
      await dispatch(fetchMyTeamsByOffering(offeringId));
    }
    return response.data;
  },
);

export const deleteTeamThunk = createAsyncThunk(
  'teams/delete',
  async (
    { teamId, offeringId }: { teamId: number; offeringId: number },
    { dispatch },
  ) => {
    await services.teams.delete(teamId);
    await dispatch(fetchTeamsByOffering(offeringId));
    await dispatch(fetchMyTeamsByOffering(offeringId));
    return teamId;
  },
);
