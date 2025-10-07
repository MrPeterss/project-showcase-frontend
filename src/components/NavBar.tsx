import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';

export function NavBar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const nameParts = user.email.split('@')[0].split('.');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (!user?.email) return 'User';
    const nameParts = user.email.split('@')[0].split('.');
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[1]}`.replace(/\b\w/g, (l) =>
        l.toUpperCase()
      );
    }
    return user.email.split('@')[0];
  };

  // Determine which tabs to show based on user role
  const getNavigationTabs = () => {
    if (!user?.role) return [];

    const tabs = [];

    if (user.role === 'STUDENT') {
      tabs.push(
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/projects', label: 'Projects' }
      );
    } else if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') {
      tabs.push(
        { path: '/projects', label: 'Projects' },
        { path: '/courses', label: 'Courses' }
      );
    }

    return tabs;
  };

  const navigationTabs = getNavigationTabs();

  return (
    <header className="sticky top-0 z-10 bg-background/70 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex h-14 items-center justify-between">
          {/* Navigation Tabs */}
          <div className="flex space-x-8">
            {navigationTabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'relative px-1 py-4 text-sm font-medium transition-colors hover:text-foreground',
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
          </div>

          {/* Profile Dropdown */}
          {user && (
            <div className="relative" ref={profileRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 h-10 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={getDisplayName()} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium">
                  {getDisplayName()}
                </span>
              </Button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={getDisplayName()} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-blue-600 font-medium">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
