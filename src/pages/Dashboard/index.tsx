import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTeamById } from '@/store/thunks/teamsThunks';
import DashboardMainSection from './DashboardMainSection.tsx';
import DashboardSideBarSection from './DashboardSideBarSection.tsx';

export default function Dashboard() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const teamIdNum = useMemo(() => {
    if (!teamId) return undefined;
    const n = parseInt(teamId, 10);
    return isNaN(n) ? undefined : n;
  }, [teamId]);

  useEffect(() => {
    if (teamIdNum === undefined || !isAuthenticated || authLoading) return;
    void dispatch(fetchTeamById(teamIdNum));
  }, [dispatch, teamIdNum, isAuthenticated, authLoading]);

  const team = useAppSelector((s) =>
    teamIdNum !== undefined ? s.teams.detailById[teamIdNum] : undefined,
  );
  const loading = useAppSelector((s) =>
    teamIdNum !== undefined
      ? (s.teams.detailLoadingById[teamIdNum] ?? false)
      : false,
  );
  const teamLoadError = useAppSelector((s) =>
    teamIdNum !== undefined
      ? s.teams.detailErrorById[teamIdNum]
      : null,
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, {
        replace: true,
      });
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  // Show loading state while authenticating or loading team data
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading team data...</div>
        </div>
      </div>
    );
  }

  const error =
    teamLoadError !== null && teamLoadError !== undefined
      ? new Error(teamLoadError)
      : null;

  // Only show error if we're done loading and there's actually an error or no team
  if (!authLoading && isAuthenticated && !loading && (error || !team)) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600">
            {error?.message || 'Team not found'}
          </div>
        </div>
      </div>
    );
  }

  // At this point, team should be defined, but add a safety check
  if (!team) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardMainSection team={team} />
      <DashboardSideBarSection team={team} />
    </div>
  );
}
