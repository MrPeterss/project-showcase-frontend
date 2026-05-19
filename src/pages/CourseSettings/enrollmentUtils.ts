import type { Enrollment, Team } from '@/services/types';

export function memberEmailsFromTeam(team: Team): string[] {
  const emails: string[] = [];
  const seen = new Set<string>();
  for (const m of team.members ?? []) {
    const raw = m.user?.email?.trim();
    if (!raw) continue;
    const k = raw.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    emails.push(raw);
  }
  return emails;
}

export function teamIdsContainingUser(
  teamsList: Team[],
  userId: number,
): Set<number> {
  const s = new Set<number>();
  for (const team of teamsList) {
    if (team.members?.some((m) => m.userId === userId)) {
      s.add(team.id);
    }
  }
  return s;
}

/** Sort roster by display name then email */
export function compareEnrollmentsByName(a: Enrollment, b: Enrollment) {
  const na =
    ((a.user as { name?: string })?.name || a.user?.email || '').toLowerCase();
  const nb =
    ((b.user as { name?: string })?.name || b.user?.email || '').toLowerCase();
  const c = na.localeCompare(nb);
  if (c !== 0) return c;
  return a.userId - b.userId;
}
