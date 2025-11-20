import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCourseContext } from '@/components/CourseLayout';
import { ArrowLeft, Upload, Users, Lock, Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { services } from '@/services';
import { useUpdateCourseOffering, useDeleteCourseOffering } from '@/hooks/useCourseOfferings';
import {
  useEnrollmentsByOffering,
  useCreateEnrollments,
  useDeleteEnrollment,
} from '@/hooks/useEnrollments';
import { useCourseOfferings } from '@/hooks/useCourseOfferings';
import { formatSemesterShortName } from '@/lib/semesterUtils';

export default function CourseSettings() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // IMPORTANT: Call all hooks at the top, before any conditional logic
  const {
    offering,
    loading: offeringLoading,
    refetch: refetchOffering,
    effectiveRole,
  } = useCourseContext();
  const { user } = useAuth();

  // React Query hooks
  const updateCourseOffering = useUpdateCourseOffering();
  const createEnrollments = useCreateEnrollments();
  const deleteEnrollment = useDeleteEnrollment();
  const deleteCourseOffering = useDeleteCourseOffering();
  const { data: allOfferings } = useCourseOfferings();

  // Get enrollments using React Query
  const offeringId = courseId ? parseInt(courseId, 10) : undefined;
  const { data: enrollmentsData } = useEnrollmentsByOffering(offeringId);
  const enrollments = enrollmentsData || [];

  // State for settings
  const [lockProjectServer, setLockProjectServer] = useState(false);
  const [studentInput, setStudentInput] = useState('');
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [instructorInput, setInstructorInput] = useState('');
  const [showAddInstructors, setShowAddInstructors] = useState(false);
  const [selectedViewableOfferings, setSelectedViewableOfferings] = useState<
    number[]
  >([]);

  const canManage = effectiveRole === 'ADMIN' || effectiveRole === 'INSTRUCTOR';

  // Compute available offerings from React Query data
  const availableOfferings = allOfferings
    ? allOfferings.filter((off) => {
        // Exclude current offering
        if (off.id === offeringId) return false;
        // Include if user is admin globally
        if (user?.role === 'ADMIN') return true;
        // Include if user is instructor in this offering
        return off.userRole === 'INSTRUCTOR';
      })
    : [];

  // Set selected viewable offerings from settings when offering loads
  useEffect(() => {
    if (!offering) return;

    // Parse course_visibility from settings
    // Settings might be a JSON object with course_visibility key
    let courseVisibility: number[] = [];

    if (offering.settings) {
      // Check if settings has course_visibility directly
      if (
        'course_visibility' in offering.settings &&
        Array.isArray((offering.settings as any).course_visibility)
      ) {
        courseVisibility = (offering.settings as any).course_visibility;
      }
      // Fallback to canView for backwards compatibility
      else if (
        'canView' in offering.settings &&
        Array.isArray((offering.settings as any).canView)
      ) {
        courseVisibility = (offering.settings as any).canView;
      }
    }

    setSelectedViewableOfferings(courseVisibility);
  }, [offering]);

  // Check course-specific role access after fetching offering
  useEffect(() => {
    if (
      effectiveRole &&
      effectiveRole !== 'INSTRUCTOR' &&
      effectiveRole !== 'ADMIN'
    ) {
      // Redirect to projects page if not an instructor or admin
      navigate(`/courses/${courseId}`, { replace: true });
    }
  }, [effectiveRole, courseId, navigate]);

  const handleDeleteCourseOffering = async () => {
    if (!offering || !offeringId) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this course offering? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      await deleteCourseOffering.mutateAsync(offering.id);
      navigate('/courses', { replace: true });
    } catch (error) {
      console.error('Error deleting course offering:', error);
      // TODO: Show error message to user
    }
  };

  // Handler functions
  const parseStudentInput = (input: string) => {
    // Parse comma-separated values: "email, team_name"
    const lines = input.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
      const [email, teamName] = line.split(',').map((s) => s.trim());
      return { email, teamName: teamName || undefined };
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !offering) return;

    try {
      const text = await file.text();
      const students = parseStudentInput(text);
      await addStudents(students);
    } catch (error) {
      console.error('Error processing CSV file:', error);
      // TODO: Show error message to user
    }
  };

  const addStudents = async (
    students: Array<{ email: string; teamName?: string }>
  ) => {
    if (!offering || !offeringId) return;

    try {
      // Create enrollments using React Query mutation
      const enrollmentData = {
        enrollments: students.map((s) => ({
          email: s.email,
          role: 'STUDENT' as const,
        })),
      };

      await createEnrollments.mutateAsync({
        offeringId: offering.id,
        data: enrollmentData,
      });

      // Group students by team and create/update teams
      const teamsMap = new Map<string, string[]>();
      students.forEach((student) => {
        if (student.teamName) {
          const teamName = student.teamName;
          if (!teamsMap.has(teamName)) {
            teamsMap.set(teamName, []);
          }
          teamsMap.get(teamName)!.push(student.email);
        }
      });

      // Create or update teams
      for (const [teamName, memberEmails] of teamsMap.entries()) {
        try {
          await services.teams.create(offering.id, {
            name: teamName,
            memberEmails,
            courseOfferingId: offering.id,
          });
        } catch (error) {
          console.error(`Error creating team ${teamName}:`, error);
          // TODO: Show error message to user
        }
      }

      setStudentInput('');
      setShowAddStudents(false);
    } catch (error) {
      console.error('Error adding students:', error);
      // TODO: Show error message to user
    }
  };

  const handleAddStudents = () => {
    if (!studentInput.trim()) return;
    const students = parseStudentInput(studentInput);
    addStudents(students);
  };

  const parseInstructorInput = (input: string) => {
    // Parse email addresses, one per line or separated by commas
    return input
      .split(/[,\n;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  };

  const addInstructors = async (emails: string[]) => {
    if (!offering || !offeringId) return;

    try {
      // Create enrollments with INSTRUCTOR role using React Query mutation
      const enrollmentData = {
        enrollments: emails.map((email) => ({
          email,
          role: 'INSTRUCTOR' as const,
        })),
      };

      await createEnrollments.mutateAsync({
        offeringId: offering.id,
        data: enrollmentData,
      });

      setInstructorInput('');
      setShowAddInstructors(false);
    } catch (error) {
      console.error('Error adding instructors:', error);
      // TODO: Show error message to user
    }
  };

  const handleAddInstructors = () => {
    if (!instructorInput.trim()) return;
    const emails = parseInstructorInput(instructorInput);
    addInstructors(emails);
  };

  const handleRemoveEnrollment = async (userId: number) => {
    if (!offering || !offeringId) return;

    try {
      await deleteEnrollment.mutateAsync({
        offeringId: offering.id,
        userId,
      });
    } catch (error) {
      console.error('Error removing enrollment:', error);
      // TODO: Show error message to user
    }
  };

  const handleToggleViewableOffering = (offeringId: number) => {
    setSelectedViewableOfferings((prev) => {
      if (prev.includes(offeringId)) {
        return prev.filter((id) => id !== offeringId);
      } else {
        return [...prev, offeringId];
      }
    });
  };

  const handleSaveVisibilitySettings = async () => {
    if (!offering || !offeringId) return;

    try {
      // Update settings with course_visibility as a JSON object
      await updateCourseOffering.mutateAsync({
        id: offering.id,
        data: {
          settings: {
            ...offering.settings,
            course_visibility: selectedViewableOfferings,
          },
        },
      });

      // Refresh offering to get updated settings
      await refetchOffering();
    } catch (error) {
      console.error('Error saving visibility settings:', error);
      // TODO: Show error message to user
    }
  };

  // Check if user has access based on course-specific role or global admin role
  const hasCourseAccess = canManage;

  // Show loading while checking access
  if (offering && !hasCourseAccess) {
    return null; // Will redirect in useEffect
  }

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
        /* Course offering not found */
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Course Offering Not Found
              </h2>
              <p className="text-muted-foreground mb-4">
                The course offering you're looking for doesn't exist.
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
          {/* Enrollments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrollments ({enrollments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enrollments List */}
              <div>
                {enrollments.length === 0 ? (
                  <p className="text-muted-foreground">No enrollments found.</p>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.userId}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {enrollment.user?.email ||
                              `User ${enrollment.userId}`}
                          </span>
                          <Badge variant="outline">{enrollment.role}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveEnrollment(enrollment.userId)
                          }
                          disabled={deleteEnrollment.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-500 font-medium">
                  Add Members
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Add Members Section */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add members to this course by uploading a CSV file or entering
                  information manually.
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
                      onClick={() =>
                        document.getElementById('csv-upload')?.click()
                      }
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose CSV File
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Format: email, team_name
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
                  <label className="text-sm font-medium">Enter Manually</label>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddStudents(!showAddStudents)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {showAddStudents
                      ? 'Hide Manual Entry'
                      : 'Add Students Manually'}
                  </Button>

                  {showAddStudents && (
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          User Information (one per line)
                        </label>
                        <textarea
                          value={studentInput}
                          onChange={(e) => setStudentInput(e.target.value)}
                          placeholder="student1@cornell.edu, Team A&#10;student2@cornell.edu, Team A&#10;student3@cornell.edu, Team B&#10;student4@cornell.edu"
                          className="w-full h-32 p-3 border rounded-md text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: email, team_name (team_name is optional)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddStudents} size="sm">
                          Add Members
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
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-500 font-medium">
                  Add Instructors
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Add Instructors Section */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add instructors to this course by entering their email
                  addresses.
                </p>

                {/* Manual Entry Option */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Enter Instructor Emails
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddInstructors(!showAddInstructors)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {showAddInstructors
                      ? 'Hide Instructor Entry'
                      : 'Add Instructors Manually'}
                  </Button>

                  {showAddInstructors && (
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Instructor Email Addresses (one per line)
                        </label>
                        <textarea
                          value={instructorInput}
                          onChange={(e) => setInstructorInput(e.target.value)}
                          placeholder="instructor1@cornell.edu&#10;instructor2@cornell.edu&#10;instructor3@cornell.edu"
                          className="w-full h-32 p-3 border rounded-md text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: email addresses separated by commas,
                          semicolons, or new lines
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddInstructors} size="sm">
                          Add Instructors
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddInstructors(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Visibility Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Course Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">
                  Allow this course to view other courses
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which courses students in this course can view.
                </p>
              </div>

              {availableOfferings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No other courses available. You need to be an instructor in
                  other courses to grant visibility.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-4">
                  {availableOfferings.map((offeringOption) => {
                    const isSelected = selectedViewableOfferings.includes(
                      offeringOption.id
                    );
                    const courseName = offeringOption.course
                      ? `${offeringOption.course.department} ${offeringOption.course.number} - ${offeringOption.course.name}`
                      : `Course Offering ${offeringOption.id}`;
                    const semesterName = offeringOption.semester
                      ? formatSemesterShortName(offeringOption.semester)
                      : '';

                    return (
                      <label
                        key={offeringOption.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleToggleViewableOffering(offeringOption.id)
                          }
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {courseName}
                          </div>
                          {semesterName && (
                            <div className="text-xs text-muted-foreground">
                              {semesterName}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveVisibilitySettings}
                  disabled={updateCourseOffering.isPending}
                  className="bg-red-700 hover:bg-red-800 text-white"
                >
                  {updateCourseOffering.isPending
                    ? 'Saving...'
                    : 'Save Changes'}
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
                  <h4 className="font-medium text-left">Lock Project Server</h4>
                  <p className="text-sm text-muted-foreground text-left">
                    Prevents students from pushing to the project server when
                    this is enabled.
                  </p>
                </div>
                <Button
                  variant={lockProjectServer ? 'default' : 'outline'}
                  onClick={() => setLockProjectServer(!lockProjectServer)}
                  disabled={true}
                  className={
                    lockProjectServer ? 'bg-red-700 hover:bg-red-800' : ''
                  }
                >
                  {lockProjectServer ? 'Locked' : 'Unlocked'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Course Offering Section - Admin Only */}
          {user?.role === 'ADMIN' && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-left mb-2">Delete Course Offering</h4>
                    <p className="text-sm text-muted-foreground text-left mb-4">
                      Permanently delete this course offering. This action cannot be undone and will remove all associated data including enrollments, teams, and projects.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCourseOffering}
                      disabled={deleteCourseOffering.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteCourseOffering.isPending ? 'Deleting...' : 'Delete Course Offering'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
