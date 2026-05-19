import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface DashboardTab {
  teamId: number;
  teamName: string;
}

const MAX_TABS = 3;

interface DashboardTabsState {
  /** Open dashboard tabs per course offering */
  byOfferingId: Record<number, DashboardTab[]>;
}

const initialState: DashboardTabsState = {
  byOfferingId: {},
};

function addTabToList(
  prev: DashboardTab[] | undefined,
  teamId: number,
  teamName: string,
): DashboardTab[] {
  const list = prev ?? [];
  if (list.some((t) => t.teamId === teamId)) return list;
  const next = [...list, { teamId, teamName }];
  if (next.length <= MAX_TABS) return next;
  return next.slice(next.length - MAX_TABS);
}

const dashboardTabsSlice = createSlice({
  name: 'dashboardTabs',
  initialState,
  reducers: {
    addDashboardTab(
      state,
      action: PayloadAction<{
        offeringId: number;
        teamId: number;
        teamName: string;
      }>,
    ) {
      const { offeringId, teamId, teamName } = action.payload;
      state.byOfferingId[offeringId] = addTabToList(
        state.byOfferingId[offeringId],
        teamId,
        teamName,
      );
    },
    removeDashboardTab(
      state,
      action: PayloadAction<{ offeringId: number; teamId: number }>,
    ) {
      const { offeringId, teamId } = action.payload;
      const list = state.byOfferingId[offeringId];
      if (!list) return;
      state.byOfferingId[offeringId] = list.filter((t) => t.teamId !== teamId);
    },
    clearDashboardTabsForOffering(state, action: PayloadAction<number>) {
      delete state.byOfferingId[action.payload];
    },
  },
});

export const {
  addDashboardTab,
  removeDashboardTab,
  clearDashboardTabsForOffering,
} = dashboardTabsSlice.actions;

export default dashboardTabsSlice.reducer;
