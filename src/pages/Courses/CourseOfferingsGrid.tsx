import { CourseCell } from './CourseCell';
import type { CourseOffering } from '@/services';

interface CourseOfferingsGridProps {
  offerings: CourseOffering[];
  isAdmin: boolean;
  onEdit: (offering: CourseOffering) => void;
  onDelete: (offeringId: number) => void;
  isDeleting: boolean;
}

export function CourseOfferingsGrid({
  offerings,
  isAdmin,
  onEdit,
  onDelete,
  isDeleting,
}: CourseOfferingsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {offerings.map((offering) => (
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
  );
}

