import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import type { Semester } from '@/services';

interface CoursesHeaderProps {
  selectedSemesterId: string | null;
  semesters: Semester[] | null;
  userRole?: string;
  isAdmin: boolean;
  onAddCourse: () => void;
}

export function CoursesHeader({
  selectedSemesterId,
  semesters,
  userRole,
  isAdmin,
  onAddCourse,
}: CoursesHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">
          Course Offerings
          {selectedSemesterId && semesters && (
            <span className="text-xl font-normal text-muted-foreground ml-3">
              - {formatSemesterShortName(
                semesters.find(
                  (s) => s.id.toString() === selectedSemesterId
                ) || null
              )}
            </span>
          )}
        </h1>
        <Badge variant="secondary">
          {userRole || 'Loading...'}
          {isAdmin && ' (Admin)'}
        </Badge>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={onAddCourse}
            className="bg-red-700 hover:bg-red-800 text-white"
          >
            Add Course
          </Button>
        </div>
      )}
    </div>
  );
}

