import type { Semester } from '@/services/types';

/**
 * Formats a semester as a short name string (e.g., "Fall 2024")
 */
export const formatSemesterShortName = (semester: Semester | null | undefined): string => {
  if (!semester) return 'N/A';
  return `${semester.season} ${semester.year}`;
};

