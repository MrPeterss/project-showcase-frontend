import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Team } from '@/services/types'

interface TeamsState {
  byOffering: Record<number, Team[]>
  myByOffering: Record<number, Team[]>
  detailById: Record<number, Team>
  loadingByOffering: Record<number, boolean>
  myLoadingByOffering: Record<number, boolean>
  detailLoadingById: Record<number, boolean>
  errorByOffering: Record<number, string | null>
  myErrorByOffering: Record<number, string | null>
  detailErrorById: Record<number, string | null>
}

const initialState: TeamsState = {
  byOffering: {},
  myByOffering: {},
  detailById: {},
  loadingByOffering: {},
  myLoadingByOffering: {},
  detailLoadingById: {},
  errorByOffering: {},
  myErrorByOffering: {},
  detailErrorById: {},
}

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setTeamsLoading: (
      state,
      action: PayloadAction<{ offeringId: number; isLoading: boolean }>,
    ) => {
      const { offeringId, isLoading } = action.payload
      state.loadingByOffering[offeringId] = isLoading
    },
    setMyTeamsLoading: (
      state,
      action: PayloadAction<{ offeringId: number; isLoading: boolean }>,
    ) => {
      state.myLoadingByOffering[action.payload.offeringId] = action.payload.isLoading
    },
    setTeams: (
      state,
      action: PayloadAction<{ offeringId: number; teams: Team[] }>,
    ) => {
      const { offeringId, teams } = action.payload
      state.byOffering[offeringId] = teams
      state.errorByOffering[offeringId] = null
    },
    setMyTeams: (
      state,
      action: PayloadAction<{ offeringId: number; teams: Team[] }>,
    ) => {
      state.myByOffering[action.payload.offeringId] = action.payload.teams
      state.myErrorByOffering[action.payload.offeringId] = null
    },
    setTeamsError: (
      state,
      action: PayloadAction<{ offeringId: number; error: string | null }>,
    ) => {
      const { offeringId, error } = action.payload
      state.errorByOffering[offeringId] = error
    },
    setMyTeamsError: (
      state,
      action: PayloadAction<{ offeringId: number; error: string | null }>,
    ) => {
      state.myErrorByOffering[action.payload.offeringId] =
        action.payload.error
    },
    setTeamDetail(state, action: PayloadAction<Team>) {
      state.detailById[action.payload.id] = action.payload
      state.detailErrorById[action.payload.id] = null
    },
    setTeamDetailLoading(
      state,
      action: PayloadAction<{ teamId: number; loading: boolean }>,
    ) {
      state.detailLoadingById[action.payload.teamId] = action.payload.loading
    },
    setTeamDetailError(
      state,
      action: PayloadAction<{ teamId: number; error: string | null }>,
    ) {
      state.detailErrorById[action.payload.teamId] = action.payload.error
    },
    clearTeamsForOffering: (state, action: PayloadAction<number>) => {
      const offeringId = action.payload
      delete state.byOffering[offeringId]
      delete state.myByOffering[offeringId]
      delete state.loadingByOffering[offeringId]
      delete state.myLoadingByOffering[offeringId]
      delete state.errorByOffering[offeringId]
      delete state.myErrorByOffering[offeringId]
    },
  },
})

export const {
  setTeamsLoading,
  setMyTeamsLoading,
  setTeams,
  setMyTeams,
  setTeamsError,
  setMyTeamsError,
  setTeamDetail,
  setTeamDetailLoading,
  setTeamDetailError,
  clearTeamsForOffering,
} = teamsSlice.actions

export default teamsSlice.reducer


