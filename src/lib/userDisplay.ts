/** Prefer name, then email, for roster-style display. */
export function userDisplayLabel(
  user:
    | ({ email?: string | null } & { name?: string | null })
    | null
    | undefined,
): string {
  if (!user) return '';
  const name = user.name?.trim();
  if (name) return name;
  return user.email?.trim() ?? '';
}
