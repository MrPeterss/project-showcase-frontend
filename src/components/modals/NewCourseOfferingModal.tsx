import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCourses } from '@/store/thunks/coursesThunks';
import { fetchSemesters } from '@/store/thunks/semestersThunks';
import { fetchCourseOfferings } from '@/store/thunks/courseOfferingsThunks';
import { selectAllSemesters } from '@/store/selectors/semestersSelectors';
import { selectAllCourses } from '@/store/selectors/coursesSelectors';
import { services } from '@/services';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import type { Course, Semester } from '@/services/types';

interface NewCourseOfferingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewCourseClick?: () => void;
  onNewSemesterClick?: () => void;
}

interface FormData {
  courseId: string;
  semesterId: string;
}

interface FormErrors {
  courseId?: string;
  semesterId?: string;
  general?: string;
}

export const NewCourseOfferingModal: React.FC<NewCourseOfferingModalProps> = ({
  isOpen,
  onClose,
  onNewCourseClick,
  onNewSemesterClick,
}) => {
  const dispatch = useAppDispatch();
  const courses = useAppSelector(selectAllCourses); // Course templates (no semester)
  const semesters = useAppSelector(selectAllSemesters);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    semesterId: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch course templates and semesters when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCourses());
      dispatch(fetchSemesters());
    }
  }, [isOpen, dispatch]);

  // Courses are already templates (no semester), so just sort them
  const courseTemplates = [...courses].sort((a, b) => {
    if (a.department !== b.department) {
      return a.department.localeCompare(b.department);
    }
    return a.number - b.number;
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.courseId) {
      newErrors.courseId = 'Course is required';
    }

    if (!formData.semesterId) {
      newErrors.semesterId = 'Semester is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Create course offering using the new endpoint
      const response = await services.courseOfferings.create({
        courseId: parseInt(formData.courseId),
        semesterId: parseInt(formData.semesterId),
      });

      // Refresh course offerings so the new offering appears in the list
      await dispatch(fetchCourseOfferings(undefined));

      // Refresh course templates (though they won't change)
      await dispatch(fetchCourses());

      // Reset form and close modal on success
      setFormData({
        courseId: '',
        semesterId: '',
      });
      // Don't close modal until request completes successfully
      onClose();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Failed to create course offering',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        courseId: '',
        semesterId: '',
      });
      setErrors({});
      onClose();
    }
  };

  const handleNewCourseClick = () => {
    // Don't close this modal, just open the new course modal
    if (onNewCourseClick) {
      onNewCourseClick();
    }
  };

  const handleNewSemesterClick = () => {
    // Don't close this modal, just open the new semester modal
    if (onNewSemesterClick) {
      onNewSemesterClick();
    }
  };

  const courseOptions = courseTemplates.map((course) => ({
    value: course.id.toString(),
    label: `${course.department} ${course.number}: ${course.name}`,
  }));

  const semesterOptions = semesters.map((semester) => ({
    value: semester.id.toString(),
    label: `${formatSemesterShortName(semester)} (${new Date(
      semester.startDate
    ).toLocaleDateString()} - ${new Date(
      semester.endDate
    ).toLocaleDateString()})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Course Offering"
      size="md"
      zIndex={50}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div>
          <CustomSelect
            value={formData.courseId}
            onChange={(value) => handleFieldChange('courseId', value)}
            options={courseOptions}
            placeholder="Select a course"
            label="Course *"
            showAddButton={true}
            onAddClick={handleNewCourseClick}
            addButtonText="Add New Course"
          />
          {errors.courseId && (
            <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>
          )}
        </div>

        <div>
          <CustomSelect
            value={formData.semesterId}
            onChange={(value) => handleFieldChange('semesterId', value)}
            options={semesterOptions}
            placeholder="Select a semester"
            label="Semester *"
            showAddButton={true}
            onAddClick={handleNewSemesterClick}
            addButtonText="Add New Semester"
          />
          {errors.semesterId && (
            <p className="mt-1 text-sm text-red-600">{errors.semesterId}</p>
          )}
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Offering'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default NewCourseOfferingModal;
