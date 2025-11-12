import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCourseContext } from '@/components/CourseLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, GraduationCap, Shield } from 'lucide-react';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import { useMyTeamsByOffering } from '@/hooks/useTeams';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Semester, Team } from '@/services/types';

interface CourseNavBarProps {
  courseId: string;
  courseName: string;
  courseUserRole?: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER';
  semester?: Semester;
}

function CourseNavBarComponent({
  courseId,
  courseName,
  courseUserRole,
  semester,
}: CourseNavBarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { viewAsStudent, effectiveRole, toggleViewAsStudent } =
    useCourseContext();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [isDashboardHovered, setIsDashboardHovered] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleDashboardClick = (teamId: number) => {
    window.open(`/dashboard/${teamId}`, '_blank', 'noopener,noreferrer');
  };

  // Fetch teams for the course offering and filter by current user via React Query
  const offeringId = Number.isInteger(Number(courseId))
    ? parseInt(courseId, 10)
    : undefined;
  const { data: myTeams, isLoading: myTeamsLoading } = useMyTeamsByOffering(
    offeringId && user ? offeringId : undefined
  );
  React.useEffect(() => {
    setTeamsLoading(myTeamsLoading);
    setUserTeams(myTeams || []);
  }, [myTeamsLoading, myTeams]);

  const isAdmin = user?.role === 'ADMIN';

  // Determine which tabs to show based on course-specific user role
  // Fall back to global user role if courseUserRole is not provided
  const getNavigationTabs = () => {
    // Use course-specific role if available, otherwise fall back to global role
    const normalizedRole =
      viewAsStudent && isAdmin
        ? 'STUDENT'
        : courseUserRole || effectiveRole || user?.role;

    if (!normalizedRole) return [];

    const tabs = [{ path: `/courses/${courseId}`, label: 'Projects' }];

    // Admins (global role) always see Settings tab when not viewing as student
    if (isAdmin && !viewAsStudent) {
      tabs.push({ path: `/courses/${courseId}/settings`, label: 'Settings' });
    }
    // Instructors see Settings tab
    else if (normalizedRole === 'INSTRUCTOR') {
      tabs.push({ path: `/courses/${courseId}/settings`, label: 'Settings' });
    }
    // VIEWER role only sees Projects tab (no additional tabs)

    return tabs;
  };

  const navigationTabs = getNavigationTabs();

  // Use course-specific role for display, fall back to global role
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
          {/* Course Header */}
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

          {/* Navigation Tabs */}
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

            {/* Dashboard Tab for Teams */}
            {!teamsLoading && userTeams.length > 0 && (
              <>
                {userTeams.length === 1 ? (
                  // Single team: simple clickable tab
                  <button
                    onClick={() => handleDashboardClick(userTeams[0].id)}
                    className={cn(
                      'relative px-1 py-2 text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5',
                      'text-muted-foreground'
                    )}
                  >
                    Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  // Multiple teams: tab with hover dropdown
                  <div
                    onMouseEnter={() => setIsDashboardHovered(true)}
                    onMouseLeave={() => setIsDashboardHovered(false)}
                    className="relative"
                  >
                    <DropdownMenu
                      open={isDashboardHovered}
                      onOpenChange={setIsDashboardHovered}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            'px-1 py-2 text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5',
                            'text-muted-foreground'
                          )}
                        >
                          Dashboard
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="min-w-[200px]"
                      >
                        {userTeams.map((team) => (
                          <DropdownMenuItem
                            key={team.id}
                            onClick={() => handleDashboardClick(team.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {team.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

export const CourseNavBar = React.memo(CourseNavBarComponent);
