import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Team } from '@/services/types'

interface TeamsState {
  byOffering: Record<number, Team[]>
  loadingByOffering: Record<number, boolean>
  errorByOffering: Record<number, string | null>
}

const initialState: TeamsState = {
  byOffering: {},
  loadingByOffering: {},
  errorByOffering: {},
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
    setTeams: (
      state,
      action: PayloadAction<{ offeringId: number; teams: Team[] }>,
    ) => {
      const { offeringId, teams } = action.payload
      state.byOffering[offeringId] = teams
      state.errorByOffering[offeringId] = null
    },
    setTeamsError: (
      state,
      action: PayloadAction<{ offeringId: number; error: string | null }>,
    ) => {
      const { offeringId, error } = action.payload
      state.errorByOffering[offeringId] = error
    },
    clearTeamsForOffering: (state, action: PayloadAction<number>) => {
      const offeringId = action.payload
      delete state.byOffering[offeringId]
      delete state.loadingByOffering[offeringId]
      delete state.errorByOffering[offeringId]
    },
  },
})

export const {
  setTeamsLoading,
  setTeams,
  setTeamsError,
  clearTeamsForOffering,
} = teamsSlice.actions

export default teamsSlice.reducer


