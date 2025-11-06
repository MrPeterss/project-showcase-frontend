import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAuth } from '@/hooks/useAuth';
import { CourseNavBar } from '@/components/CourseNavBar';
import { ArrowLeft, Plus, ExternalLink, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { services } from '@/services';
import { NewTeamModal, EditTeamModal } from '@/components/modals';
import type { CourseOffering, Team } from '@/services/types';

export default function CourseProjects() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);

  // Allow all roles to access this page (including VIEWER)
  const { hasAccess: isAuthenticated } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'STUDENT',
    'VIEWER',
  ]);
  const { user } = useAuth();

  // Function to fetch all data
  const fetchData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const offeringId = parseInt(courseId, 10);
      if (isNaN(offeringId)) {
        setError('Invalid course offering ID');
        return;
      }

      // Fetch course offering (includes course and semester info)
      const offeringResponse = await services.courseOfferings.getById(
        offeringId
      );
      const offeringData = offeringResponse.data;
      setOffering(offeringData);

      // Fetch teams for this offering
      try {
        const teamsResponse = await services.teams.getByCourseOffering(
          offeringId
        );
        setTeams(teamsResponse.data);
      } catch (teamsError) {
        console.error('Error fetching teams:', teamsError);
        // Teams might not be available, set empty array
        setTeams([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load course offering';
      setError(errorMessage);
      console.error('Error fetching course offering:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch course offering data
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [courseId, isAuthenticated]);

  // If user doesn't have access, the hook will handle redirection
  if (!isAuthenticated) {
    return null;
  }

  // Get course name for navigation
  const courseName = offering?.course
    ? `${offering.course.department} ${offering.course.number} - ${offering.course.name}`
    : `Course ${courseId}`;

  // Get site URL from environment variable or use window location
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.hostname;

  // Generate project URL for a team
  const getProjectUrl = (teamName: string) => {
    // Format: teamname.{site_URL}
    // Remove any spaces and convert to lowercase for URL
    const sanitizedTeamName = teamName.toLowerCase().replace(/\s+/g, '');
    return `https://${sanitizedTeamName}.${siteUrl}`;
  };

  return (
    <div>
      {/* Course Navigation */}
      <CourseNavBar
        courseId={courseId!}
        courseName={courseName}
        courseUserRole={offering?.userRole}
        semester={offering?.semester}
      />

      <div className="container mx-auto p-6">
        {/* Loading state */}
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        ) : error ? (
          /* Error state */
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Error Loading Course
                </h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => navigate('/courses')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Courses
                </Button>
              </div>
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
          /* Course offering content */
          <>
            {/* Teams Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Teams ({teams.length})</CardTitle>
                  {(offering?.userRole === 'INSTRUCTOR' ||
                    user?.role === 'ADMIN') && (
                    <Button
                      size="sm"
                      onClick={() => setIsNewTeamModalOpen(true)}
                      className="bg-red-700 hover:bg-red-800 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Team
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No teams have been created yet.
                    </p>
                    {(offering?.userRole === 'INSTRUCTOR' ||
                      user?.role === 'ADMIN') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsNewTeamModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Team
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">
                            Team Name
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Members
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Project Link
                          </th>
                          {(offering?.userRole === 'INSTRUCTOR' ||
                            user?.role === 'ADMIN') && (
                            <th className="text-right p-3 font-semibold">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((team) => (
                          <tr
                            key={team.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="text-left p-3 font-medium">
                              {team.name}
                            </td>
                            <td className="text-left p-3">
                              <Badge variant="outline">
                                {team.members?.length || 0}
                              </Badge>
                            </td>
                            <td className="text-left p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const projectUrl = getProjectUrl(team.name);
                                  window.open(
                                    projectUrl,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                }}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open Project
                              </Button>
                            </td>
                            {(offering?.userRole === 'INSTRUCTOR' ||
                              user?.role === 'ADMIN') && (
                              <td className="text-right p-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTeam(team);
                                    setIsEditTeamModalOpen(true);
                                  }}
                                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* New Team Modal */}
            {offering && (
              <>
                <NewTeamModal
                  isOpen={isNewTeamModalOpen}
                  onClose={() => setIsNewTeamModalOpen(false)}
                  courseOfferingId={offering.id}
                  onSuccess={() => {
                    // Refresh teams after successful creation
                    const offeringId = parseInt(courseId!, 10);
                    if (!isNaN(offeringId)) {
                      services.teams
                        .getByCourseOffering(offeringId)
                        .then((response) => {
                          setTeams(response.data);
                        })
                        .catch((error) => {
                          console.error('Error refreshing teams:', error);
                        });
                    }
                  }}
                />
                <EditTeamModal
                  isOpen={isEditTeamModalOpen}
                  onClose={() => {
                    setIsEditTeamModalOpen(false);
                    setEditingTeam(null);
                  }}
                  courseOfferingId={offering.id}
                  team={editingTeam}
                  onSuccess={() => {
                    // Refresh teams after successful update
                    const offeringId = parseInt(courseId!, 10);
                    if (!isNaN(offeringId)) {
                      services.teams
                        .getByCourseOffering(offeringId)
                        .then((response) => {
                          setTeams(response.data);
                        })
                        .catch((error) => {
                          console.error('Error refreshing teams:', error);
                        });
                    }
                  }}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
