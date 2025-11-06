import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export const selectCourseOfferingsState = (state: RootState) => state.courseOfferings

export const selectAllCourseOfferings = createSelector(
  selectCourseOfferingsState,
  (state) => state.offerings
)

export const selectCourseOfferingsLoading = createSelector(
  selectCourseOfferingsState,
  (state) => state.loading
)

export const selectCourseOfferingsError = createSelector(
  selectCourseOfferingsState,
  (state) => state.error
)

export const selectCourseOfferingsBySelectedSemester = createSelector(
  (state: RootState) => state.courseOfferings.offerings,
  (state: RootState) => state.courses.selectedSemesterId,
  (offerings, selectedSemesterId) => {
    if (!selectedSemesterId) return offerings
    return offerings.filter(o => o.semesterId.toString() === selectedSemesterId)
  }
)

export const selectIsDeletingCourseOffering = createSelector(
  selectCourseOfferingsState,
  (state) => state.deleting
)


