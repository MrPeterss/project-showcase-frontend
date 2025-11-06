import React, { useState } from 'react';
import { services } from '@/services';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface NewTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseOfferingId: number;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  emails?: string;
  general?: string;
}

export const NewTeamModal: React.FC<NewTeamModalProps> = ({
  isOpen,
  onClose,
  courseOfferingId,
  onSuccess,
}) => {
  const [teamName, setTeamName] = useState('');
  const [emailsInput, setEmailsInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseEmails = (input: string): string[] => {
    // Split by comma, semicolon, or newline, then trim and filter empty strings
    return input
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!teamName.trim()) {
      newErrors.name = 'Team name is required';
    }

    if (!emailsInput.trim()) {
      newErrors.emails = 'At least one email is required';
    } else {
      const emails = parseEmails(emailsInput);
      if (emails.length === 0) {
        newErrors.emails = 'At least one email is required';
      } else {
        const invalidEmails = emails.filter(email => !validateEmail(email));
        if (invalidEmails.length > 0) {
          newErrors.emails = `Invalid email(s): ${invalidEmails.join(', ')}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const emails = parseEmails(emailsInput);
      
      await services.teams.create(courseOfferingId, {
        name: teamName.trim(),
        memberEmails: emails,
        courseOfferingId,
      });

      // Reset form
      setTeamName('');
      setEmailsInput('');
      setErrors({});

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (error: any) {
      console.error('Error creating team:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create team. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTeamName('');
      setEmailsInput('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Team">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter team name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
              Member Emails <span className="text-red-500">*</span>
            </label>
            <textarea
              id="emails"
              value={emailsInput}
              onChange={(e) => {
                setEmailsInput(e.target.value);
                if (errors.emails) {
                  setErrors({ ...errors, emails: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[120px] ${
                errors.emails ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email addresses, one per line or separated by commas&#10;Example:&#10;student1@cornell.edu&#10;student2@cornell.edu&#10;student3@cornell.edu"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter email addresses separated by commas, semicolons, or new lines
            </p>
            {errors.emails && (
              <p className="mt-1 text-sm text-red-600">{errors.emails}</p>
            )}
          </div>
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-700 hover:bg-red-800 text-white"
          >
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

