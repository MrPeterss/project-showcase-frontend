import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCourseContext } from '@/components/CourseLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Plus,
  ExternalLink,
  Pencil,
  Github,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useTeamsByOffering,
  useMyTeamsByOffering,
  useDeleteTeam,
} from '@/hooks/useTeams';
import { useDashboardTabs } from '@/context/DashboardTabsContext';
import { NewTeamModal, EditTeamModal } from '@/components/modals';
import type { Team } from '@/services/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectTeamsByOffering,
  selectTeamsError,
  selectTeamsLoading,
} from '@/store/selectors/teamsSelectors';
import {
  setTeams,
  setTeamsError,
  setTeamsLoading,
} from '@/store/slices/teamsSlice';

export default function CourseProjects() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const {
    offering,
    loading: offeringLoading,
    error: offeringError,
    effectiveRole,
  } = useCourseContext();
  const { user } = useAuth();
  const { addTab } = useDashboardTabs();

  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);

  const dispatch = useAppDispatch();

  const offeringId = useMemo(() => {
    if (!courseId) return undefined;
    const n = parseInt(courseId, 10);
    return isNaN(n) ? undefined : n;
  }, [courseId]);

  const deleteTeam = useDeleteTeam(offeringId);

  // Get user's teams to check if admin is viewing a team they're not part of
  const { data: myTeams } = useMyTeamsByOffering(
    offeringId && user ? offeringId : undefined
  );

  const {
    data: teamsData,
    isLoading: teamsQueryLoading,
    error: teamsQueryError,
  } = useTeamsByOffering(offering && offeringId ? offeringId : undefined);

  const teams = useAppSelector((state) =>
    selectTeamsByOffering(state, offeringId)
  );
  const teamsLoading = useAppSelector((state) =>
    selectTeamsLoading(state, offeringId)
  );
  const teamsError = useAppSelector((state) =>
    selectTeamsError(state, offeringId)
  );

  const canManage = effectiveRole === 'INSTRUCTOR' || effectiveRole === 'ADMIN';

  useEffect(() => {
    if (!offeringId) return;
    dispatch(
      setTeamsLoading({ offeringId, isLoading: Boolean(teamsQueryLoading) })
    );
  }, [dispatch, offeringId, teamsQueryLoading]);

  useEffect(() => {
    if (!offeringId || teamsData === undefined) return;
    dispatch(setTeams({ offeringId, teams: teamsData }));
  }, [dispatch, offeringId, teamsData]);

  useEffect(() => {
    if (!offeringId) return;
    if (teamsQueryError) {
      const message =
        teamsQueryError instanceof Error
          ? teamsQueryError.message
          : 'Failed to load teams';
      dispatch(setTeamsError({ offeringId, error: message }));
    } else {
      dispatch(setTeamsError({ offeringId, error: null }));
    }
  }, [dispatch, offeringId, teamsQueryError]);

  // Get site URL from environment variable or use window location
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.hostname;

  // Generate project URL for a team
  const getProjectUrl = (team: Team) => {
    // Prefer container name from the latest project when available
    const latestProject =
      team.projects && team.projects.length > 0 ? team.projects[0] : null;
    const rawName =
      latestProject?.containerName?.replace(/^\//, '') || team.name;

    // Format: {container-name}.{site_URL}
    // Remove slashes/spaces and convert to lowercase for URL
    const sanitizedName = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return `https://${sanitizedName}.${siteUrl}`;
  };

  const loading = offeringLoading || teamsLoading;
  const error = offeringError || teamsError;

  return (
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
              <h2 className="text-2xl font-bold mb-4">Error Loading Course</h2>
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
                {canManage && (
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
                  {canManage && (
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
                        <th className="text-left p-3 font-semibold">Members</th>
                        <th className="text-left p-3 font-semibold">
                          Last Updated
                        </th>
                        <th
                          className={`p-3 font-semibold ${
                            canManage ? 'text-left' : 'text-right'
                          }`}
                        >
                          Project Link
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => {
                        // Get the most recent deployment date
                        const latestProject =
                          team.projects && team.projects.length > 0
                            ? team.projects[0]
                            : null;
                        const lastDeployed = latestProject?.deployedAt || null;
                        const githubUrl = latestProject
                          ? (latestProject as any).githubUrl ||
                            latestProject.gitHubLink
                          : null;
                        const isDeployed = lastDeployed !== null;

                        const handleTeamNameClick = () => {
                          // Check if user is a member of this team
                          const isTeamMember = myTeams?.some((t: Team) => t.id === team.id) ?? false;
                          
                          // Students can only access their own teams
                          if (!canManage && !isTeamMember) {
                            return;
                          }
                          
                          // If admin or instructor is viewing a team they're not part of, add it as a tab first
                          if (
                            canManage &&
                            myTeams &&
                            !myTeams.some((t: Team) => t.id === team.id)
                          ) {
                            addTab(team.id, team.name);
                          }
                          // Then navigate
                          navigate(`/courses/${courseId}/dashboard/${team.id}`);
                        };

                        const handleDelete = async () => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`
                            )
                          ) {
                            try {
                              await deleteTeam.mutateAsync(team.id);
                            } catch (error) {
                              console.error('Error deleting team:', error);
                              alert('Failed to delete team. Please try again.');
                            }
                          }
                        };

                        return (
                          <tr
                            key={team.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="text-left p-3">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const isTeamMember = myTeams?.some((t: Team) => t.id === team.id) ?? false;
                                  const canAccess = canManage || isTeamMember;
                                  
                                  return canAccess ? (
                                    <button
                                      onClick={handleTeamNameClick}
                                      className="font-medium text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                    >
                                      {team.name}
                                    </button>
                                  ) : (
                                    <span className="font-medium text-gray-700">
                                      {team.name}
                                    </span>
                                  );
                                })()}
                                {canManage && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTeam(team);
                                        setIsEditTeamModalOpen(true);
                                      }}
                                      className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                      }}
                                      disabled={deleteTeam.isPending}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="text-left p-3">
                              <Badge variant="outline">
                                {team.members?.length || 0}
                              </Badge>
                            </td>
                            <td className="text-left p-3 text-sm text-muted-foreground">
                              {lastDeployed
                                ? new Date(lastDeployed).toLocaleString()
                                : 'Not deployed'}
                            </td>
                            <td
                              className={`p-3 ${
                                canManage ? 'text-left' : 'text-right'
                              }`}
                            >
                              <div
                                className={`flex items-center gap-2 ${
                                  canManage ? '' : 'justify-end'
                                }`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const projectUrl = getProjectUrl(team);
                                    window.open(
                                      projectUrl,
                                      '_blank',
                                      'noopener,noreferrer'
                                    );
                                  }}
                                  disabled={!isDeployed}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open Project
                                </Button>
                                {isDeployed && githubUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      window.open(
                                        githubUrl,
                                        '_blank',
                                        'noopener,noreferrer'
                                      );
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <Github className="h-4 w-4" />
                                    GitHub
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
                onSuccess={() => {}}
              />
              <EditTeamModal
                isOpen={isEditTeamModalOpen}
                onClose={() => {
                  setIsEditTeamModalOpen(false);
                  setEditingTeam(null);
                }}
                team={editingTeam}
                onSuccess={() => {}}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
