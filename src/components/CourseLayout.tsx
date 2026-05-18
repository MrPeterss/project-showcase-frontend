import {
  useParams,
  Outlet,
  useLocation,
  useNavigate,
  matchPath,
} from 'react-router-dom';
import { useEffect, useState, createContext, useContext, useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { CourseNavBar } from '@/components/CourseNavBar';
import { useAuth } from '@/hooks/useAuth';
import { useCourseOffering } from '@/hooks/useCourseOfferings';
import { DashboardTabsProvider } from '@/context/DashboardTabsContext';
import type { CourseOffering, Role } from '@/services/types';
import {
  canAccessCourseSettingsRoute,
  canAccessSparkOfferingRoute,
} from '@/lib/courseRoleAccess';

interface CourseContextType {
  offering: CourseOffering | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  effectiveRole?: Role;
  viewAsStudent: boolean;
  toggleViewAsStudent: () => void;
  setViewAsStudent: (value: boolean) => void;
}

const CourseContext = createContext<CourseContextType | null>(null);

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourseContext must be used within CourseLayout');
  }
  return context;
};

export function CourseLayout() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewAsStudent, setViewAsStudent] = useState(false);

  // Allow all roles to access course pages
  const { hasAccess: isAuthenticated } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'TA',
    'STUDENT',
    'VIEWER',
  ]);

  // IMPORTANT: All hooks must be called before any conditional returns
  const offeringId = courseId ? parseInt(courseId, 10) : NaN;
  const {
    data: offeringData,
    isLoading,
    error: offeringError,
    refetch,
  } = useCourseOffering(Number.isNaN(offeringId) ? undefined : offeringId);

  // Bridge to local state shape used by context consumers
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(isLoading);
    setOffering(offeringData ?? null);
    setError((offeringError as any)?.message ?? null);
  }, [isLoading, offeringData, offeringError]);

  const isAdmin = user?.role === 'ADMIN';

  const effectiveRole = useMemo<Role | undefined>(() => {
    if (isAdmin) {
      return viewAsStudent ? 'STUDENT' : 'ADMIN';
    }
    return offering?.userRole ?? (user?.role as Role | undefined);
  }, [isAdmin, viewAsStudent, offering?.userRole, user?.role]);

  // Immediate security check: Validate that effectiveRole matches user's actual role
  // This prevents students from having admin privileges after admin sign-out
  const hasRoleMismatch = useMemo(() => {
    if (!user || !effectiveRole) return false;

    // If user is not an admin globally, they should never have ADMIN effectiveRole
    if (user.role !== 'ADMIN' && effectiveRole === 'ADMIN') {
      return true;
    }

    // If user is a student globally, they should never have ADMIN effectiveRole
    if (user.role === 'STUDENT' && effectiveRole === 'ADMIN') {
      return true;
    }

    return false;
  }, [user, effectiveRole]);

  // Force reload if there's a role mismatch to clear stale state
  useEffect(() => {
    if (hasRoleMismatch) {
      window.location.reload();
    }
  }, [hasRoleMismatch]);

  // Reset viewAsStudent when course changes or user is not admin
  useEffect(() => {
    if (!isAdmin && viewAsStudent) {
      setViewAsStudent(false);
    }
  }, [isAdmin, viewAsStudent]);

  useEffect(() => {
    setViewAsStudent(false);
  }, [courseId]);

  useEffect(() => {
    if (isAdmin) {
      return () => {
        setViewAsStudent(false);
      };
    }
    return undefined;
  }, [isAdmin]);

  // Get course name for navigation (memoized to prevent unnecessary rerenders)
  const courseName = useMemo(() => {
    if (offering?.course) {
      return `${offering.course.department} ${offering.course.number} - ${offering.course.name}`;
    }
    return `Course ${courseId}`;
  }, [
    offering?.course?.department,
    offering?.course?.number,
    offering?.course?.name,
    courseId,
  ]);

  // Redirect visitors who cannot access course Settings or Spark
  // Let React Router handle all other route matching - no redirects for dashboard routes
  useEffect(() => {
    if (!courseId) return;

    const currentPath = location.pathname;

    // Never redirect from dashboard routes - let React Router handle them
    if (currentPath.includes('/dashboard')) {
      return;
    }

    // Only check settings / spark route access
    const settingsMatch = matchPath(
      { path: '/courses/:courseId/settings', end: true },
      currentPath
    );

    const sparkMatch = matchPath(
      { path: '/courses/:courseId/spark', end: true },
      currentPath
    );

    const restrictedMatch = settingsMatch || sparkMatch;

    if (!restrictedMatch?.params.courseId) return;
    if (restrictedMatch.params.courseId !== courseId) return;

    // Wait for loading to complete and effectiveRole to be set before checking access
    if (loading || !effectiveRole) return;

    // Spark remains instructor/admin only (not TA)
    if (sparkMatch?.params.courseId === courseId) {
      if (!canAccessSparkOfferingRoute(effectiveRole)) {
        navigate(`/courses/${courseId}`, { replace: true });
      }
      return;
    }

    // Settings: instructors and site admins only (not TAs)
    if (settingsMatch?.params.courseId === courseId) {
      if (!canAccessCourseSettingsRoute(effectiveRole)) {
        navigate(`/courses/${courseId}`, { replace: true });
      }
    }
  }, [courseId, effectiveRole, navigate, loading, location.pathname]);

  const toggleViewAsStudent = () => {
    if (!isAdmin) return;
    setViewAsStudent((prev) => !prev);
  };

  // If user doesn't have access, the hook will handle redirection
  // This early return must come AFTER all hooks are called
  if (!isAuthenticated) {
    return null;
  }

  // Security check: Don't render content if there's a role mismatch
  // This prevents students from seeing admin content
  if (hasRoleMismatch) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Verifying permissions...</div>
        </div>
      </div>
    );
  }

  const contextValue: CourseContextType = {
    offering,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
    effectiveRole,
    viewAsStudent,
    toggleViewAsStudent,
    setViewAsStudent,
  };

  return (
    <CourseContext.Provider value={contextValue}>
      <DashboardTabsProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          {/* Course Navigation - Only render when we have data or are loading */}
          {(offering || loading) && (
            <CourseNavBar
              courseId={courseId!}
              courseName={courseName}
              courseUserRole={offering?.userRole}
              semester={offering?.semester}
            />
          )}

          {/* Render child routes */}
          <div className="flex flex-1 min-h-0">
            <Outlet />
          </div>
        </div>
      </DashboardTabsProvider>
    </CourseContext.Provider>
  );
}
