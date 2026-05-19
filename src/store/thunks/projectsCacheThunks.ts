import { createAsyncThunk } from '@reduxjs/toolkit';
import { services } from '@/services';
import type { Project } from '@/services/types';
import type { Team } from '@/services/types';
import {
  setTeamProjectsLoading,
  setTeamProjects,
  setTeamProjectsError,
  setProjectDetailLoading,
  setProjectDetail,
  setProjectDetailError,
} from '../slices/projectsCacheSlice';
import { fetchTeamsByOffering, fetchMyTeamsByOffering } from './teamsThunks';

function normalizeTeamProjects(data: unknown): Project[] {
  if (Array.isArray(data)) return data as Project[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.projects)) return o.projects as Project[];
    if (Array.isArray(o.data)) return o.data as Project[];
  }
  return [];
}

export const fetchProjectsByTeam = createAsyncThunk(
  'projectsCache/fetchByTeam',
  async (teamId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setTeamProjectsLoading({ teamId, loading: true }));
      const response = await services.projects.getByTeam(teamId);
      const list = normalizeTeamProjects(response.data);
      dispatch(setTeamProjects({ teamId, projects: list }));
      return list;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load projects';
      dispatch(setTeamProjectsError({ teamId, error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setTeamProjectsLoading({ teamId, loading: false }));
    }
  },
);

export const fetchProjectById = createAsyncThunk(
  'projectsCache/fetchById',
  async (projectId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setProjectDetailLoading({ projectId, loading: true }));
      const response = await services.projects.getById(projectId);
      dispatch(
        setProjectDetail({ projectId, project: response.data }),
      );
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load project';
      dispatch(setProjectDetailError({ projectId, error: message }));
      return rejectWithValue(message);
    } finally {
      dispatch(setProjectDetailLoading({ projectId, loading: false }));
    }
  },
);

/** Replace React Query invalidation after deploy / migration / stop */
export const refreshCachesAfterProjectChange = createAsyncThunk(
  'projectsCache/refreshAfterProjectChange',
  async (team: Team, { dispatch }) => {
    await dispatch(fetchProjectsByTeam(team.id));
    if (team.courseOfferingId) {
      await dispatch(fetchTeamsByOffering(team.courseOfferingId));
      await dispatch(fetchMyTeamsByOffering(team.courseOfferingId));
    }
  },
);
