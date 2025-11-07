import { useParams, Outlet } from 'react-router-dom';
import { useEffect, useState, createContext, useContext, useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { CourseNavBar } from '@/components/CourseNavBar';
import { services } from '@/services';
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

  const fetchOffering = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const offeringId = parseInt(courseId, 10);
      if (isNaN(offeringId)) {
        setError('Invalid course offering ID');
        return;
      }

      const offeringResponse = await services.courseOfferings.getById(
        offeringId
      );
      setOffering(offeringResponse.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load course offering';
      setError(errorMessage);
      console.error('Error fetching course offering:', err);
      
      // If 401/403, user doesn't have access
      if (
        (err as any)?.response?.status === 401 ||
        (err as any)?.response?.status === 403
      ) {
        // The hook will handle redirection
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOffering();
    }
  }, [courseId, isAuthenticated]);

  // If user doesn't have access, the hook will handle redirection
  if (!isAuthenticated) {
    return null;
  }

  // Get course name for navigation (memoized to prevent unnecessary rerenders)
  const courseName = useMemo(() => {
    if (offering?.course) {
      return `${offering.course.department} ${offering.course.number} - ${offering.course.name}`;
    }
    return `Course ${courseId}`;
  }, [offering?.course?.department, offering?.course?.number, offering?.course?.name, courseId]);

  const contextValue: CourseContextType = {
    offering,
    loading,
    error,
    refetch: fetchOffering,
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
