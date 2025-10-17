import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface CourseNavBarProps {
  courseId: string;
  courseName: string;
}

export function CourseNavBar({ courseId, courseName }: CourseNavBarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Determine which tabs to show based on user role
  const getNavigationTabs = () => {
    if (!user?.role) return [];

    const tabs = [
      { path: `/courses/${courseId}`, label: 'Details' }
    ];

    if (user.role === 'STUDENT') {
      tabs.push(
        { path: `/courses/${courseId}/projects`, label: 'Projects' },
        { path: `/courses/${courseId}/dashboard`, label: 'Dashboard' }
      );
    } else if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') {
      tabs.push(
        { path: `/courses/${courseId}/projects`, label: 'Projects' },
        { path: `/courses/${courseId}/settings`, label: 'Settings' }
      );
    }

    return tabs;
  };

  const navigationTabs = getNavigationTabs();

  if (navigationTabs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="py-4">
          {/* Course Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{courseName}</h2>
            <Badge variant="secondary">{user?.role || 'STUDENT'}</Badge>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-8">
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
          </nav>
        </div>
      </div>
    </div>
  );
}
