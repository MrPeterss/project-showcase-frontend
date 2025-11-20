import { Card, CardContent } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedSemesterId } from '@/store/slices/coursesSlice';
import {
  fetchCourseOfferings,
} from '@/store/thunks/courseOfferingsThunks';
import { fetchSemesters } from '@/store/thunks/semestersThunks';
import { selectSelectedSemesterId, selectAllCourses } from '@/store/selectors/coursesSelectors';
import {
  selectCourseOfferingsBySelectedSemester,
  selectCourseOfferingsError,
  selectCourseOfferingsLoading,
} from '@/store/selectors/courseOfferingsSelectors';
import { selectAllSemesters } from '@/store/selectors/semestersSelectors';
import { selectIsLoading, selectUser } from '@/store/selectors/userSelectors';
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { Semester, Course } from '@/services';
import { CoursesHeader } from './CoursesHeader';
import { SemesterSelector } from './SemesterSelector';
import { CourseOfferingsList } from './CourseOfferingsList';
import { CoursesModals } from './CoursesModals';

export default function Courses() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector(selectUser);
  const authLoading = useAppSelector(selectIsLoading);
  const isAuthenticated = !!authUser;

  // Redux selectors
  const offerings = useAppSelector(selectCourseOfferingsBySelectedSemester);
  const offeringsLoading = useAppSelector(selectCourseOfferingsLoading);
  const offeringsError = useAppSelector(selectCourseOfferingsError);
  const selectedSemesterId = useAppSelector(selectSelectedSemesterId);
  const semesters = useAppSelector(selectAllSemesters);
  const courses = useAppSelector(selectAllCourses);
  const user = useAppSelector(selectUser);

  // Modal state
  const [isNewSemesterModalOpen, setIsNewSemesterModalOpen] = useState(false);
  const [isEditSemesterModalOpen, setIsEditSemesterModalOpen] = useState(false);
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [isNewCourseOfferingModalOpen, setIsNewCourseOfferingModalOpen] =
    useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
    null
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Wait for user to load before showing admin controls
  const isAdmin = user?.role === 'ADMIN';

  // Fetch data on component mount, but wait for authentication
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (authLoading || !isAuthenticated || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    dispatch(fetchSemesters());
    dispatch(fetchCourseOfferings(undefined));
  }, [dispatch, isAuthenticated, authLoading]);

  // Handle semester selection change
  const handleSemesterChange = (semesterId: string) => {
    dispatch(setSelectedSemesterId(semesterId));
  };

  // Modal handlers
  const handleEditSemester = (semester: Semester) => {
    setSelectedSemester(semester);
    setIsEditSemesterModalOpen(true);
  };

  const handleEditCourse = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setIsEditCourseModalOpen(true);
    }
  };

  const handleEditSemesterFromOffering = (semesterId: number) => {
    const semester = semesters.find(s => s.id === semesterId);
    if (semester) {
      setSelectedSemester(semester);
      setIsEditSemesterModalOpen(true);
    }
  };

  const handleCloseModals = () => {
    setIsNewSemesterModalOpen(false);
    setIsEditSemesterModalOpen(false);
    setIsNewCourseModalOpen(false);
    setIsNewCourseOfferingModalOpen(false);
    setIsEditCourseModalOpen(false);
    setSelectedSemester(null);
    setSelectedCourse(null);
  };

  // Show loading state while checking authentication
  if (authLoading) {
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header with Semester Selection */}
      <div className="mb-6">
        <CoursesHeader
          selectedSemesterId={selectedSemesterId}
          semesters={semesters}
          userRole={user?.role}
          isAdmin={isAdmin}
          onAddCourse={() => setIsNewCourseOfferingModalOpen(true)}
        />

        <SemesterSelector
          selectedSemesterId={selectedSemesterId || ''}
          semesters={semesters}
          isAdmin={isAdmin}
          onSemesterChange={handleSemesterChange}
          onAddSemester={() => setIsNewSemesterModalOpen(true)}
          onEditSemester={handleEditSemester}
        />
      </div>

      {/* Course List */}
      <CourseOfferingsList
        offerings={offerings}
        semesters={semesters}
        selectedSemesterId={selectedSemesterId}
        isLoading={offeringsLoading}
        error={offeringsError}
        isAdmin={isAdmin}
        onAddCourse={() => setIsNewCourseOfferingModalOpen(true)}
      />

      {/* Modals */}
      <CoursesModals
        isNewSemesterModalOpen={isNewSemesterModalOpen}
        isEditSemesterModalOpen={isEditSemesterModalOpen}
        isNewCourseModalOpen={isNewCourseModalOpen}
        isNewCourseOfferingModalOpen={isNewCourseOfferingModalOpen}
        isEditCourseModalOpen={isEditCourseModalOpen}
        selectedSemester={selectedSemester}
        selectedCourse={selectedCourse}
        onCloseNewSemester={() => setIsNewSemesterModalOpen(false)}
        onCloseEditSemester={handleCloseModals}
        onCloseNewCourse={() => setIsNewCourseModalOpen(false)}
        onCloseNewCourseOffering={() => setIsNewCourseOfferingModalOpen(false)}
        onCloseEditCourse={handleCloseModals}
        onNewCourseClick={() => setIsNewCourseModalOpen(true)}
        onNewSemesterClick={() => setIsNewSemesterModalOpen(true)}
        onEditCourseClick={handleEditCourse}
        onEditSemesterClick={handleEditSemesterFromOffering}
      />
    </div>
  );
}
