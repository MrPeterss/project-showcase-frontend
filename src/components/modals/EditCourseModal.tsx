import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateCourseById, fetchCourses } from '@/store/thunks/coursesThunks';
import { selectAllSemesters } from '@/store/selectors/semestersSelectors';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import type { Course } from '@/services';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

interface FormData {
  department: string;
  number: string;
  name: string;
  semesterId: string;
}

interface FormErrors {
  department?: string;
  number?: string;
  name?: string;
  semesterId?: string;
  general?: string;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const dispatch = useAppDispatch();
  const semesters = useAppSelector(selectAllSemesters);

  const [formData, setFormData] = useState<FormData>({
    department: '',
    number: '',
    name: '',
    semesterId: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when course changes
  useEffect(() => {
    if (course) {
      setFormData({
        department: course.department,
        number: course.number.toString(),
        name: course.name,
        semesterId: course.semesterId.toString(),
      });
    }
  }, [course]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate department
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    } else if (formData.department.trim().length < 2) {
      newErrors.department = 'Department must be at least 2 characters';
    }

    // Validate course number
    if (!formData.number.trim()) {
      newErrors.number = 'Course number is required';
    } else {
      const courseNumber = parseInt(formData.number.trim());
      if (isNaN(courseNumber) || courseNumber < 1000 || courseNumber > 9999) {
        newErrors.number =
          'Course number must be a valid 4-digit number (1000-9999)';
      }
    }

    // Validate course name
    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Course name must be at least 3 characters';
    }

    // Validate semester
    if (!formData.semesterId) {
      newErrors.semesterId = 'Semester is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await dispatch(
        updateCourseById({
          id: course.id,
          data: {
            department: formData.department.trim(),
            number: parseInt(formData.number.trim()),
            name: formData.name.trim(),
            semesterId: parseInt(formData.semesterId),
          },
        })
      ).unwrap();

      // Refresh courses before closing modal
      await dispatch(fetchCourses());

      // Don't close modal until request completes successfully
      onClose();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to update course',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  if (!course) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Course" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="edit-department"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Department *
            </label>
            <input
              type="text"
              id="edit-department"
              value={formData.department}
              onChange={(e) =>
                handleInputChange('department', e.target.value.toUpperCase())
              }
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.department ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., CS, MATH, PHYS"
              disabled={isSubmitting}
            />
            {errors.department && (
              <p className="mt-1 text-sm text-red-600">{errors.department}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Course Number *
            </label>
            <input
              type="text"
              id="edit-number"
              value={formData.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.number ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., 3110, 4780"
              disabled={isSubmitting}
            />
            {errors.number && (
              <p className="mt-1 text-sm text-red-600">{errors.number}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Course Name *
          </label>
          <input
            type="text"
            id="edit-name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Data Structures and Functional Programming"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="edit-semesterId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Semester *
          </label>
          <select
            id="edit-semesterId"
            value={formData.semesterId}
            onChange={(e) => handleInputChange('semesterId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.semesterId ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Select a semester</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id.toString()}>
                {formatSemesterShortName(semester)}
              </option>
            ))}
          </select>
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
            {isSubmitting ? 'Updating...' : 'Update Course'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EditCourseModal;
