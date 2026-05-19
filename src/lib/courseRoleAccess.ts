import type { Role } from '@/services/types';

/**
 * Course offering admins: site {@link Role} `ADMIN` or enrollment `INSTRUCTOR`.
 * Use for enrollment CRUD, PUT offering settings, lock/unlock server, Spark, milestone tags, team create/update/delete, team member roster edits.
 * TAs are excluded (see {@link isCourseTeachingStaff}).
 */
export function isCourseOfferingAdmin(
  effectiveRole: Role | string | undefined,
): boolean {
  return effectiveRole === 'ADMIN' || effectiveRole === 'INSTRUCTOR';
}

/**
 * Teaching staff in the course: admins, instructors, and TAs.
 * Use for deploy/stop when the offering is server-locked, and production env visibility (same bypass rules as instructors).
 */
export function isCourseTeachingStaff(
  effectiveRole: Role | string | undefined,
): boolean {
  return (
    effectiveRole === 'ADMIN' ||
    effectiveRole === 'INSTRUCTOR' ||
    effectiveRole === 'TA'
  );
}

export function isCourseTa(
  effectiveRole: Role | string | undefined,
): boolean {
  return effectiveRole === 'TA';
}

/** Navigate to any team's dashboard (deploy): instructors/admins, or TAs for any team. */
export function canAccessAnyTeamDeployDashboard(
  effectiveRole: Role | string | undefined,
): boolean {
  return isCourseOfferingAdmin(effectiveRole) || isCourseTa(effectiveRole);
}

/** Course offering settings UI: site admins and instructors only (not TAs). */
export function canAccessCourseSettingsRoute(
  effectiveRole: Role | string | undefined,
): boolean {
  return isCourseOfferingAdmin(effectiveRole);
}

export function canAccessSparkOfferingRoute(
  effectiveRole: Role | string | undefined,
): boolean {
  return isCourseOfferingAdmin(effectiveRole);
}

/**
 * Opens with "As …," for lock-bypass confirmations (deploy/stop while server locked).
 * Reflects {@link Role} effective in the course.
 */
export function formatAsTeachingRoleLeadingClause(
  effectiveRole: Role | string | undefined,
): string {
  switch (effectiveRole) {
    case 'ADMIN':
      return 'As a site administrator';
    case 'INSTRUCTOR':
      return 'As an instructor';
    case 'TA':
      return 'As a teaching assistant';
    default:
      return 'As teaching staff';
  }
}

/**
 * Phrase without leading "As" for "... deploy as …" sentences.
 */
export function phraseDeployAsBypassRole(
  effectiveRole: Role | string | undefined,
): string {
  switch (effectiveRole) {
    case 'ADMIN':
      return 'a site administrator';
    case 'INSTRUCTOR':
      return 'an instructor';
    case 'TA':
      return 'a teaching assistant';
    default:
      return 'teaching staff';
  }
}
