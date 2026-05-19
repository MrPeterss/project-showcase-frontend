import type { Role } from '@/services/types';

/** Default post-login landing route by global role. */
export function getRouteForRole(role: Role): string {
  if (role === 'ADMIN') return '/admin';
  return '/courses';
}

/**
 * Parses a route param as a numeric course offering id, or undefined if invalid/missing.
 */
export function parseOfferingIdParam(
  param: string | undefined,
): number | undefined {
  if (param === undefined || param === '') return undefined;
  const n = parseInt(param, 10);
  return Number.isFinite(n) ? n : undefined;
}
