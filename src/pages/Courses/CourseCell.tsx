import { Badge } from '@/components/ui/badge';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import { useNavigate } from 'react-router-dom';
import type { CourseOffering } from '@/services';

interface CourseCellProps {
  offering: CourseOffering;
  isAdmin: boolean;
}

export function CourseCell({
  offering,
  isAdmin,
}: CourseCellProps) {
  const navigate = useNavigate();

  const handleCourseClick = () => {
    navigate(`/courses/${offering.id}`);
  };

  // Get badge styling based on user role
  const getRoleBadgeClassName = () => {
    switch (offering.userRole) {
      case 'INSTRUCTOR':
        return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 border-transparent';
      case 'STUDENT':
        return 'bg-green-600 text-white border-green-600 hover:bg-green-700 border-transparent';
      case 'VIEWER':
        return 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600 border-transparent';
      default:
        return '';
    }
  };

  const getRoleLabel = () => {
    switch (offering.userRole) {
      case 'INSTRUCTOR':
        return 'Instructor';
      case 'STUDENT':
        return 'Student';
      case 'VIEWER':
        return 'Viewer';
      default:
        return null;
    }
  };

  return (
    <div className="relative group">
      <div
        className="bg-white border border-gray-200 rounded-xl cursor-pointer hover:shadow-xl hover:border-red-300 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col overflow-hidden"
        onClick={handleCourseClick}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-800/20 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <h4 className="font-bold text-lg leading-tight">
              {offering.course?.department} {offering.course?.number}
            </h4>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <p className="text-gray-700 text-sm font-medium line-clamp-3 mb-4 flex-1 leading-relaxed">
            {offering.course?.name}
          </p>

          {/* Footer with role badge and semester badge */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            {offering.userRole && !isAdmin && (
              <Badge
                variant="outline"
                className={`text-xs font-medium ${getRoleBadgeClassName()}`}
              >
                {getRoleLabel()}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-xs font-medium border-gray-200 text-gray-600 bg-gray-50"
            >
              {offering.semester
                ? formatSemesterShortName(offering.semester)
                : `Semester ID: ${offering.semesterId}`}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

