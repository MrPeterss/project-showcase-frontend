import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProfileButton } from './ProfileButton';

export function GlobalHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show header on login page
  if (location.pathname === '/login') {
    return null;
  }

  // Determine if we should show back button
  const shouldShowBackButton = location.pathname.startsWith('/courses/');

  return (
    <header className="sticky top-0 z-10 bg-background/70 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex h-14 items-center justify-between">
          {/* Left side - Back button (only on course pages) */}
          <div className="flex items-center">
            {shouldShowBackButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/courses')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            )}
          </div>

          {/* Right side - Profile button */}
          <div className="flex items-center">
            <ProfileButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
