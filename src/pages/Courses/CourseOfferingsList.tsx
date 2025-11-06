import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import { CourseOfferingsGrid } from './CourseOfferingsGrid';
import { CourseOfferingsBySemester } from './CourseOfferingsBySemester';
import type { CourseOffering, Semester } from '@/services';

interface CourseOfferingsListProps {
  offerings: CourseOffering[];
  semesters: Semester[] | null;
  selectedSemesterId: string | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  onEdit: (offering: CourseOffering) => void;
  onDelete: (offeringId: number) => void;
  isDeleting: boolean;
  onAddCourse: () => void;
}

export function CourseOfferingsList({
  offerings,
  semesters,
  selectedSemesterId,
  isLoading,
  error,
  isAdmin,
  onEdit,
  onDelete,
  isDeleting,
  onAddCourse,
}: CourseOfferingsListProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="px-0">
          <p className="text-muted-foreground">Loading course offerings...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="px-0">
          <p className="text-red-500">Error loading course offerings: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!offerings || offerings.length === 0) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-left">
            {selectedSemesterId && semesters
              ? `${formatSemesterShortName(
                  semesters.find(
                    (s) => s.id.toString() === selectedSemesterId
                  ) || null
                )} Courses`
              : 'All Course Offerings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {selectedSemesterId
                ? `No course offerings found for the selected semester.`
                : 'No course offerings found.'}
            </p>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddCourse}
              >
                Add Course
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-left">
          {selectedSemesterId && semesters
            ? `${formatSemesterShortName(
                semesters.find(
                  (s) => s.id.toString() === selectedSemesterId
                ) || null
              )} Courses`
            : 'All Course Offerings'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {selectedSemesterId ? (
          <CourseOfferingsGrid
            offerings={offerings}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ) : semesters ? (
          <CourseOfferingsBySemester
            offerings={offerings}
            semesters={semesters}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

