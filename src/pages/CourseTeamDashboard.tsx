import { useParams, useLocation } from 'react-router-dom';
import { useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCourseShell } from '@/hooks/useCourseShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchMyTeamsByOffering,
  fetchTeamById,
} from '@/store/thunks/teamsThunks';
import { addDashboardTab } from '@/store/slices/dashboardTabsSlice';
import { selectDashboardTabsForOffering } from '@/store/selectors/courseShellSelectors';
import DashboardMainSection from './Dashboard/DashboardMainSection';
import DashboardSideBarSection from './Dashboard/DashboardSideBarSection';
import {
  canAccessAnyTeamDeployDashboard,
} from '@/lib/courseRoleAccess';

export default function CourseTeamDashboard() {
  const { teamId, offeringId: offeringIdParam } = useParams<{
    teamId: string;
    offeringId: string;
  }>();
  const location = useLocation();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { effectiveRole, offering } = useCourseShell();
  const isUnmountingRef = useRef(false);

  const offeringIdNum = useMemo(() => {
    if (!offeringIdParam) return null;
    const n = parseInt(offeringIdParam, 10);
    return Number.isFinite(n) ? n : null;
  }, [offeringIdParam]);

  const teamIdNum = useMemo(() => {
    if (!teamId) return undefined;
    const n = parseInt(teamId, 10);
    return isNaN(n) ? undefined : n;
  }, [teamId]);

  useEffect(() => {
    if (teamIdNum === undefined) return;
    void dispatch(fetchTeamById(teamIdNum));
  }, [dispatch, teamIdNum]);

  useEffect(() => {
    if (offeringIdNum === null || !user) return;
    void dispatch(fetchMyTeamsByOffering(offeringIdNum));
  }, [dispatch, offeringIdNum, user]);

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

  const myTeams = useAppSelector((s) =>
    offeringIdNum !== null
      ? (s.teams.myByOffering[offeringIdNum] ?? [])
      : [],
  );

  const openTabs = useAppSelector(
    offeringIdNum !== null
      ? selectDashboardTabsForOffering(offeringIdNum)
      : () => [],
  );

  const canAccessAnyTeamDashboard = canAccessAnyTeamDeployDashboard(
    effectiveRole,
  );

  const enrollmentRoleByUserId = useMemo(() => {
    const list = offering?.enrollments;
    if (!list?.length) return undefined;
    const m = new Map<number, string>();
    for (const e of list) {
      m.set(e.userId, e.role);
    }
    return m;
  }, [offering?.enrollments]);

  const isRosterMember = myTeams.some((t) => t.id === teamIdNum);
  const canAccessDashboard =
    canAccessAnyTeamDashboard || isRosterMember;

  useEffect(() => {
    const expectedPath = `/courses/${offeringIdParam}/dashboard/${teamIdNum}`;
    const isOnCorrectRoute = location.pathname === expectedPath;

    if (
      isUnmountingRef.current ||
      !isOnCorrectRoute ||
      offeringIdNum === null
    ) {
      return;
    }

    // Instructors/admins/TAs viewing another team's dashboard: open as a tab
    if (
      canAccessAnyTeamDashboard &&
      team &&
      teamIdNum &&
      myTeams.length > 0 &&
      !myTeams.some((t) => t.id === teamIdNum)
    ) {
      const tabExists = openTabs.some((tab) => tab.teamId === teamIdNum);
      if (!tabExists) {
        dispatch(
          addDashboardTab({
            offeringId: offeringIdNum,
            teamId: teamIdNum,
            teamName: team.name,
          }),
        );
      }
    }

    return () => {
      isUnmountingRef.current = true;
    };
  }, [
    effectiveRole,
    team,
    teamIdNum,
    myTeams,
    openTabs,
    location.pathname,
    offeringIdParam,
    offeringIdNum,
    canAccessAnyTeamDashboard,
    dispatch,
  ]);

  const error =
    teamLoadError !== null && teamLoadError !== undefined
      ? new Error(teamLoadError)
      : null;

  if (loading) {
    return (
      <div className="flex flex-1 bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading team data...</div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex flex-1 bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600">
            {error?.message || 'Team not found'}
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessDashboard) {
    return (
      <div className="flex flex-1 bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600">
            You don't have access to this team's dashboard.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-gray-50 min-h-0 overflow-hidden">
      <DashboardMainSection team={team} />
      <DashboardSideBarSection
        team={team}
        enrollmentRoleByUserId={enrollmentRoleByUserId}
      />
    </div>
  );
}
