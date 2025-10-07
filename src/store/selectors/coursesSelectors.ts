import type { RootState } from '../index'
import type { Course } from '@/services'

// Basic selectors
export const selectAllCourses = (state: RootState) => state.courses.courses
export const selectSelectedCourse = (state: RootState) => state.courses.selectedCourse
export const selectSelectedSemesterId = (state: RootState) => state.courses.selectedSemesterId
export const selectCoursesLoading = (state: RootState) => state.courses.isLoading
export const selectCoursesError = (state: RootState) => state.courses.error

// Async operation selectors
export const selectIsCreatingCourse = (state: RootState) => state.courses.isCreating
export const selectIsUpdatingCourse = (state: RootState) => state.courses.isUpdating
export const selectIsDeletingCourse = (state: RootState) => state.courses.isDeleting

// Computed selectors
export const selectCoursesBySemester = (semesterId: number) => (state: RootState): Course[] => {
  return state.courses.courses.filter(course => course.semesterId === semesterId)
}

export const selectFilteredCourses = (state: RootState): Course[] => {
  const { courses, selectedSemesterId } = state.courses
  if (!selectedSemesterId) {
    return courses
  }
  return courses.filter(course => course.semesterId === parseInt(selectedSemesterId))
}

export const selectCourseById = (courseId: number) => (state: RootState): Course | undefined => {
  return state.courses.courses.find(course => course.id === courseId)
}

export const selectCoursesCount = (state: RootState) => state.courses.courses.length

export const selectFilteredCoursesCount = (state: RootState) => {
  return selectFilteredCourses(state).length
}

// Enhanced selector that enriches courses with semester data
export const selectFilteredCoursesWithSemesters = (state: RootState): Course[] => {
  const { courses, selectedSemesterId } = state.courses
  const semesters = state.semesters.semesters
  
  let filteredCourses = courses
  if (selectedSemesterId) {
    filteredCourses = courses.filter(course => course.semesterId === parseInt(selectedSemesterId))
  }
  
  // Enrich courses with semester data
  return filteredCourses.map(course => ({
    ...course,
    semester: semesters.find(semester => semester.id === course.semesterId)
  }))
}
