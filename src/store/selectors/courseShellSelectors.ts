import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import type { Role } from '@/services/types';

export const selectActiveOffering = (state: RootState) =>
  state.activeOffering.offering;

export const selectActiveOfferingLoading = (state: RootState) =>
  state.activeOffering.loading;

export const selectActiveOfferingError = (state: RootState) =>
  state.activeOffering.error;

export const makeSelectEffectiveRole = (offeringId: number) =>
  createSelector(
    [
      (s: RootState) => s.user.user,
      (s: RootState) => s.activeOffering.offering,
      (s: RootState) =>
        s.courseUi.viewAsStudentByOfferingId[offeringId] ?? false,
    ],
    (user, offering, viewAsStudent): Role | undefined => {
      const isAdmin = user?.role === 'ADMIN';
      if (isAdmin) {
        return viewAsStudent ? 'STUDENT' : 'ADMIN';
      }
      if (offering && offering.id === offeringId) {
        return offering.userRole as Role;
      }
      return user?.role as Role | undefined;
    },
  );

export const selectViewAsStudent =
  (offeringId: number) => (s: RootState) =>
    s.courseUi.viewAsStudentByOfferingId[offeringId] ?? false;

export const selectDashboardTabsForOffering =
  (offeringId: number) => (s: RootState) =>
    s.dashboardTabs.byOfferingId[offeringId] ?? [];
