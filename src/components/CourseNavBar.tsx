import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import { services } from '@/services';
import type { Semester, Team } from '@/services/types';

interface CourseNavBarProps {
  courseId: string;
  courseName: string;
  courseUserRole?: 'INSTRUCTOR' | 'STUDENT' | 'VIEWER';
  semester?: Semester;
}

function CourseNavBarComponent({ courseId, courseName, courseUserRole, semester }: CourseNavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  // Fetch teams for the course offering and filter by current user
  useEffect(() => {
    if (!courseId || !user) {
      setTeamsLoading(false);
      return;
    }

    const fetchUserTeams = async () => {
      try {
        setTeamsLoading(true);
        const offeringId = parseInt(courseId, 10);
        if (isNaN(offeringId)) {
          setTeamsLoading(false);
          return;
        }

        const teamsResponse = await services.teams.getMyTeams(offeringId);
        setUserTeams(teamsResponse.data);
      } catch (error) {
        console.error('Error fetching user teams:', error);
        setUserTeams([]);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchUserTeams();
  }, [courseId, user]);

  // Determine which tabs to show based on course-specific user role
  // Fall back to global user role if courseUserRole is not provided
  const getNavigationTabs = () => {
    // Use course-specific role if available, otherwise fall back to global role
    const role = courseUserRole || user?.role;
    
    if (!role) return [];

    const tabs = [
      { path: `/courses/${courseId}`, label: 'Projects' }
    ];

    // Admins (global role) always see Settings tab
    if (user?.role === 'ADMIN') {
      tabs.push(
        { path: `/courses/${courseId}/settings`, label: 'Settings' }
      );
    } 
    // Instructors see Settings tab
    else if (role === 'INSTRUCTOR') {
      tabs.push(
        { path: `/courses/${courseId}/settings`, label: 'Settings' }
      );
    }
    // Students see Dashboard tab
    else if (role === 'STUDENT') {
      tabs.push(
        { path: `/courses/${courseId}/dashboard`, label: 'Dashboard' }
      );
    }
    // VIEWER role only sees Projects tab (no additional tabs)

    return tabs;
  };

  const navigationTabs = getNavigationTabs();
  
  // Use course-specific role for display, fall back to global role
  const displayRole = courseUserRole || user?.role || 'STUDENT';

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
            <h2 className="text-xl font-semibold text-gray-900">{courseName}</h2>
              {semester && (
                <Badge
                  variant="outline"
                  className="text-sm font-medium px-3 py-1"
                >
                  {formatSemesterShortName(semester)}
                </Badge>
              )}
            </div>
            <Badge variant="secondary">{displayRole}</Badge>
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
            
            {/* Team Tabs */}
            {!teamsLoading && userTeams.length > 0 && (
              <>
                {userTeams.map((team) => (
                  <div
                    key={team.id}
                    className="relative px-1 py-2 text-sm font-medium flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">{team.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigate(`/dashboard/${team.id}`);
                      }}
                      title={`Go to ${team.name} dashboard`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

export const CourseNavBar = React.memo(CourseNavBarComponent);
