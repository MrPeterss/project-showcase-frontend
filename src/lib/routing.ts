import type { Role } from '@/services/types'

/**
 * Returns the appropriate route for a user based on their role
 * @param role - The user's role (ADMIN, INSTRUCTOR, STUDENT, or VIEWER)
 * @returns The route path the user should be redirected to
 */
export const getRouteForRole = (role: Role): string => {
  switch (role) {
    case 'ADMIN':
      return '/courses'
    case 'INSTRUCTOR':
      return '/courses'
    case 'STUDENT':
      return '/courses' // Students now also go to courses page first
    case 'VIEWER':
      return '/courses' // Viewers also go to courses page first
    default:
      // Fallback to courses for any unexpected roles
      return '/courses'
  }
}
