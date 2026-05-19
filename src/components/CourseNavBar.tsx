import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCourseShell } from '@/hooks/useCourseShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Shield, X } from 'lucide-react';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Role, Semester } from '@/services/types';
import {
  canAccessCourseSettingsRoute,
  canAccessSparkOfferingRoute,
} from '@/lib/courseRoleAccess';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyTeamsByOffering } from '@/store/thunks/teamsThunks';
import { removeDashboardTab } from '@/store/slices/dashboardTabsSlice';
import { selectDashboardTabsForOffering } from '@/store/selectors/courseShellSelectors';

interface CourseNavBarProps {
  offeringIdParam: string;
  courseName: string;
  courseUserRole?: Exclude<Role, 'ADMIN'>;
  semester?: Semester;
}

function CourseNavBarComponent({
  offeringIdParam,
  courseName,
  courseUserRole,
  semester,
}: CourseNavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { viewAsStudent, effectiveRole, toggleViewAsStudent } =
    useCourseShell();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const offeringId = Number.isInteger(Number(offeringIdParam))
    ? parseInt(offeringIdParam, 10)
    : NaN;

  const userTeams = useAppSelector(
    (s) =>
      !Number.isNaN(offeringId) ? s.teams.myByOffering[offeringId] ?? [] : [],
  );
  const teamsLoading = useAppSelector(
    (s) =>
      !Number.isNaN(offeringId)
        ? s.teams.myLoadingByOffering[offeringId] ?? false
        : false,
  );

  const openTabs = useAppSelector(
    !Number.isNaN(offeringId)
      ? selectDashboardTabsForOffering(offeringId)
      : () => [],
  );

  useEffect(() => {
    if (!Number.isNaN(offeringId) && user) {
      void dispatch(fetchMyTeamsByOffering(offeringId));
    }
  }, [dispatch, offeringId, user]);

  const removeTab = (tid: number) => {
    if (!Number.isNaN(offeringId)) {
      dispatch(removeDashboardTab({ offeringId, teamId: tid }));
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleDashboardClick = (teamId: number) => {
    navigate(`/courses/${offeringIdParam}/dashboard/${teamId}`);
  };

  const isOnDashboardRoute = location.pathname.startsWith(
    `/courses/${offeringIdParam}/dashboard`,
  );

  const isAdmin = user?.role === 'ADMIN';

  const currentTeamIdMatch = location.pathname.match(
    `/courses/${offeringIdParam}/dashboard/(\\d+)`,
  );
  const currentTeamId = currentTeamIdMatch ? parseInt(currentTeamIdMatch[1], 10) : null;

  useEffect(() => {
    if (
      isAdmin &&
      !viewAsStudent &&
      currentTeamId &&
      isOnDashboardRoute &&
      !openTabs.some((t) => t.teamId === currentTeamId) &&
      userTeams.every((t) => t.id !== currentTeamId)
    ) {
      navigate(`/courses/${offeringIdParam}`, { replace: true });
    }
  }, [
    isAdmin,
    viewAsStudent,
    currentTeamId,
    isOnDashboardRoute,
    openTabs,
    userTeams,
    navigate,
    offeringIdParam,
  ]);

  const handleCloseTab = (e: React.MouseEvent, teamId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isCurrentlyOnTab =
      location.pathname ===
      `/courses/${offeringIdParam}/dashboard/${teamId}`;
    removeTab(teamId);

    if (isCurrentlyOnTab) {
      navigate(`/courses/${offeringIdParam}`, { replace: true });
    }
  };

  const getNavigationTabs = () => {
    const normalizedRole =
      viewAsStudent && isAdmin
        ? 'STUDENT'
        : courseUserRole || effectiveRole || user?.role;

    if (!normalizedRole) return [];

    const tabs = [{ path: `/courses/${offeringIdParam}`, label: 'Projects' }];

    const nr =
      normalizedRole !== undefined ? (normalizedRole as Role | string) : undefined;

    if (isAdmin && !viewAsStudent) {
      tabs.push({ path: `/courses/${offeringIdParam}/settings`, label: 'Settings' });
      tabs.push({ path: `/courses/${offeringIdParam}/spark`, label: 'Spark' });
    } else if (nr) {
      if (canAccessCourseSettingsRoute(nr)) {
        tabs.push({ path: `/courses/${offeringIdParam}/settings`, label: 'Settings' });
      }
      if (canAccessSparkOfferingRoute(nr)) {
        tabs.push({ path: `/courses/${offeringIdParam}/spark`, label: 'Spark' });
      }
    }

    return tabs;
  };

  const navigationTabs = getNavigationTabs();

  const displayRole = (() => {
    if (isAdmin) {
      return viewAsStudent ? 'STUDENT (PREVIEW)' : 'ADMIN';
    }
    return courseUserRole || effectiveRole || user?.role || 'STUDENT';
  })();

  if (navigationTabs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {courseName}
              </h2>
              {semester && (
                <Badge
                  variant="outline"
                  className="text-sm font-medium px-3 py-1"
                >
                  {formatSemesterShortName(semester)}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary">{displayRole}</Badge>
              {isAdmin && (
                <Button
                  variant={viewAsStudent ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleViewAsStudent}
                  className={
                    viewAsStudent
                      ? 'bg-red-700 hover:bg-red-800 text-white'
                      : ''
                  }
                >
                  {viewAsStudent ? (
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Switch to Admin View
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Switch to Student View
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          <nav className="flex space-x-8 items-center">
            {navigationTabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'relative px-1 py-2 text-sm font-medium transition-colors hover:text-foreground',
                  isActive(tab.path)
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {tab.label}
                {isActive(tab.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            ))}

            {!teamsLoading && userTeams.length > 0 && (
              <>
                {userTeams.length === 1 ? (
                  <Link
                    to={`/courses/${offeringIdParam}/dashboard/${userTeams[0].id}`}
                    className={cn(
                      'relative px-1 py-2 text-sm font-medium transition-colors hover:text-foreground',
                      isOnDashboardRoute
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Dashboard
                    {isOnDashboardRoute && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </Link>
                ) : (
                  <DropdownMenu
                    open={isDashboardOpen}
                    onOpenChange={setIsDashboardOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'relative px-1 py-2 text-sm font-medium transition-colors hover:text-foreground',
                          isOnDashboardRoute
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        Dashboard
                        {isOnDashboardRoute && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-[200px]"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      {userTeams.map((team) => {
                        const teamDashboardPath = `/courses/${offeringIdParam}/dashboard/${team.id}`;
                        const isTeamActive = location.pathname === teamDashboardPath;
                        return (
                          <DropdownMenuItem
                            key={team.id}
                            onClick={(e) => {
                              e.preventDefault();
                              handleDashboardClick(team.id);
                              setIsDashboardOpen(false);
                            }}
                            className={cn(
                              'flex items-center gap-2 cursor-pointer',
                              isTeamActive && 'bg-accent'
                            )}
                          >
                            {team.name}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}

            {isAdmin && !viewAsStudent && openTabs.length > 0 && (
              <>
                {openTabs.map((tab) => {
                  const tabPath = `/courses/${offeringIdParam}/dashboard/${tab.teamId}`;
                  const isTabActive = location.pathname === tabPath;
                  
                  return (
                    <Link
                      key={tab.teamId}
                      to={tabPath}
                      className={cn(
                        'relative px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5 max-w-[180px] min-w-0 rounded-md bg-gray-100 hover:bg-gray-200',
                        isTabActive ? 'text-foreground bg-gray-200' : 'text-muted-foreground'
                      )}
                    >
                      <span className="truncate flex-1 min-w-0">
                        {tab.teamName}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCloseTab(e, tab.teamId);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="p-1.5 hover:bg-gray-300 rounded transition-colors flex-shrink-0 -mr-1"
                        aria-label="Close tab"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {isTabActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

export const CourseNavBar = React.memo(CourseNavBarComponent);
