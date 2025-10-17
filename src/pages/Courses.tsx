import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Pencil, Trash2, Edit } from 'lucide-react';
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
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Course, Semester } from '@/services';

// Course Cell Component
interface CourseCellProps {
  course: Course;
  userRole: string | undefined;
  onEdit: (course: Course) => void;
  onDelete: (courseId: number) => void;
  isDeleting: boolean;
}

function CourseCell({ course, userRole, onEdit, onDelete, isDeleting }: CourseCellProps) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCourseClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(course);
    setShowDropdown(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(course.id);
    setShowDropdown(false);
  };

  return (
    <div className="relative group">
      <div
        className="bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 h-full"
        onClick={handleCourseClick}
      >
        <div className="flex flex-col h-full">
          <div className="bg-red-700 p-3 rounded-t-lg">
            <h4 className="font-semibold text-white text-base mb-2 line-clamp-2">
              {course.department} {course.number}
            </h4>
          </div>
          <div className="flex-1 p-4">
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {course.name}
            </p>
          </div>
          
          <div className="flex items-center justify-between p-4 pt-0">
            <Badge variant="outline" className="text-xs">
              {course.semester?.shortName || `Semester ID: ${course.semesterId}`}
            </Badge>
            
            {userRole === 'ADMIN' && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 hover:text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                
                {showDropdown && (
                  <div className="absolute right-0 top-10 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        onClick={handleEditClick}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Courses() {
  const dispatch = useAppDispatch();

  // Allow all roles to access this page
  const { hasAccess, userRole, isLoading } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'STUDENT',
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
              <Button 
                size="sm" 
                onClick={() => setIsNewCourseModalOpen(true)}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
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
              className="h-10 border-red-700 text-red-700 hover:bg-red-700 hover:text-white"
            >
              Edit Semester
            </Button>
          )}
        </div>
      </div>

      {/* Course List */}
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-left">
            {selectedSemesterId && semesters
              ? `${
                  semesters.find((s) => s.id.toString() === selectedSemesterId)
                    ?.shortName
                } Courses`
              : 'All Courses'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {coursesLoading ? (
            <p className="text-muted-foreground">Loading courses...</p>
          ) : coursesError ? (
            <p className="text-red-500">
              Error loading courses: {coursesError}
            </p>
          ) : courses && courses.length > 0 ? (
            // Show courses organized by semester if "All Semesters" is selected
            selectedSemesterId ? (
              // Single semester view - display as grid of cells
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {courses.map((course) => (
                  <CourseCell
                    key={course.id}
                    course={course}
                    userRole={userRole}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                    isDeleting={isDeletingCourse}
                  />
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
                      <div key={semester.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {/* Semester Header */}
                        <div className="flex items-center gap-3 pb-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-red-700 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {semester.shortName}
                            </h3>
                          </div>
                          <Badge variant="outline" className="text-sm border-red-700 text-red-700">
                            {coursesBySemester[semester.id].length} course
                            {coursesBySemester[semester.id].length !== 1
                              ? 's'
                              : ''}
                          </Badge>
                        </div>

                        {/* Courses for this semester - display as grid of cells */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {coursesBySemester[semester.id].map((course) => (
                            <CourseCell
                              key={course.id}
                              course={course}
                              userRole={userRole}
                              onEdit={handleEditCourse}
                              onDelete={handleDeleteCourse}
                              isDeleting={isDeletingCourse}
                            />
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
