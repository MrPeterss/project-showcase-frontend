import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAllCourses, selectCoursesLoading } from '@/store/selectors/coursesSelectors';
import { fetchCourses } from '@/store/thunks/coursesThunks';
import { CourseNavBar } from '@/components/CourseNavBar';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get course data first
  const courses = useAppSelector(selectAllCourses);
  const coursesLoading = useAppSelector(selectCoursesLoading);
  const course = courses?.find(c => c.id.toString() === courseId);

  // Load courses if not already loaded
  useEffect(() => {
    if (!courses || courses.length === 0) {
      dispatch(fetchCourses());
    }
  }, [dispatch, courses]);

  // Allow all roles to access this page
  const { hasAccess, userRole } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'STUDENT',
  ]);

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
        {/* Show loading state while loading courses */}
        {coursesLoading ? (
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
                <div className="text-sm text-muted-foreground mb-4">
                  Looking for course ID: {courseId}
                  <br />
                  Available courses: {courses?.length || 0}
                  <br />
                  Course IDs: {courses?.map(c => c.id).join(', ') || 'None'}
                </div>
                <Button onClick={() => navigate('/courses')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Course content */
          <>
            {/* Semester Info */}
            {course.semester && (
              <div className="mb-6 flex items-center gap-2">
                <Badge variant="outline">
                  {course.semester.shortName}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(course.semester.startDate).toLocaleDateString()} - {new Date(course.semester.endDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Course Content */}
            <div className="grid gap-6">
        {/* Course Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Department</h4>
                <p className="text-lg">{course.department}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Course Number</h4>
                <p className="text-lg">{course.number}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Course Name</h4>
                <p className="text-lg">{course.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Semester</h4>
                <p className="text-lg">{course.semester?.shortName || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific content */}
        {userRole === 'STUDENT' && (
          <Card>
            <CardHeader>
              <CardTitle>Student View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is where students would see their course-specific content, 
                projects, assignments, and team information.
              </p>
              {/* TODO: Add student-specific course content */}
            </CardContent>
          </Card>
        )}

        {userRole === 'INSTRUCTOR' && (
          <Card>
            <CardHeader>
              <CardTitle>Instructor View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is where instructors would manage students, teams, 
                projects, and course settings.
              </p>
              {/* TODO: Add instructor-specific course management */}
            </CardContent>
          </Card>
        )}

        {userRole === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is where admins would have full control over the course, 
                including editing course details, managing all aspects.
              </p>
              {/* TODO: Add admin-specific course management */}
            </CardContent>
          </Card>
        )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
