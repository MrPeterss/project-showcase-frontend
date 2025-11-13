export type { 
  User, 
  Course,
  CourseOffering,
  CourseOfferingSettings,
  Enrollment,
  Semester, 
  Team,
  TeamMember,
  ProjectType,
  Project,
  Role,
  CreateCourseData, 
  UpdateCourseData,
  CreateCourseOfferingData,
  UpdateCourseOfferingData,
  CreateEnrollmentData,
  UpdateEnrollmentData,
  CreateSemesterData, 
  UpdateSemesterData,
  CreateTeamData,
  UpdateTeamData,
  CreateProjectTypeData,
  UpdateProjectTypeData,
  CreateProjectData,
  UpdateProjectData
} from './types'

export { default as authServices } from './auth'
export { default as courseServices } from './courses'
export { default as courseOfferingServices } from './courseOfferings'
export { default as enrollmentServices } from './enrollments'
export { default as semesterServices } from './semesters'
export { default as teamServices } from './teams'
export { default as projectServices, parseLogs } from './projects'
export type {
  DeployProjectData,
  ContainerLog,
  ContainerLogsResponse,
  ParsedLogLine,
} from './projects'

import authServices from './auth'
import courseServices from './courses'
import courseOfferingServices from './courseOfferings'
import enrollmentServices from './enrollments'
import semesterServices from './semesters'
import teamServices from './teams'
import projectServices from './projects'

export const services = {
  auth: authServices,
  courses: courseServices,
  courseOfferings: courseOfferingServices,
  enrollments: enrollmentServices,
  semesters: semesterServices,
  teams: teamServices,
  projects: projectServices,
}

export default services
