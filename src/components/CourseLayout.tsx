import { useParams, Outlet } from 'react-router-dom';
import React, { useState, createContext, useContext, useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { CourseNavBar } from '@/components/CourseNavBar';
import { useCourseOffering } from '@/hooks/useCourseOfferings';
import type { CourseOffering } from '@/services/types';

interface CourseContextType {
  offering: CourseOffering | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Allow all roles to access course pages
  const { hasAccess: isAuthenticated } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'STUDENT',
    'VIEWER',
  ]);

  // IMPORTANT: All hooks must be called before any conditional returns
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

  const offeringId = courseId ? parseInt(courseId, 10) : NaN;
  const {
    data: offeringData,
    isLoading,
    error: offeringError,
    refetch,
  } = useCourseOffering(Number.isNaN(offeringId) ? undefined : offeringId);

  // Bridge to local state shape used by context consumers
  React.useEffect(() => {
    setLoading(isLoading);
    setOffering(offeringData ?? null);
    setError((offeringError as any)?.message ?? null);
  }, [isLoading, offeringData, offeringError]);

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
