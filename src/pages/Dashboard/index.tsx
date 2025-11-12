import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { useTeam } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import DashboardMainSection from './DashboardMainSection.tsx';
import DashboardSideBarSection from './DashboardSideBarSection.tsx';

export default function Dashboard() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const teamIdNum = useMemo(() => {
    if (!teamId) return undefined;
    const n = parseInt(teamId, 10);
    return isNaN(n) ? undefined : n;
  }, [teamId]);

  const { data: team, isLoading: loading, error } = useTeam(
    isAuthenticated && !authLoading ? teamIdNum : undefined
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading team data...</div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600">
            {(error as any)?.message || 'Team not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardMainSection team={team} />
      <DashboardSideBarSection team={team} />
    </div>
  );
}
