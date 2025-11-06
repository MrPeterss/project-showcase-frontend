import { Badge } from '@/components/ui/badge';
import { CourseCell } from './CourseCell';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import type { CourseOffering, Semester } from '@/services';

interface CourseOfferingsBySemesterProps {
  offerings: CourseOffering[];
  semesters: Semester[];
  isAdmin: boolean;
  onEdit: (offering: CourseOffering) => void;
  onDelete: (offeringId: number) => void;
  isDeleting: boolean;
}

export function CourseOfferingsBySemester({
  offerings,
  semesters,
  isAdmin,
  onEdit,
  onDelete,
  isDeleting,
}: CourseOfferingsBySemesterProps) {
  // Group courses by semester
  const offeringsBySemester = offerings.reduce(
    (acc, offering) => {
      const semesterId = offering.semesterId;
      if (!acc[semesterId]) {
        acc[semesterId] = [];
      }
      acc[semesterId].push(offering);
      return acc;
    },
    {} as Record<number, CourseOffering[]>
  );

  // Sort semesters by start date (newest first)
  const sortedSemesters = semesters
    .filter((semester) => offeringsBySemester[semester.id])
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() -
        new Date(a.startDate).getTime()
    );

  return (
    <div className="space-y-8">
      {sortedSemesters.map((semester) => (
        <div
          key={semester.id}
          className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm"
        >
          {/* Semester Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-red-600 to-red-700 rounded-full"></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatSemesterShortName(semester)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(semester.startDate).toLocaleDateString()} -{' '}
                  {new Date(semester.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-sm font-semibold border-red-200 text-red-700 bg-red-50"
            >
              {offeringsBySemester[semester.id].length} course
              {offeringsBySemester[semester.id].length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Courses for this semester - display as grid of cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {offeringsBySemester[semester.id].map((offering) => (
              <CourseCell
                key={offering.id}
                offering={offering}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

