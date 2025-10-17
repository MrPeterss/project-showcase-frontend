import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAllCourses, selectCoursesLoading } from '@/store/selectors/coursesSelectors';
import { fetchCourses } from '@/store/thunks/coursesThunks';
import { CourseNavBar } from '@/components/CourseNavBar';
import { ArrowLeft, Upload, Users, Lock, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CourseSettings() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // State for settings
  const [allowStudentsToSeeCourse, setAllowStudentsToSeeCourse] = useState(false);
  const [lockProjectServer, setLockProjectServer] = useState(false);
  const [studentInput, setStudentInput] = useState('');
  const [showAddStudents, setShowAddStudents] = useState(false);
  
  // Only allow ADMIN and INSTRUCTOR roles to access this page
  const { hasAccess, userRole, isLoading } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
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

  // Handler functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Process CSV file
      console.log('CSV file uploaded:', file.name);
    }
  };

  const handleAddStudents = () => {
    // TODO: Process student input (CSV or comma-separated values)
    console.log('Adding students:', studentInput);
    setStudentInput('');
    setShowAddStudents(false);
  };

  const parseStudentInput = (input: string) => {
    // Parse comma-separated values: "John Doe, jd123, john.doe@cornell.edu"
    const lines = input.split('\n');
    return lines.map(line => {
      const [fullName, netId, email] = line.split(',').map(s => s.trim());
      return { fullName, netId, email: email || `${netId}@cornell.edu` };
    });
  };

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
          /* Course Settings Content */
          <div className="grid gap-6">
            {/* Add Students Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Add Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add students to this course by uploading a CSV file or entering student information manually.
                </p>
                
                {/* CSV Upload Option */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload CSV File</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('csv-upload')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose CSV File
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Format: Full Name, NetID, Email
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Manual Entry Option */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Students Manually</label>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddStudents(!showAddStudents)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {showAddStudents ? 'Hide Manual Entry' : 'Add Students Manually'}
                  </Button>
                  
                  {showAddStudents && (
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Student Information (one per line)
                        </label>
                        <textarea
                          value={studentInput}
                          onChange={(e) => setStudentInput(e.target.value)}
                          placeholder="John Doe, jd123, jd123@cornell.edu&#10;Jane Smith, js456, js456@cornell.edu"
                          className="w-full h-32 p-3 border rounded-md text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: Full Name, NetID, Email (email is optional, will default to netid@cornell.edu)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddStudents} size="sm">
                          Add Students
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddStudents(false)} 
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Visibility Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {allowStudentsToSeeCourse ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  Course Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Allow all my students to see this course</h4>
                    <p className="text-sm text-muted-foreground">
                      When enabled, all enrolled students can view this course and its content.
                    </p>
                  </div>
                  <Button
                    variant={allowStudentsToSeeCourse ? "default" : "outline"}
                    onClick={() => setAllowStudentsToSeeCourse(!allowStudentsToSeeCourse)}
                    className={allowStudentsToSeeCourse ? "bg-red-700 hover:bg-red-800" : ""}
                  >
                    {allowStudentsToSeeCourse ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Project Server Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Project Server
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Lock Project Server</h4>
                    <p className="text-sm text-muted-foreground">
                      Prevents students from pushing to the project server when this is enabled.
                    </p>
                  </div>
                  <Button
                    variant={lockProjectServer ? "default" : "outline"}
                    onClick={() => setLockProjectServer(!lockProjectServer)}
                    className={lockProjectServer ? "bg-red-700 hover:bg-red-800" : ""}
                  >
                    {lockProjectServer ? "Locked" : "Unlocked"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
