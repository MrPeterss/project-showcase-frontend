import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCourseContext } from '@/components/CourseLayout';
import {
  ArrowLeft,
  Upload,
  Users,
  Lock,
  Eye,
  Trash2,
  Tag,
  RefreshCw,
  Download,
  Pencil,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { services } from '@/services';
import {
  useUpdateCourseOffering,
  useDeleteCourseOffering,
} from '@/hooks/useCourseOfferings';
import {
  useEnrollmentsByOffering,
  useCreateEnrollments,
  useDeleteEnrollment,
} from '@/hooks/useEnrollments';
import { useCourseOfferings } from '@/hooks/useCourseOfferings';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import { useQueryClient } from '@tanstack/react-query';
import { teamKeys } from '@/hooks/useTeams';

export default function CourseSettings() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const { data: enrollmentsData, refetch: refetchEnrollments } =
    useEnrollmentsByOffering(offeringId);
  const enrollments = enrollmentsData || [];

  // State for editing user names
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // State for settings
  const [enrollmentInput, setEnrollmentInput] = useState('');
  const [showAddEnrollments, setShowAddEnrollments] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [selectedViewableOfferings, setSelectedViewableOfferings] = useState<
    number[]
  >([]);
  const [tagInput, setTagInput] = useState('');
  const [isTagging, setIsTagging] = useState(false);
  const [removingTag, setRemovingTag] = useState<string | null>(null);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [lockSuccess, setLockSuccess] = useState<string | null>(null);

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
  const parseEnrollmentInput = (input: string) => {
    // Parse comma-separated values: "email, role, name, team_name"
    // All fields except email are optional
    // Empty fields between commas are allowed (e.g., "email,,," or "email, INSTRUCTOR,,")
    const lines = input.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
      // Split by comma and trim each part
      const parts = line.split(',').map((s) => s.trim());
      const email = parts[0] || '';
      const role = parts[1] || '';
      const name = parts[2] || '';
      const teamName = parts[3] || '';

      // Validate role if provided (non-empty)
      const validRoles = ['INSTRUCTOR', 'STUDENT', 'VIEWER'];
      const enrollmentRole =
        role && validRoles.includes(role.toUpperCase())
          ? (role.toUpperCase() as 'INSTRUCTOR' | 'STUDENT' | 'VIEWER')
          : undefined;

      return {
        email,
        role: enrollmentRole,
        name: name || undefined,
        teamName: teamName || undefined,
      };
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !offering) {
      // Reset file input
      event.target.value = '';
      return;
    }

    // Reset file input
    event.target.value = '';

    try {
      const text = await file.text();
      if (!text.trim()) {
        setEnrollmentError('CSV file is empty.');
        return;
      }

      const enrollments = parseEnrollmentInput(text);

      // Validate that we have at least one valid email
      const validEnrollments = enrollments.filter(
        (e) => e.email.trim().length > 0
      );
      if (validEnrollments.length === 0) {
        setEnrollmentError(
          'CSV file does not contain any valid email addresses.'
        );
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = validEnrollments.filter(
        (e) => !emailRegex.test(e.email)
      );
      if (invalidEmails.length > 0) {
        setEnrollmentError(
          `Invalid email addresses in CSV: ${invalidEmails
            .map((e) => e.email)
            .join(', ')}`
        );
        return;
      }

      setEnrollmentError(null);
      await addEnrollments(validEnrollments);
    } catch (error: any) {
      console.error('Error processing CSV file:', error);
      const errorMessage =
        error?.message || 'Failed to read CSV file. Please try again.';
      setEnrollmentError(errorMessage);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content
    const templateContent = `email,role,name,team_name
pjb294@cornell.edu,,,
pjb294@cornell.edu, INSTRUCTOR,,
pjb294@cornell.edu,,Peter Bidoshi,
pjb294@cornell.edu,,,Team 3
student1@cornell.edu,STUDENT,John Doe,Team A
student2@cornell.edu,STUDENT,Jane Smith,Team A`;

    // Create blob and download
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'enrollment_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const addEnrollments = async (
    enrollments: Array<{
      email: string;
      role?: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER';
      name?: string;
      teamName?: string;
    }>
  ) => {
    if (!offering || !offeringId) return;

    try {
      // First, deduplicate enrollments by email (keep first occurrence)
      // Also collect team memberships separately to handle same person in multiple teams
      const enrollmentMap = new Map<
        string,
        {
          email: string;
          role: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER';
          name?: string;
        }
      >();

      // Map to track which emails belong to which teams
      // This allows the same person to be in multiple teams
      const teamsMap = new Map<string, Set<string>>();

      enrollments.forEach((enrollment) => {
        const email = enrollment.email.toLowerCase();

        // Only add enrollment if we haven't seen this email before
        if (!enrollmentMap.has(email)) {
          enrollmentMap.set(email, {
            email: enrollment.email, // Keep original case for display
            role: enrollment.role || 'STUDENT',
            name: enrollment.name,
          });
        }

        // Collect team memberships (allows duplicates - same person, multiple teams)
        if (
          enrollment.teamName &&
          (!enrollment.role || enrollment.role === 'STUDENT')
        ) {
          const teamName = enrollment.teamName;
          if (!teamsMap.has(teamName)) {
            teamsMap.set(teamName, new Set());
          }
          // Use lowercase email for deduplication within a team
          teamsMap.get(teamName)!.add(email);
        }
      });

      // Create enrollments (deduplicated)
      const enrollmentData = {
        enrollments: Array.from(enrollmentMap.values()),
      };

      let enrollmentErrorMessage = '';

      try {
        await createEnrollments.mutateAsync({
          offeringId: offering.id,
          data: enrollmentData,
        });
      } catch (error: any) {
        // Handle 409 Conflict (user already enrolled) - this is okay, continue with team creation
        if (error?.response?.status === 409) {
          // Treat as success, users are already enrolled - continue with team creation
          const conflictMessage =
            error?.response?.data?.message ||
            'Some users were already enrolled';
          enrollmentErrorMessage = conflictMessage;
        } else {
          // For other errors, show error and stop
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to create enrollments. Please try again.';
          setEnrollmentError(errorMessage);
          console.error('Error adding enrollments:', error);
          return; // Don't proceed with team creation if enrollment failed
        }
      }

      // Create or update teams with all members (handles same person in multiple teams)
      const teamErrors: string[] = [];
      for (const [teamName, memberEmailSet] of teamsMap.entries()) {
        try {
          // Convert Set to array - need to get original email case from enrollmentMap
          const memberEmails = Array.from(memberEmailSet).map((emailLower) => {
            // Find original email case from enrollmentMap
            const enrollment = enrollmentMap.get(emailLower);
            return enrollment?.email || emailLower;
          });

          await services.teams.create(offering.id, {
            name: teamName,
            memberEmails,
            courseOfferingId: offering.id,
          });
        } catch (error: any) {
          console.error(`Error creating team ${teamName}:`, error);
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            `Failed to create team ${teamName}`;
          teamErrors.push(`Team "${teamName}": ${errorMessage}`);
        }
      }

      // Show success/error messages
      if (teamErrors.length > 0) {
        const message = [
          enrollmentErrorMessage
            ? `Enrollments: ${enrollmentErrorMessage}`
            : 'Enrollments created successfully',
          'Team creation errors:',
          ...teamErrors,
        ].join('\n');
        alert(message);
      } else if (enrollmentErrorMessage) {
        alert(
          `Enrollments: ${enrollmentErrorMessage}\n\nTeams created successfully.`
        );
      } else {
        alert('Members added successfully!');
      }

      setEnrollmentInput('');
      setEnrollmentError(null);
      setShowAddEnrollments(false);
    } catch (error: any) {
      console.error('Error adding enrollments:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add members. Please try again.';
      setEnrollmentError(errorMessage);
    }
  };

  const handleAddEnrollments = () => {
    if (!enrollmentInput.trim()) {
      setEnrollmentError('Please enter at least one enrollment.');
      return;
    }
    const enrollments = parseEnrollmentInput(enrollmentInput);

    // Validate that we have at least one valid email
    const validEnrollments = enrollments.filter(
      (e) => e.email.trim().length > 0
    );
    if (validEnrollments.length === 0) {
      setEnrollmentError('Please enter at least one valid email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEnrollments.filter(
      (e) => !emailRegex.test(e.email)
    );
    if (invalidEmails.length > 0) {
      setEnrollmentError(
        `Invalid email addresses: ${invalidEmails
          .map((e) => e.email)
          .join(', ')}`
      );
      return;
    }

    setEnrollmentError(null);
    addEnrollments(validEnrollments);
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

  const handleStartEditName = (userId: number, currentName: string | null) => {
    setEditingUserId(userId);
    setEditingName(currentName || '');
  };

  const handleCancelEditName = () => {
    setEditingUserId(null);
    setEditingName('');
  };

  const handleSaveName = async (userId: number) => {
    if (!user || user.role !== 'ADMIN') return;

    setIsUpdatingName(true);
    try {
      const nameValue = editingName.trim() || null;
      await services.admin.updateUserName(userId, nameValue);
      // Refetch enrollments to get updated name
      await refetchEnrollments();
      setEditingUserId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error updating user name:', error);
      alert('Failed to update user name. Please try again.');
    } finally {
      setIsUpdatingName(false);
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

  const handleTagProjects = async () => {
    if (!offering || !offeringId || !tagInput.trim()) return;

    const trimmedTag = tagInput.trim();

    // Get existing tags from settings
    const existingTags: string[] = offering.settings?.project_tags || [];

    // Check for duplicate tag names
    if (existingTags.includes(trimmedTag)) {
      alert(
        `Tag "${trimmedTag}" already exists. Please use a different tag name.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to tag all projects with "${trimmedTag}"? This will tag all projects and give the currently deployed ones this version.`
    );

    if (!confirmed) return;

    setIsTagging(true);
    try {
      // Tag the projects
      await services.projects.tagProjects(offeringId, trimmedTag);

      // Update settings with the new tag
      const updatedTags = [...existingTags, trimmedTag];
      await updateCourseOffering.mutateAsync({
        id: offering.id,
        data: {
          settings: {
            ...offering.settings,
            project_tags: updatedTags,
          },
        },
      });

      // Refresh offering to get updated settings
      await refetchOffering();

      // Force refetch all team queries to update tags on dashboard pages immediately
      await queryClient.refetchQueries({ queryKey: teamKeys.all });

      setTagInput('');
      alert('Projects tagged successfully!');
    } catch (error) {
      console.error('Error tagging projects:', error);
      alert('Failed to tag projects. Please try again.');
    } finally {
      setIsTagging(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!offering || !offeringId) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove the tag "${tag}"? This will untag all projects with this tag. Projects will be marked for pruning if they are also non-running.`
    );

    if (!confirmed) return;

    setRemovingTag(tag);
    try {
      const response = await services.projects.removeTag(offeringId, tag);
      const result = response.data.result;

      // Show success message with details
      let message = `Tag "${tag}" removed successfully!\n\nUntagged projects: ${result.untagged}`;
      if (result.errors && result.errors.length > 0) {
        message += `\n\nErrors:\n${result.errors
          .map((e) => `Team ${e.teamId}: ${e.error}`)
          .join('\n')}`;
      }

      alert(message);

      // Update settings to remove the tag from project_tags array
      const existingTags: string[] = offering.settings?.project_tags || [];
      const updatedTags = existingTags.filter((t) => t !== tag);

      await updateCourseOffering.mutateAsync({
        id: offering.id,
        data: {
          settings: {
            ...offering.settings,
            project_tags: updatedTags,
          },
        },
      });

      // Refresh offering to get updated settings
      await refetchOffering();

      // Force refetch all team queries to update tags on dashboard pages immediately
      await queryClient.refetchQueries({ queryKey: teamKeys.all });
    } catch (error) {
      console.error('Error removing tag:', error);
      alert('Failed to remove tag. Please try again.');
    } finally {
      setRemovingTag(null);
    }
  };

  const handleToggleLock = async () => {
    if (!offering || !offeringId || isTogglingLock) return;

    // Clear previous messages
    setLockError(null);
    setLockSuccess(null);
    setIsTogglingLock(true);

    const isCurrentlyLocked = offering.settings?.serverLocked || false;

    try {
      if (isCurrentlyLocked) {
        await services.courseOfferings.unlock(offering.id);
        setLockSuccess('Project server unlocked successfully!');
      } else {
        await services.courseOfferings.lock(offering.id);
        setLockSuccess('Project server locked successfully!');
      }

      // Refresh offering to get updated settings
      await refetchOffering();

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setLockSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error toggling lock:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to toggle lock. Please try again.';
      setLockError(errorMessage);

      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setLockError(null);
      }, 5000);
    } finally {
      setIsTogglingLock(false);
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
              {/* Enrollments Table */}
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground">No enrollments found.</p>
              ) : (
                <div className="space-y-6">
                  {/* Group enrollments by role */}
                  {(['INSTRUCTOR', 'STUDENT', 'VIEWER'] as const).map(
                    (role) => {
                      const roleEnrollments = enrollments.filter(
                        (e) => e.role === role
                      );
                      if (roleEnrollments.length === 0) return null;

                      return (
                        <div
                          key={role}
                          className="space-y-2 border-b pb-6 last:border-b-0 last:pb-0"
                        >
                          <h4 className="text-sm font-semibold text-gray-700 capitalize">
                            {role}s ({roleEnrollments.length})
                          </h4>
                          <div className="border rounded-md overflow-hidden">
                            <div className="max-h-64 overflow-y-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b border-r">
                                      Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b border-r">
                                      Email
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b border-l">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {roleEnrollments.map((enrollment) => {
                                    const currentName =
                                      (enrollment.user as any)?.name || null;
                                    const isEditing =
                                      editingUserId === enrollment.userId;
                                    const isAdmin = user?.role === 'ADMIN';

                                    return (
                                      <tr
                                        key={enrollment.userId}
                                        className="hover:bg-gray-50 border-b last:border-b-0"
                                      >
                                        <td className="px-4 py-2 text-sm text-left border-r">
                                          {isEditing ? (
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) =>
                                                  setEditingName(e.target.value)
                                                }
                                                className="px-2 py-1 border rounded text-sm w-32"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    handleSaveName(
                                                      enrollment.userId
                                                    );
                                                  } else if (
                                                    e.key === 'Escape'
                                                  ) {
                                                    handleCancelEditName();
                                                  }
                                                }}
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleSaveName(
                                                    enrollment.userId
                                                  )
                                                }
                                                disabled={isUpdatingName}
                                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              >
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancelEditName}
                                                disabled={isUpdatingName}
                                                className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              <span>{currentName || '-'}</span>
                                              {isAdmin && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleStartEditName(
                                                      enrollment.userId,
                                                      currentName
                                                    )
                                                  }
                                                  className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-left border-r">
                                          {enrollment.user?.email ||
                                            `User ${enrollment.userId}`}
                                        </td>
                                        <td className="px-4 py-2 text-left border-l">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleRemoveEnrollment(
                                                enrollment.userId
                                              )
                                            }
                                            disabled={
                                              deleteEnrollment.isPending
                                            }
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEnrollmentError(null); // Clear previous errors
                        document.getElementById('csv-upload')?.click();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose CSV File
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Format: email, role, name, team_name (all optional except
                      email)
                    </span>
                  </div>
                  {enrollmentError && !showAddEnrollments && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {enrollmentError}
                    </div>
                  )}
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
                    onClick={() => setShowAddEnrollments(!showAddEnrollments)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {showAddEnrollments
                      ? 'Hide Manual Entry'
                      : 'Add Members Manually'}
                  </Button>

                  {showAddEnrollments && (
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          User Information (one per line)
                        </label>
                        <textarea
                          value={enrollmentInput}
                          onChange={(e) => {
                            setEnrollmentInput(e.target.value);
                            setEnrollmentError(null); // Clear error when user types
                          }}
                          placeholder="pjb294@cornell.edu,,,&#10;pjb294@cornell.edu, INSTRUCTOR,,&#10;pjb294@cornell.edu,,Peter Bidoshi,&#10;pjb294@cornell.edu,,,Team 3&#10;student1@cornell.edu, STUDENT, John Doe, Team A"
                          className="w-full h-32 p-3 border rounded-md text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: email, role, name, team_name (all optional
                          except email). Leave fields blank between commas to
                          skip them. Default role is STUDENT.
                        </p>
                        {enrollmentError && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {enrollmentError}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddEnrollments} size="sm">
                          Add Members
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddEnrollments(false);
                            setEnrollmentError(null);
                          }}
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
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-left mb-2">
                    Deployment Lock
                  </h4>
                  <p className="text-sm text-muted-foreground text-left mb-3">
                    When locked, students cannot deploy or stop projects. Admins
                    and instructors can still perform these actions.
                  </p>
                </div>

                {/* Current Status Display */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Current Status:
                    </span>
                    {offering?.settings?.serverLocked ? (
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-700 hover:bg-red-100"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleToggleLock}
                    disabled={isTogglingLock}
                    className={
                      offering?.settings?.serverLocked
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-700 hover:bg-red-800 text-white'
                    }
                  >
                    {isTogglingLock ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {offering?.settings?.serverLocked
                          ? 'Unlocking...'
                          : 'Locking...'}
                      </>
                    ) : offering?.settings?.serverLocked ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Unlock Server
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Lock Server
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {lockSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">
                  <Check className="h-4 w-4" />
                  <span>{lockSuccess}</span>
                </div>
              )}
              {lockError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{lockError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tag Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tag Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-left mb-2">
                  Version All Projects
                </h4>
                <p className="text-sm text-muted-foreground text-left mb-4">
                  Tag all projects and give the currently deployed ones a
                  version tag. This is useful for marking submission deadlines
                  or milestones.
                </p>
              </div>

              {/* Display existing tags */}
              {offering &&
                offering.settings?.project_tags &&
                offering.settings.project_tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Issued Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {offering.settings.project_tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm flex items-center gap-1 pr-1"
                        >
                          {tag}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(tag);
                            }}
                            disabled={removingTag === tag}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5 disabled:opacity-50 transition-colors"
                            aria-label={`Remove tag ${tag}`}
                          >
                            {removingTag === tag ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-red-600" />
                            )}
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Divider if there are existing tags */}
              {offering &&
                offering.settings?.project_tags &&
                offering.settings.project_tags.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm text-gray-500 font-medium">
                      Create New Tag
                    </span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                )}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g., final-submission, milestone-1, v1.0"
                    className="w-full p-3 border rounded-md text-sm"
                    disabled={isTagging}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a tag name to mark all currently deployed projects
                  </p>
                </div>

                <Button
                  onClick={handleTagProjects}
                  disabled={isTagging || !tagInput.trim()}
                  className="bg-red-700 hover:bg-red-800 text-white"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {isTagging ? 'Tagging...' : 'Tag All Projects'}
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
                    <h4 className="font-medium text-left mb-2">
                      Delete Course Offering
                    </h4>
                    <p className="text-sm text-muted-foreground text-left mb-4">
                      Permanently delete this course offering. This action
                      cannot be undone and will remove all associated data
                      including enrollments, teams, and projects.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCourseOffering}
                      disabled={deleteCourseOffering.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteCourseOffering.isPending
                        ? 'Deleting...'
                        : 'Delete Course Offering'}
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
