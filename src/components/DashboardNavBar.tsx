import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import { useCourseOffering } from '@/hooks/useCourseOfferings';
import type { Team } from '@/services/types';

interface DashboardNavBarProps {
  team: Team;
}

function DashboardNavBarComponent({ team }: DashboardNavBarProps) {
  const courseOfferingId = team.courseOfferingId;

  const { data: offering, isLoading: offeringLoading } = useCourseOffering(
    courseOfferingId
  );

  const courseName = offering?.course
    ? `${offering.course.department} ${offering.course.number} - ${offering.course.name}`
    : 'Course';

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="py-4">
          {/* Course Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!offeringLoading && offering && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {courseName}
                  </h2>
                  {offering.semester && (
                    <Badge
                      variant="outline"
                      className="text-sm font-medium px-3 py-1"
                    >
                      {formatSemesterShortName(offering.semester)}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const DashboardNavBar = React.memo(DashboardNavBarComponent);

