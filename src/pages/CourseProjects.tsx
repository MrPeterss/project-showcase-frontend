import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCourseContext } from '@/components/CourseLayout';
import { ArrowLeft, Plus, ExternalLink, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTeamsByOffering } from '@/hooks/useTeams';
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

  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);

  const dispatch = useAppDispatch();

  const offeringId = useMemo(() => {
    if (!courseId) return undefined;
    const n = parseInt(courseId, 10);
    return isNaN(n) ? undefined : n;
  }, [courseId]);

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
  const getProjectUrl = (teamName: string) => {
    // Format: teamname.{site_URL}
    // Remove any spaces and convert to lowercase for URL
    const sanitizedTeamName = teamName.toLowerCase().replace(/\s+/g, '');
    return `https://${sanitizedTeamName}.${siteUrl}`;
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
                          Project Link
                        </th>
                        {canManage && (
                          <th className="text-right p-3 font-semibold">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => (
                        <tr key={team.id} className="border-b hover:bg-gray-50">
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
                          {canManage && (
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
