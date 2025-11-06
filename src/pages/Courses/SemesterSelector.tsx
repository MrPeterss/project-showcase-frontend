import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatSemesterShortName } from '@/lib/semesterUtils';
import type { Semester } from '@/services';

interface SemesterSelectorProps {
  selectedSemesterId: string;
  semesters: Semester[] | null;
  isAdmin: boolean;
  onSemesterChange: (semesterId: string) => void;
  onAddSemester: () => void;
  onEditSemester: (semester: Semester) => void;
}

export function SemesterSelector({
  selectedSemesterId,
  semesters,
  isAdmin,
  onSemesterChange,
  onAddSemester,
  onEditSemester,
}: SemesterSelectorProps) {
  const handleEditClick = () => {
    if (selectedSemesterId && semesters) {
      const semester = semesters.find(
        (s) => s.id.toString() === selectedSemesterId
      );
      if (semester) {
        onEditSemester(semester);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <CustomSelect
        value={selectedSemesterId || ''}
        onChange={onSemesterChange}
        options={[
          { value: '', label: 'All Semesters' },
          ...(semesters?.map((semester) => ({
            value: semester.id.toString(),
            label: `${formatSemesterShortName(semester)} (${new Date(
              semester.startDate
            ).toLocaleDateString()} - ${new Date(
              semester.endDate
            ).toLocaleDateString()})`,
          })) || []),
        ]}
        placeholder="Select a semester"
        showAddButton={isAdmin}
        onAddClick={onAddSemester}
        addButtonText="Add New Semester"
        className="w-80"
      />

      {/* Edit Semester Button - Only show when a semester is selected and user is admin */}
      {selectedSemesterId && isAdmin && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleEditClick}
          className="h-10 border-red-700 text-red-700 hover:bg-red-700 hover:text-white"
        >
          Edit Semester
        </Button>
      )}
    </div>
  );
}

