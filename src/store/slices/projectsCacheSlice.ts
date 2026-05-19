import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Project } from '@/services/types';

interface ProjectsCacheState {
  /** Projects list per team (from getByTeam) */
  listsByTeamId: Record<number, Project[] | null>;
  loadingByTeamId: Record<number, boolean>;
  errorByTeamId: Record<number, string | null>;
  /** Single project detail cache */
  byId: Record<number, Project | null>;
  loadingById: Record<number, boolean>;
  errorById: Record<number, string | null>;
}

const initialState: ProjectsCacheState = {
  listsByTeamId: {},
  loadingByTeamId: {},
  errorByTeamId: {},
  byId: {},
  loadingById: {},
  errorById: {},
};

const projectsCacheSlice = createSlice({
  name: 'projectsCache',
  initialState,
  reducers: {
    setTeamProjectsLoading(
      state,
      action: PayloadAction<{ teamId: number; loading: boolean }>,
    ) {
      state.loadingByTeamId[action.payload.teamId] = action.payload.loading;
    },
    setTeamProjects(
      state,
      action: PayloadAction<{ teamId: number; projects: Project[] | null }>,
    ) {
      const { teamId, projects } = action.payload;
      state.listsByTeamId[teamId] = projects;
      state.errorByTeamId[teamId] = null;
    },
    setTeamProjectsError(
      state,
      action: PayloadAction<{ teamId: number; error: string | null }>,
    ) {
      state.errorByTeamId[action.payload.teamId] = action.payload.error;
    },
    setProjectDetailLoading(
      state,
      action: PayloadAction<{ projectId: number; loading: boolean }>,
    ) {
      state.loadingById[action.payload.projectId] = action.payload.loading;
    },
    setProjectDetail(
      state,
      action: PayloadAction<{ projectId: number; project: Project | null }>,
    ) {
      const { projectId, project } = action.payload;
      if (project) {
        state.byId[projectId] = project;
      } else {
        delete state.byId[projectId];
      }
      state.errorById[projectId] = null;
    },
    setProjectDetailError(
      state,
      action: PayloadAction<{ projectId: number; error: string | null }>,
    ) {
      state.errorById[action.payload.projectId] = action.payload.error;
    },
  },
});

export const {
  setTeamProjectsLoading,
  setTeamProjects,
  setTeamProjectsError,
  setProjectDetailLoading,
  setProjectDetail,
  setProjectDetailError,
} = projectsCacheSlice.actions;

export default projectsCacheSlice.reducer;
