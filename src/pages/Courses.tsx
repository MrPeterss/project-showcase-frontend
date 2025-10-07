import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  NewSemesterModal,
  EditSemesterModal,
  NewCourseModal,
  EditCourseModal,
} from '@/components/modals';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedSemesterId } from '@/store/slices/coursesSlice';
import { fetchCourses, deleteCourse } from '@/store/thunks/coursesThunks';
import { fetchSemesters } from '@/store/thunks/semestersThunks';
import {
  selectFilteredCoursesWithSemesters,
  selectCoursesLoading,
  selectCoursesError,
  selectIsDeletingCourse,
  selectSelectedSemesterId,
} from '@/store/selectors/coursesSelectors';
import { selectAllSemesters } from '@/store/selectors/semestersSelectors';
import { useEffect, useState } from 'react';
import type { Course, Semester } from '@/services';

export default function Courses() {
  const dispatch = useAppDispatch();

  // Only allow ADMIN and INSTRUCTOR roles to access this page
  const { hasAccess, userRole, isLoading } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
  ]);

  // Redux selectors
  const courses = useAppSelector(selectFilteredCoursesWithSemesters);
  const coursesLoading = useAppSelector(selectCoursesLoading);
  const coursesError = useAppSelector(selectCoursesError);
  const isDeletingCourse = useAppSelector(selectIsDeletingCourse);
  const selectedSemesterId = useAppSelector(selectSelectedSemesterId);
  const semesters = useAppSelector(selectAllSemesters);

  // Modal state
  const [isNewSemesterModalOpen, setIsNewSemesterModalOpen] = useState(false);
  const [isEditSemesterModalOpen, setIsEditSemesterModalOpen] = useState(false);
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
    null
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    // Load semesters first, then courses
    const loadData = async () => {
      await dispatch(fetchSemesters());
      await dispatch(fetchCourses());
    };
    loadData();
  }, [dispatch]);

  // Handle semester selection change
  const handleSemesterChange = (semesterId: string) => {
    dispatch(setSelectedSemesterId(semesterId));
    dispatch(
      fetchCourses(
        semesterId ? { semesterId: parseInt(semesterId) } : undefined
      )
    );
  };

  // Handle course deletion
  const handleDeleteCourse = (courseId: number) => {
    dispatch(deleteCourse(courseId));
  };

  // Modal handlers
  const handleEditSemester = (semester: Semester) => {
    setSelectedSemester(semester);
    setIsEditSemesterModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditCourseModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsNewSemesterModalOpen(false);
    setIsEditSemesterModalOpen(false);
    setIsNewCourseModalOpen(false);
    setIsEditCourseModalOpen(false);
    setSelectedSemester(null);
    setSelectedCourse(null);
  };

  // Show loading state while checking authentication and role
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user doesn't have access, the hook will handle redirection
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header with Semester Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              Courses
              {selectedSemesterId && semesters && (
                <span className="text-xl font-normal text-muted-foreground ml-3">
                  -{' '}
                  {
                    semesters.find(
                      (s) => s.id.toString() === selectedSemesterId
                    )?.shortName
                  }
                </span>
              )}
            </h1>
            <Badge variant="secondary">{userRole}</Badge>
          </div>

          {/* Admin Controls */}
          {userRole === 'ADMIN' && (
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => setIsNewCourseModalOpen(true)}>
                Add Course
              </Button>
            </div>
          )}
        </div>

        {/* Semester Dropdown */}
        <div className="flex items-center gap-2">
          <CustomSelect
            value={selectedSemesterId || ''}
            onChange={handleSemesterChange}
            options={[
              { value: '', label: 'All Semesters' },
              ...(semesters?.map((semester) => ({
                value: semester.id.toString(),
                label: `${semester.shortName} (${new Date(
                  semester.startDate
                ).toLocaleDateString()} - ${new Date(
                  semester.endDate
                ).toLocaleDateString()})`,
              })) || []),
            ]}
            placeholder="Select a semester"
            showAddButton={userRole === 'ADMIN'}
            onAddClick={() => setIsNewSemesterModalOpen(true)}
            addButtonText="Add New Semester"
            className="w-80"
          />

          {/* Edit Semester Button - Only show when a semester is selected and user is admin */}
          {selectedSemesterId && userRole === 'ADMIN' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const semester = semesters?.find(
                  (s) => s.id.toString() === selectedSemesterId
                );
                if (semester) {
                  handleEditSemester(semester);
                }
              }}
              className="h-10"
            >
              Edit Semester
            </Button>
          )}
        </div>
      </div>

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedSemesterId && semesters
              ? `${
                  semesters.find((s) => s.id.toString() === selectedSemesterId)
                    ?.shortName
                } Courses`
              : 'All Courses'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <p className="text-muted-foreground">Loading courses...</p>
          ) : coursesError ? (
            <p className="text-red-500">
              Error loading courses: {coursesError}
            </p>
          ) : courses && courses.length > 0 ? (
            // Show courses organized by semester if "All Semesters" is selected
            selectedSemesterId ? (
              // Single semester view
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`flex justify-between items-center p-3 border rounded-lg ${
                      userRole === 'INSTRUCTOR'
                        ? 'cursor-pointer hover:bg-gray-50'
                        : ''
                    }`}
                    onClick={() => {
                      if (userRole === 'INSTRUCTOR') {
                        // TODO: Navigate to course management page for instructors
                        console.log(
                          'Navigate to course management for:',
                          course
                        );
                      }
                    }}
                  >
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">
                        {course.department} {course.number} - {course.name}
                      </h4>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {course.semester?.shortName ||
                            `Semester ID: ${course.semesterId}`}
                        </Badge>
                      </div>
                    </div>

                    {/* Admin-only buttons */}
                    {userRole === 'ADMIN' && (
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCourse(course)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCourse(course.id)}
                          disabled={isDeletingCourse}
                        >
                          Delete
                        </Button>
                      </div>
                    )}

                    {/* Instructor-only indicator */}
                    {userRole === 'INSTRUCTOR' && (
                      <div className="text-sm text-muted-foreground">
                        Click to manage students & teams
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // All semesters view - group by semester
              (() => {
                // Group courses by semester
                const coursesBySemester = courses.reduce((acc, course) => {
                  const semesterId = course.semesterId;
                  if (!acc[semesterId]) {
                    acc[semesterId] = [];
                  }
                  acc[semesterId].push(course);
                  return acc;
                }, {} as Record<number, typeof courses>);

                // Sort semesters by start date (newest first)
                const sortedSemesters = semesters
                  .filter((semester) => coursesBySemester[semester.id])
                  .sort(
                    (a, b) =>
                      new Date(b.startDate).getTime() -
                      new Date(a.startDate).getTime()
                  );

                return (
                  <div className="space-y-6">
                    {sortedSemesters.map((semester) => (
                      <div key={semester.id} className="space-y-3">
                        {/* Semester Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {semester.shortName}
                          </h3>
                          <Badge variant="outline" className="text-sm">
                            {coursesBySemester[semester.id].length} course
                            {coursesBySemester[semester.id].length !== 1
                              ? 's'
                              : ''}
                          </Badge>
                        </div>

                        {/* Courses for this semester */}
                        <div className="space-y-2">
                          {coursesBySemester[semester.id].map((course) => (
                            <div
                              key={course.id}
                              className={`flex justify-between items-center p-3 border rounded-lg ${
                                userRole === 'INSTRUCTOR'
                                  ? 'cursor-pointer hover:bg-gray-50'
                                  : ''
                              }`}
                              onClick={() => {
                                if (userRole === 'INSTRUCTOR') {
                                  // TODO: Navigate to course management page for instructors
                                  console.log(
                                    'Navigate to course management for:',
                                    course
                                  );
                                }
                              }}
                            >
                              <div className="flex-1 text-left">
                                <h4 className="font-medium">
                                  {course.department} {course.number} -{' '}
                                  {course.name}
                                </h4>
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {course.semester?.shortName ||
                                      `Semester ID: ${course.semesterId}`}
                                  </Badge>
                                </div>
                              </div>

                              {/* Admin-only buttons */}
                              {userRole === 'ADMIN' && (
                                <div
                                  className="flex gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCourse(course)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeleteCourse(course.id)
                                    }
                                    disabled={isDeletingCourse}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}

                              {/* Instructor-only indicator */}
                              {userRole === 'INSTRUCTOR' && (
                                <div className="text-sm text-muted-foreground">
                                  Click to manage students & teams
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {selectedSemesterId
                  ? `No courses found for the selected semester.`
                  : 'No courses found.'}
              </p>
              {userRole === 'ADMIN' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewCourseModalOpen(true)}
                >
                  Add Course
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <NewSemesterModal
        isOpen={isNewSemesterModalOpen}
        onClose={handleCloseModals}
      />

      <EditSemesterModal
        isOpen={isEditSemesterModalOpen}
        onClose={handleCloseModals}
        semester={selectedSemester}
      />

      <NewCourseModal
        isOpen={isNewCourseModalOpen}
        onClose={handleCloseModals}
      />

      <EditCourseModal
        isOpen={isEditCourseModalOpen}
        onClose={handleCloseModals}
        course={selectedCourse}
      />
    </div>
  );
}
