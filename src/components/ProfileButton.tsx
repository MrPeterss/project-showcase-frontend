import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ProfileButton() {
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  if (!user) {
    return null;
  }

  return (
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
              <div className='flex flex-col items-end'>
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
  );
}
