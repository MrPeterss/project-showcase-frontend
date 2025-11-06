import { useAppDispatch } from '@/store/hooks';
import { fetchCourses } from '@/store/thunks/coursesThunks';
import { fetchCourseOfferings } from '@/store/thunks/courseOfferingsThunks';
import { fetchSemesters } from '@/store/thunks/semestersThunks';
import {
  NewSemesterModal,
  EditSemesterModal,
  NewCourseModal,
  EditCourseModal,
  NewCourseOfferingModal,
} from '@/components/modals';
import type { CourseOffering, Semester } from '@/services';

interface CoursesModalsProps {
  isNewSemesterModalOpen: boolean;
  isEditSemesterModalOpen: boolean;
  isNewCourseModalOpen: boolean;
  isNewCourseOfferingModalOpen: boolean;
  isEditCourseModalOpen: boolean;
  selectedSemester: Semester | null;
  selectedOffering: CourseOffering | null;
  onCloseNewSemester: () => void;
  onCloseEditSemester: () => void;
  onCloseNewCourse: () => void;
  onCloseNewCourseOffering: () => void;
  onCloseEditCourse: () => void;
  onNewCourseClick: () => void;
  onNewSemesterClick: () => void;
}

export function CoursesModals({
  isNewSemesterModalOpen,
  isEditSemesterModalOpen,
  isNewCourseModalOpen,
  isNewCourseOfferingModalOpen,
  isEditCourseModalOpen,
  selectedSemester,
  selectedOffering,
  onCloseNewSemester,
  onCloseEditSemester,
  onCloseNewCourse,
  onCloseNewCourseOffering,
  onCloseEditCourse,
  onNewCourseClick,
  onNewSemesterClick,
}: CoursesModalsProps) {
  const dispatch = useAppDispatch();

  return (
    <>
      <NewSemesterModal
        isOpen={isNewSemesterModalOpen}
        onClose={async () => {
          onCloseNewSemester();
          await dispatch(fetchSemesters());
        }}
        onSuccess={() => {
          if (isNewCourseOfferingModalOpen) {
            dispatch(fetchCourses());
            dispatch(fetchSemesters());
          }
        }}
      />

      <EditSemesterModal
        isOpen={isEditSemesterModalOpen}
        onClose={onCloseEditSemester}
        semester={selectedSemester}
      />

      <NewCourseModal
        isOpen={isNewCourseModalOpen}
        onClose={async () => {
          onCloseNewCourse();
          await dispatch(fetchCourses());
        }}
        onSuccess={() => {
          if (isNewCourseOfferingModalOpen) {
            dispatch(fetchCourses());
          }
        }}
      />

      <NewCourseOfferingModal
        isOpen={isNewCourseOfferingModalOpen}
        onClose={async () => {
          onCloseNewCourseOffering();
          await dispatch(fetchCourseOfferings(undefined));
        }}
        onNewCourseClick={onNewCourseClick}
        onNewSemesterClick={onNewSemesterClick}
      />

      <EditCourseModal
        isOpen={isEditCourseModalOpen}
        onClose={onCloseEditCourse}
        course={selectedOffering as any}
      />
    </>
  );
}
