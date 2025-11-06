import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Edit } from 'lucide-react';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { CourseOffering } from '@/services';

interface CourseCellProps {
  offering: CourseOffering;
  isAdmin: boolean;
  onEdit: (offering: CourseOffering) => void;
  onDelete: (offeringId: number) => void;
  isDeleting: boolean;
}

export function CourseCell({
  offering,
  isAdmin,
  onEdit,
  onDelete,
  isDeleting,
}: CourseCellProps) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (showDropdown && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4, // Fixed positioning is relative to viewport
            left: rect.right - 144, // 144px is width of dropdown (w-36)
          });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleCourseClick = () => {
    navigate(`/courses/${offering.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(offering);
    setShowDropdown(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(offering.id);
    setShowDropdown(false);
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
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-bold text-lg leading-tight">
                {offering.course?.department} {offering.course?.number}
              </h4>
              {isAdmin && (
                <div className="relative ml-2">
                  <Button
                    ref={triggerRef}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 hover:text-white rounded-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(!showDropdown);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  {showDropdown &&
                    createPortal(
                      <div
                        ref={dropdownRef}
                        className="fixed z-[100] w-36 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                        style={{
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                        }}
                      >
                        <div className="py-1">
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            onClick={handleEditClick}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit Offering
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <p className="text-gray-700 text-sm font-medium line-clamp-3 mb-4 flex-1 leading-relaxed">
            {offering.course?.name}
          </p>

          {/* Footer with role badge and semester badge */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            {offering.userRole && (
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

