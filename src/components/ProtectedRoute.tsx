import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getRouteForRole } from '@/lib/routing';
import { useEffect, useRef } from 'react';

/**
 * Protected Route Component
 * Redirects authenticated users away from login page to their appropriate route
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const hasRedirected = useRef(false);

  // Reset redirect flag when location changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      hasRedirected.current = false;
    }
  }, [location.pathname]);

  // If loading, show nothing (or a loading spinner)
  if (isLoading) {
    return null;
  }

  // If user is authenticated and on login page, redirect to courses
  // Use ref to prevent multiple redirects
  if (
    isAuthenticated &&
    user?.role &&
    location.pathname === '/login' &&
    !hasRedirected.current
  ) {
    hasRedirected.current = true;
    const route = getRouteForRole(user.role);
    return <Navigate to={route} replace />;
  }

  return <>{children}</>;
}

/**
 * Redirect authenticated users from root to courses
 */
export function RootRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  // Reset redirect flag when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user?.role && !hasRedirected.current) {
    hasRedirected.current = true;
    const route = getRouteForRole(user.role);
    return <Navigate to={route} replace />;
  }

  if (!hasRedirected.current) {
    hasRedirected.current = true;
    return <Navigate to="/login" replace />;
  }

  return null;
}
