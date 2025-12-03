import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { CourseOffering } from '@/services';

interface CourseCellProps {
  offering: CourseOffering;
  isAdmin: boolean;
}

export function CourseCell({ offering, isAdmin }: CourseCellProps) {
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
    <div
      className="bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200 p-6 flex flex-col gap-3"
      onClick={handleCourseClick}
    >
      {/* Course Code */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-lg text-gray-900">
          {offering.course?.department} {offering.course?.number}
        </h4>
        {offering.userRole && !isAdmin && (
          <Badge
            variant="outline"
            className={`text-xs font-medium ${getRoleBadgeClassName()}`}
          >
            {getRoleLabel()}
          </Badge>
        )}
      </div>

      {/* Course Name */}
      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
        {offering.course?.name}
      </p>
    </div>
  );
}
