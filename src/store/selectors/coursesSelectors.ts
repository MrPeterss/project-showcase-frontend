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
// Note: Courses are templates and don't have semesterId
// This selector is kept for backwards compatibility but returns all courses
export const selectCoursesBySemester = () => (state: RootState): Course[] => {
  // Courses don't have semesterId, so return all courses
  // Semester filtering should be done at the CourseOffering level
  return state.courses.courses
}

export const selectFilteredCourses = (state: RootState): Course[] => {
  // Courses don't have semesterId, so return all courses
  // Semester filtering should be done at the CourseOffering level
  return state.courses.courses
}

export const selectCourseById = (courseId: number) => (state: RootState): Course | undefined => {
  return state.courses.courses.find(course => course.id === courseId)
}

export const selectCoursesCount = (state: RootState) => state.courses.courses.length

export const selectFilteredCoursesCount = (state: RootState) => {
  return selectFilteredCourses(state).length
}

// Enhanced selector that enriches courses with semester data
// Note: Courses are templates and don't have semesterId or semester relationships
export const selectFilteredCoursesWithSemesters = (state: RootState): Course[] => {
  // Courses don't have semesterId, so return all courses as-is
  // Semester relationships exist at the CourseOffering level, not Course level
  return state.courses.courses
}
