import { useParams, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext, useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { CourseNavBar } from '@/components/CourseNavBar';
import { useAuth } from '@/hooks/useAuth';
import { useCourseOffering } from '@/hooks/useCourseOfferings';
import type { CourseOffering, Role } from '@/services/types';

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

  useEffect(() => {
    if (!courseId) return;
    if (loading) return;
    if (!effectiveRole) return;

    const basePath = `/courses/${courseId}`;
    const normalizedPath = location.pathname.replace(/\/$/, '');

    const allowedPaths = new Set<string>([basePath]);

    if (effectiveRole === 'STUDENT') {
      allowedPaths.add(`${basePath}/dashboard`);
    }

    if (effectiveRole === 'INSTRUCTOR' || effectiveRole === 'ADMIN') {
      allowedPaths.add(`${basePath}/settings`);
    }

    const normalizedAllowed = Array.from(allowedPaths).map((path) =>
      path.replace(/\/$/, '')
    );

    const isAllowed = normalizedAllowed.some((path) => path === normalizedPath);

    if (!isAllowed) {
      navigate(basePath, { replace: true });
    }
  }, [courseId, effectiveRole, location.pathname, navigate, loading]);

  const toggleViewAsStudent = () => {
    if (!isAdmin) return;
    setViewAsStudent((prev) => !prev);
  };

  // If user doesn't have access, the hook will handle redirection
  // This early return must come AFTER all hooks are called
  if (!isAuthenticated) {
    return null;
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
      <div>
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
        <Outlet />
      </div>
    </CourseContext.Provider>
  );
}
