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
export { default as adminServices } from './admin'
export type {
  DeployProjectData,
  ContainerLog,
  ContainerLogsResponse,
  ParsedLogLine,
} from './projects'
export type {
  ProjectsResponse,
  TeamWithProjects,
  AdminTeam,
  AdminCourse,
  AdminSemester,
  AdminCourseOffering,
  AdminProject,
  ProjectDataFile,
  PruneProjectResponse,
} from './admin'

import authServices from './auth'
import courseServices from './courses'
import courseOfferingServices from './courseOfferings'
import enrollmentServices from './enrollments'
import semesterServices from './semesters'
import teamServices from './teams'
import projectServices from './projects'
import adminServices from './admin'

export const services = {
  auth: authServices,
  courses: courseServices,
  courseOfferings: courseOfferingServices,
  enrollments: enrollmentServices,
  semesters: semesterServices,
  teams: teamServices,
  projects: projectServices,
  admin: adminServices,
}

export default services
