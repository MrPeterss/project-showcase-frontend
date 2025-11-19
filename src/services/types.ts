// Role type
export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT" | "VIEWER";

// User entity
export type User = {
  id: number
  email: string
  firebaseId?: string
  teamId?: number
  createdAt: string
  role: Role
  team?: Team
}

// Semester entity
export type Semester = {
  id: number
  season: string
  year: number
  startDate: string
  endDate: string
  courses?: Course[]
}

// Course entity (template - no semester)
export type Course = {
  id: number
  department: string
  number: number
  name: string
  createdAt: string
}

// Course Offering entity (course + semester instance)
export type CourseOffering = {
  id: number
  courseId: number
  semesterId: number
  settings?: CourseOfferingSettings
  createdAt: string
  course?: Course
  semester?: Semester
  enrollments?: Enrollment[]
  teams?: Team[]
  userRole?: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER'
}

// Course Offering Settings
export type CourseOfferingSettings = {
  viewableOfferings?: number[]
  allowTeamCreation?: boolean
  maxTeamSize?: number
  projectDeadline?: string
  allowLateSubmissions?: boolean
  canView?: number[]
  course_visibility?: number[]
  allowDeployment?: boolean
}

// Enrollment entity
export type Enrollment = {
  role: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER'
  userId: number
  courseOfferingId: number
  user?: User
}

// Team entity
export type Team = {
  id: number
  name: string
  port?: number
  courseOfferingId: number
  createdAt: string
  courseOffering?: CourseOffering
  members?: TeamMember[]
  projects?: Project[]
}

// Team Member entity
export type TeamMember = {
  userId: number
  teamId: number
  user?: User
}

// ProjectType entity
export type ProjectType = {
  id: number
  name: string
  content: string // Base64 encoded content or JSON string
  courseOfferingId: number
  courseOffering?: CourseOffering
}

// Project entity
export type Project = {
  id: number
  teamId: number
  deployedById: number
  status: string
  githubUrl?: string
  containerId?: string
  containerName?: string
  imageName?: string
  ports?: Record<string, unknown>
  gitHubLink: string
  deployedAt: string
  stoppedAt?: string
  team?: Team
  deployedBy?: User
}

// Course creation/update DTOs (template only)
export type CreateCourseData = {
  department: string
  number: number
  name: string
}

export type UpdateCourseData = Partial<CreateCourseData>

// Course Offering creation/update DTOs
export type CreateCourseOfferingData = {
  courseId: number
  semesterId: number
  settings?: CourseOfferingSettings
}

export type UpdateCourseOfferingData = {
  settings?: CourseOfferingSettings
}

// Semester creation/update DTOs
export type CreateSemesterData = {
  season: string
  year: number
  startDate: string
  endDate: string
}

export type UpdateSemesterData = Partial<CreateSemesterData>

// ProjectType creation/update DTOs
export type CreateProjectTypeData = {
  name: string
  // content: Buffer
  courseId: number
}

export type UpdateProjectTypeData = Partial<CreateProjectTypeData>

// Team creation/update DTOs
export type CreateTeamData = {
  name: string
  memberEmails: string[]
  courseOfferingId: number
}

export type UpdateTeamData = {
  name?: string
  memberEmails?: string[]
}

// Enrollment creation/update DTOs
export type CreateEnrollmentData = {
  enrollments: Array<{
    email: string
    role: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER'
  }>
}

export type UpdateEnrollmentData = {
  role: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER'
}

// Project creation/update DTOs
export type CreateProjectData = {
  teamId: number
  deployedById: number
  status: string
  containerId?: string
  gitHubLink: string
  stoppedAt?: string
}

export type UpdateProjectData = Partial<CreateProjectData>