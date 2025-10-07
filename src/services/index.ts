export type { 
  User, 
  Course, 
  Semester, 
  Team,
  ProjectType,
  Project,
  Role,
  CreateCourseData, 
  UpdateCourseData, 
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
export { default as semesterServices } from './semesters'

import authServices from './auth'
import courseServices from './courses'
import semesterServices from './semesters'

export const services = {
  auth: authServices,
  courses: courseServices,
  semesters: semesterServices,
}

export default services
