import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { getRouteForRole } from '@/lib/routing'
import type { Role } from '@/services/types'

/**
 * Hook to control access to pages based on user roles
 * @param allowedRoles - Array of roles that are allowed to access the page
 * @param redirectToRoleRoute - If true, redirects to user's default role route. If false, redirects to login.
 */
export const useRoleAccess = (
  allowedRoles: Role[],
  redirectToRoleRoute: boolean = true
) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    // If user doesn't have a role or role is not allowed
    if (!user?.role || !allowedRoles.includes(user.role)) {
      if (redirectToRoleRoute && user?.role) {
        // Redirect to user's default role route
        const route = getRouteForRole(user.role)
        navigate(route, { replace: true })
      } else {
        // Redirect to login
        navigate('/login', { replace: true })
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, redirectToRoleRoute, navigate])

  return {
    hasAccess: user?.role ? allowedRoles.includes(user.role) : false,
    userRole: user?.role,
    isLoading,
    isAuthenticated,
  }
}
