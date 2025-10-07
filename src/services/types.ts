// Role type
export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

// User entity
export type User = {
  id: number
  email: string
  firebaseId?: string
  teamId?: number
  createdAt: string
  role: Role
  refreshToken?: string
  team?: Team
}

// Semester entity
export type Semester = {
  id: number
  shortName: string
  startDate: string
  endDate: string
  courses?: Course[]
}

// Course entity
export type Course = {
  id: number
  department: string
  number: number
  name: string
  semesterId: number
  semester?: Semester
  projectTypes?: ProjectType[]
  teams?: Team[]
}

// Team entity
export type Team = {
  id: number
  name: string
  port: number
  courseId: number
  createdAt: string
  course?: Course
  users?: User[]
  projects?: Project[]
}

// ProjectType entity
export type ProjectType = {
  id: number
  name: string
  content: string // Base64 encoded content or JSON string
  courseId: number
  course?: Course
}

// Project entity
export type Project = {
  id: number
  teamId: number
  deployedById: number
  status: string
  containerId?: string
  gitHubLink: string
  deployedAt: string
  stoppedAt?: string
  team?: Team
  deployedBy?: User
}

// Course creation/update DTOs
export type CreateCourseData = {
  department: string
  number: number
  name: string
  semesterId: number
}

export type UpdateCourseData = Partial<CreateCourseData>

// Semester creation/update DTOs
export type CreateSemesterData = {
  shortName: string
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
  port: number
  courseId: number
}

export type UpdateTeamData = Partial<CreateTeamData>

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