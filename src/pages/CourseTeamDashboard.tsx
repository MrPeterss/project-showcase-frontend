import { useParams, useLocation } from 'react-router-dom';
import { useMemo, useEffect, useRef } from 'react';
import { useTeam, useMyTeamsByOffering } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardTabs } from '@/context/DashboardTabsContext';
import { useCourseContext } from '@/components/CourseLayout';
import DashboardMainSection from './Dashboard/DashboardMainSection';
import DashboardSideBarSection from './Dashboard/DashboardSideBarSection';
import {
  canAccessAnyTeamDeployDashboard,
} from '@/lib/courseRoleAccess';

export default function CourseTeamDashboard() {
  const { teamId, courseId } = useParams<{
    teamId: string;
    courseId: string;
  }>();
  const location = useLocation();
  const { user } = useAuth();
  const { addTab, openTabs } = useDashboardTabs();
  const { effectiveRole, offering } = useCourseContext();
  const isUnmountingRef = useRef(false);

  const teamIdNum = useMemo(() => {
    if (!teamId) return undefined;
    const n = parseInt(teamId, 10);
    return isNaN(n) ? undefined : n;
  }, [teamId]);

  const { data: team, isLoading: loading, error } = useTeam(teamIdNum);

  // Get user's teams for this offering
  const offeringId = useMemo(() => {
    if (!courseId) return undefined;
    const n = parseInt(courseId, 10);
    return isNaN(n) ? undefined : n;
  }, [courseId]);

  const { data: myTeams } = useMyTeamsByOffering(
    offeringId && user ? offeringId : undefined
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

  const isRosterMember = myTeams?.some((t) => t.id === teamIdNum) ?? false;
  const canAccessDashboard =
    canAccessAnyTeamDashboard || isRosterMember;

  useEffect(() => {
    const expectedPath = `/courses/${courseId}/dashboard/${teamIdNum}`;
    const isOnCorrectRoute = location.pathname === expectedPath;

    if (isUnmountingRef.current || !isOnCorrectRoute) {
      return;
    }

    // Instructors/admins/TAs viewing another team's dashboard: open as a tab
    if (
      canAccessAnyTeamDashboard &&
      team &&
      teamIdNum &&
      myTeams &&
      !myTeams.some((t) => t.id === teamIdNum)
    ) {
      const tabExists = openTabs.some((tab) => tab.teamId === teamIdNum);
      if (!tabExists) {
        addTab(teamIdNum, team.name);
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
    addTab,
    openTabs,
    location.pathname,
    courseId,
    canAccessAnyTeamDashboard,
  ]);

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
            {(error as any)?.message || 'Team not found'}
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
