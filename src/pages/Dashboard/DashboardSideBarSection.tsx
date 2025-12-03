import { Users, Globe } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Team } from '@/services/types';

interface DashboardSideBarSectionProps {
  team: Team;
}

export default function DashboardSideBarSection({
  team,
}: DashboardSideBarSectionProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <div className="space-y-6">
        {/* Team Info */}
        <div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{team.members?.length || 0} members</span>
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

        {/* Team Members */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Team Members
          </h3>
          <div className="space-y-3">
            {team.members && team.members.length > 0 ? (
              team.members.map((member) => {
                const user = member.user;
                // Use name if available, otherwise use email
                const displayName = (user as any)?.name || user?.email || `User ${member.userId}`;
                // Generate initials from name or email
                const initials = (user as any)?.name
                  ? (user as any).name
                      .split(' ')
                      .map((n: string) => n[0])
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
                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        {displayName}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No members found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
