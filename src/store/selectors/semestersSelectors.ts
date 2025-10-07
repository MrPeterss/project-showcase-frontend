import type { RootState } from '../index'
import type { Semester } from '@/services'

// Basic selectors
export const selectAllSemesters = (state: RootState) => state.semesters.semesters
export const selectSelectedSemester = (state: RootState) => state.semesters.selectedSemester
export const selectSemestersLoading = (state: RootState) => state.semesters.isLoading
export const selectSemestersError = (state: RootState) => state.semesters.error

// Async operation selectors
export const selectIsCreatingSemester = (state: RootState) => state.semesters.isCreating
export const selectIsUpdatingSemester = (state: RootState) => state.semesters.isUpdating
export const selectIsDeletingSemester = (state: RootState) => state.semesters.isDeleting

// Computed selectors
export const selectSemesterById = (semesterId: number) => (state: RootState): Semester | undefined => {
  return state.semesters.semesters.find(semester => semester.id === semesterId)
}

export const selectSemestersCount = (state: RootState) => state.semesters.semesters.length

export const selectSemesterOptions = (state: RootState) => {
  return state.semesters.semesters.map(semester => ({
    value: semester.id.toString(),
    label: semester.shortName,
    semester
  }))
}
