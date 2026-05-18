import { useMemo } from 'react';
import { Users, Globe } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Team, TeamMember } from '@/services/types';

interface DashboardSideBarSectionProps {
  team: Team;
  /** When set, separates TA enrollments on the roster from other members (course dashboard only). */
  enrollmentRoleByUserId?: ReadonlyMap<number, string>;
}

function memberDisplay(member: TeamMember) {
  const user = member.user;
  const displayName =
    (user as { name?: string })?.name || user?.email || `User ${member.userId}`;
  const nameForInitials = (user as { name?: string })?.name;
  const initials = nameForInitials
    ? nameForInitials
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email
          .split('@')[0]
          .split('.')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';
  return { displayName, initials, email: user?.email, showEmail: !!(user as { name?: string })?.name };
}

function MemberRow({ member }: { member: TeamMember }) {
  const { displayName, initials, email, showEmail } = memberDisplay(member);
  return (
    <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">
          {displayName}
        </p>
        {showEmail && email && (
          <p className="text-xs text-gray-500 truncate">{email}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardSideBarSection({
  team,
  enrollmentRoleByUserId,
}: DashboardSideBarSectionProps) {
  const members = team.members ?? [];

  const { regularMembers, assignedCourseStaffMembers } = useMemo(() => {
    if (!enrollmentRoleByUserId || members.length === 0) {
      return {
        regularMembers: members,
        assignedCourseStaffMembers: [] as TeamMember[],
      };
    }
    const staff: TeamMember[] = [];
    const rest: TeamMember[] = [];
    for (const m of members) {
      const role = enrollmentRoleByUserId.get(m.userId);
      if (role === 'TA') staff.push(m);
      else rest.push(m);
    }
    return { regularMembers: rest, assignedCourseStaffMembers: staff };
  }, [members, enrollmentRoleByUserId]);

  const total = members.length;
  const canSplitStaff =
    Boolean(enrollmentRoleByUserId) && assignedCourseStaffMembers.length > 0;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 text-left">
      <div className="space-y-6">
        {/* Team Info */}
        <div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2 flex-wrap justify-start">
              <Users className="h-4 w-4 shrink-0" />
              {canSplitStaff ? (
                <span className="text-left">
                  {regularMembers.length} member
                  {regularMembers.length !== 1 ? 's' : ''}
                  <span className="text-gray-400 mx-1">·</span>
                  {assignedCourseStaffMembers.length} Course Staff
                </span>
              ) : (
                <span>
                  {total} member{total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {team.port && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <a
                  href={`https://4300showcase.infosci.cornell.edu:${team.port}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {team.port}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Team roster: members vs assigned course staff (TAs only) */}
        <div className="space-y-6 text-left">
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 mb-1 text-left">
              Members
            </h3>
            <div className="space-y-3">
              {regularMembers.length > 0 ? (
                regularMembers.map((member) => (
                  <MemberRow key={member.userId} member={member} />
                ))
              ) : (
                <p className="text-sm text-gray-500">No members in this section</p>
              )}
            </div>
          </div>

          {assignedCourseStaffMembers.length > 0 && (
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900 mb-1 text-left">
                Assigned Course Staff
              </h3>
              <div className="space-y-3">
                {assignedCourseStaffMembers.map((member) => (
                  <MemberRow key={member.userId} member={member} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
