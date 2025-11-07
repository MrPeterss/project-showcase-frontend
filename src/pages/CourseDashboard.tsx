import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourseContext } from '@/components/CourseLayout';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function CourseDashboard() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { offering, loading: offeringLoading } = useCourseContext();

  // Check course-specific role access after fetching offering
  useEffect(() => {
    if (offering?.userRole && offering.userRole !== 'STUDENT') {
      // Redirect to projects page if not a student
      navigate(`/courses/${courseId}`, { replace: true });
    }
  }, [offering?.userRole, courseId, navigate]);

  return (
    <div className="container mx-auto p-6">
      {/* Show loading state while loading course offering */}
      {offeringLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      ) : !offering ? (
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
                  Students can view their progress, grades, and course overview
                  here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
