import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { updateSemesterById } from '@/store/thunks/semestersThunks';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { Semester } from '@/services';

interface EditSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  semester: Semester | null;
}

interface FormData {
  shortName: string;
  startDate: string;
  endDate: string;
}

interface FormErrors {
  shortName?: string;
  startDate?: string;
  endDate?: string;
  general?: string;
}

export const EditSemesterModal: React.FC<EditSemesterModalProps> = ({
  isOpen,
  onClose,
  semester,
}) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<FormData>({
    shortName: '',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when semester changes
  useEffect(() => {
    if (semester) {
      setFormData({
        shortName: semester.shortName,
        startDate: semester.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: semester.endDate.split('T')[0],
      });
    }
  }, [semester]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate short name
    if (!formData.shortName.trim()) {
      newErrors.shortName = 'Short name is required';
    } else if (formData.shortName.trim().length < 3) {
      newErrors.shortName = 'Short name must be at least 3 characters';
    }

    // Validate dates
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    // Validate date logic
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (startDate >= endDate) {
        newErrors.endDate = 'End date must be after start date';
      }
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

    if (!semester || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await dispatch(
        updateSemesterById({
          id: semester.id,
          data: {
            shortName: formData.shortName.trim(),
            startDate: formData.startDate,
            endDate: formData.endDate,
          },
        })
      ).unwrap();

      onClose();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to update semester',
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

  if (!semester) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Semester"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="edit-shortName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Short Name *
          </label>
          <input
            type="text"
            id="edit-shortName"
            value={formData.shortName}
            onChange={(e) => handleInputChange('shortName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.shortName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Fall 2024, Spring 2025"
            disabled={isSubmitting}
          />
          {errors.shortName && (
            <p className="mt-1 text-sm text-red-600">{errors.shortName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="edit-startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date *
          </label>
          <input
            type="date"
            id="edit-startDate"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.startDate ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="edit-endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date *
          </label>
          <input
            type="date"
            id="edit-endDate"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.endDate ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
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
            {isSubmitting ? 'Updating...' : 'Update Semester'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EditSemesterModal;
