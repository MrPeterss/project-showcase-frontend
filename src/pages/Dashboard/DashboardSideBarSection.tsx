import { Users, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { deploymentData, teamMembers } from './shared';

export default function DashboardSideBarSection() {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <div className="space-y-6">
        {/* Team Info */}
        <div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{teamMembers.length} members</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <a
                href={`https://4300showcase.infosci.cornell.edu:${deploymentData.portNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {deploymentData.portNumber}
              </a>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Team Members
          </h3>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {member.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
