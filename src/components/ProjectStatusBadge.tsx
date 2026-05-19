import { getStatusBadge } from '@/pages/Dashboard/shared';

/** Shared project deployment status badge (see `getStatusBadge` in Dashboard shared). */
export function ProjectStatusBadge(props: { status: string }) {
  return getStatusBadge(props.status);
}
