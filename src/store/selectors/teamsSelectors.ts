import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../index'

const selectTeamsState = (state: RootState) => state.teams

export const selectTeamsByOffering = createSelector(
  [
    selectTeamsState,
    (_: RootState, offeringId?: number) => offeringId,
  ],
  (teamsState, offeringId) => {
    if (!offeringId) return []
    return teamsState.byOffering[offeringId] ?? []
  },
)

export const selectTeamsLoading = createSelector(
  [
    selectTeamsState,
    (_: RootState, offeringId?: number) => offeringId,
  ],
  (teamsState, offeringId) => {
    if (!offeringId) return false
    return teamsState.loadingByOffering[offeringId] ?? false
  },
)

export const selectTeamsError = createSelector(
  [
    selectTeamsState,
    (_: RootState, offeringId?: number) => offeringId,
  ],
  (teamsState, offeringId) => {
    if (!offeringId) return null
    return teamsState.errorByOffering[offeringId] ?? null
  },
)


