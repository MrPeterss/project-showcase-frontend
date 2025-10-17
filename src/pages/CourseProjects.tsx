import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAllCourses, selectCoursesLoading } from '@/store/selectors/coursesSelectors';
import { fetchCourses } from '@/store/thunks/coursesThunks';
import { CourseNavBar } from '@/components/CourseNavBar';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function CourseProjects() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Allow all roles to access this page
  const { hasAccess, userRole, isLoading } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'STUDENT',
  ]);

  // Get course data
  const courses = useAppSelector(selectAllCourses);
  const coursesLoading = useAppSelector(selectCoursesLoading);
  const course = courses?.find(c => c.id.toString() === courseId);

  // Load courses if not already loaded
  useEffect(() => {
    if (!courses || courses.length === 0) {
      dispatch(fetchCourses());
    }
  }, [dispatch, courses]);

  // If user doesn't have access, the hook will handle redirection
  if (!hasAccess) {
    return null;
  }

  // Get course name for navigation (use fallback during loading)
  const courseName = course 
    ? `${course.department} ${course.number} - ${course.name}`
    : `Course ${courseId}`;

  return (
    <div>
      {/* Course Navigation - Always show, even during loading */}
      <CourseNavBar 
        courseId={courseId!} 
        courseName={courseName}
      />
      
      <div className="container mx-auto p-6">
        {/* Show loading state while checking authentication and role or loading courses */}
        {isLoading || coursesLoading ? (
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
                <CardTitle>Course Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is where course-specific projects would be displayed.
                  The content will vary based on user role.
                </p>
                
                {userRole === 'STUDENT' && (
                  <div className="mt-4">
                    <p className="text-sm text-blue-600">
                      Students can view and work on their assigned projects here.
                    </p>
                  </div>
                )}
                
                {userRole === 'INSTRUCTOR' && (
                  <div className="mt-4">
                    <p className="text-sm text-green-600">
                      Instructors can manage projects, assign them to students, and track progress.
                    </p>
                  </div>
                )}
                
                {userRole === 'ADMIN' && (
                  <div className="mt-4">
                    <p className="text-sm text-purple-600">
                      Admins have full control over all projects in this course.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
