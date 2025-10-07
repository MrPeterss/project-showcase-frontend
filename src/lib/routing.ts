import type { Role } from '@/services/types'

/**
 * Returns the appropriate route for a user based on their role
 * @param role - The user's role (ADMIN, INSTRUCTOR, or STUDENT)
 * @returns The route path the user should be redirected to
 */
export const getRouteForRole = (role: Role): string => {
  switch (role) {
    case 'ADMIN':
      return '/courses'
    case 'INSTRUCTOR':
      return '/courses'
    case 'STUDENT':
      return '/dashboard'
    default:
      // Fallback to dashboard for any unexpected roles
      return '/dashboard'
  }
}
