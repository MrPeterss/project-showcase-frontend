import React, { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { createSemester, fetchSemesters } from '@/store/thunks/semestersThunks';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface NewSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback when semester is successfully created
}

interface FormData {
  season: string;
  year: string;
  startDate: string;
  endDate: string;
}

interface FormErrors {
  season?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  general?: string;
}

export const NewSemesterModal: React.FC<NewSemesterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<FormData>({
    season: '',
    year: '',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate season
    if (!formData.season.trim()) {
      newErrors.season = 'Season is required';
    }

    // Validate year
    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else {
      const year = parseInt(formData.year.trim());
      if (isNaN(year) || year < 2000 || year > 2100) {
        newErrors.year = 'Year must be a valid number between 2000 and 2100';
      }
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Convert date strings (YYYY-MM-DD) to ISO datetime strings
      // Append 'T00:00:00Z' to ensure UTC midnight, then convert to ISO string
      const startDateISO = new Date(formData.startDate + 'T00:00:00Z').toISOString();
      const endDateISO = new Date(formData.endDate + 'T00:00:00Z').toISOString();

      await dispatch(
        createSemester({
          season: formData.season.trim(),
          year: parseInt(formData.year.trim()),
          startDate: startDateISO,
          endDate: endDateISO,
        })
      ).unwrap();

      // Refresh semesters before closing modal
      await dispatch(fetchSemesters());

      // Reset form and close modal on success
      setFormData({
        season: '',
        year: '',
        startDate: '',
        endDate: '',
      });
      
      // Call success callback if provided (e.g., to refresh course offering modal)
      if (onSuccess) {
        onSuccess();
      }
      
      // Don't close modal until request completes successfully
      onClose();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to create semester',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        season: '',
        year: '',
        startDate: '',
        endDate: '',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Semester"
      size="md"
      zIndex={60}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="season"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Season *
            </label>
            <select
              id="season"
              value={formData.season}
              onChange={(e) => handleInputChange('season', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.season ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a season</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
            </select>
            {errors.season && (
              <p className="mt-1 text-sm text-red-600">{errors.season}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Year *
            </label>
            <input
              type="number"
              id="year"
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.year ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., 2024"
              min="2000"
              max="2100"
              disabled={isSubmitting}
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
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
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
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
            {isSubmitting ? 'Creating...' : 'Create Semester'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default NewSemesterModal;
