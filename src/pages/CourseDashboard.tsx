import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectAllCourses,
  selectCoursesLoading,
} from '@/store/selectors/coursesSelectors';
import { fetchCourses } from '@/store/thunks/coursesThunks';
import { CourseNavBar } from '@/components/CourseNavBar';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { services } from '@/services';
import type { CourseOffering } from '@/services/types';

export default function CourseDashboard() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [offeringLoading, setOfferingLoading] = useState(true);

  // Allow all authenticated users initially, then check course-specific role
  const { hasAccess: isAuthenticated, isLoading } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'STUDENT',
    'VIEWER',
  ]);

  // Get course data
  const courses = useAppSelector(selectAllCourses);
  const coursesLoading = useAppSelector(selectCoursesLoading);
  const course = courses?.find((c) => c.id.toString() === courseId);

  // Load courses if not already loaded
  useEffect(() => {
    if (!courses || courses.length === 0) {
      dispatch(fetchCourses());
    }
  }, [dispatch, courses]);

  // Fetch course offering to get userRole
  useEffect(() => {
    const fetchOffering = async () => {
      if (!courseId || !isAuthenticated) return;

      try {
        setOfferingLoading(true);
        const offeringId = parseInt(courseId, 10);
        if (isNaN(offeringId)) {
          return;
        }

        const offeringResponse = await services.courseOfferings.getById(
          offeringId
        );
        setOffering(offeringResponse.data);
      } catch (err) {
        console.error('Error fetching course offering:', err);
        // If 401/403, user doesn't have access - redirect to courses
        if (
          (err as any)?.response?.status === 401 ||
          (err as any)?.response?.status === 403
        ) {
          navigate('/courses');
        }
      } finally {
        setOfferingLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOffering();
    }
  }, [courseId, isAuthenticated, navigate]);

  // Check course-specific role access after fetching offering
  useEffect(() => {
    if (offering?.userRole && offering.userRole !== 'STUDENT') {
      // Redirect to projects page if not a student
      navigate(`/courses/${courseId}`, { replace: true });
    }
  }, [offering?.userRole, courseId, navigate]);

  // If user doesn't have access, the hook will handle redirection
  if (!isAuthenticated) {
    return null;
  }

  // Get course name for navigation (use fallback during loading)
  const courseName = offering?.course
    ? `${offering.course.department} ${offering.course.number} - ${offering.course.name}`
    : course
    ? `${course.department} ${course.number} - ${course.name}`
    : `Course ${courseId}`;

  return (
    <div>
      {/* Course Navigation - Always show, even during loading */}
      <CourseNavBar
        courseId={courseId!}
        courseName={courseName}
        courseUserRole={offering?.userRole}
        semester={offering?.semester}
      />

      <div className="container mx-auto p-6">
        {/* Show loading state while checking authentication and role or loading courses */}
        {isLoading || coursesLoading || offeringLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        ) : !course ? (
          /* Course not found */
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  The course you're looking for doesn't exist.
                </p>
                <Button onClick={() => navigate('/courses')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Course content */
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is where course-specific dashboard information would be
                  displayed. The content will vary based on user role.
                </p>

                <div className="mt-4">
                  <p className="text-sm text-blue-600">
                    Students can view their progress, grades, and course
                    overview here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
