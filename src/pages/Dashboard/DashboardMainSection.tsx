import { useState } from 'react';
import { Button } from '@/components/ui/button';
import CollapsibleCard from '@/components/CollapsibleCard';
import { Card } from '@/components/ui/card';
import { ChevronDown, Clock, Github, Terminal, Wrench } from 'lucide-react';
import type { Team } from '@/services/types';
import {
  activityLogs,
  containerLogs,
  displayGithubPath,
  formatDateLabel,
  formatTime,
  formatTimestamp,
  getStatusBadge,
} from './shared';

interface DashboardMainSectionProps {
  team: Team;
}

export default function DashboardMainSection({
  team,
}: DashboardMainSectionProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => setIsDeploying(false), 3000);
  };
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getStatusBadge('ready')}
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          </div>
          <div className="space-y-2">
            {team.projects &&
              team.projects.length > 0 &&
              team.projects[0]?.gitHubLink && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Github className="h-4 w-4" />
                  <a
                    href={team.projects[0].gitHubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {displayGithubPath(team.projects[0].gitHubLink)}
                  </a>
                </div>
              )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="add a GitHub url here..."
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isDeploying ? 'Deploying...' : 'Deploy'}
              </Button>
            </div>
          </div>
        </div>

        {/* Build Logs (collapsible) */}
        <CollapsibleCard
          title="Build Logs"
          icon={<Wrench className="h-5 w-5" />}
          defaultOpen={false}
          maxBodyHeightClass="max-h-80"
        >
          <div className="font-mono text-sm text-gray-600">
            No recent builds.
          </div>
        </CollapsibleCard>

        {/* Container Logs (collapsible) */}
        <CollapsibleCard
          title="Container Logs"
          icon={<Terminal className="h-5 w-5" />}
          defaultOpen={false}
          maxBodyHeightClass="max-h-80"
        >
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm">
            {containerLogs.slice(-6).map((log) => (
              <div key={log.id} className="mb-1">
                <span className="text-gray-500">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span
                  className={`ml-2 ${
                    log.level === 'ERROR'
                      ? 'text-red-400'
                      : log.level === 'WARN'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {log.level}:
                </span>
                <span className="ml-1">{log.message}</span>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        {/* Deployment History (collapsible) */}
        <Card>
          <div className="px-6 pt-6">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="flex items-center gap-2 w-full text-left"
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  isHistoryOpen ? 'rotate-180' : ''
                }`}
              />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Deployment History</span>
              </div>
            </button>
          </div>
          {isHistoryOpen && (
            <div className="px-6 pb-6 pt-4 max-h-80 overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(
                  activityLogs.reduce<Record<string, any[]>>(
                    (groups, entry) => {
                      const dateLabel = formatDateLabel(entry.timestamp);
                      (groups[dateLabel] ||= []).push(entry);
                      return groups;
                    },
                    {}
                  )
                ).map(([dateLabel, entries]) => (
                  <div key={dateLabel} className="space-y-2">
                    <div className="text-sm font-bold text-gray-700 uppercase tracking-wide text-left">
                      {dateLabel}
                    </div>
                    <div className="divide-y divide-gray-200">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start justify-between py-3"
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm text-gray-900 text-left">
                              <span className="font-medium">{entry.user}</span>{' '}
                              {entry.action}{' '}
                              <span className="text-gray-700">the server</span>
                            </span>
                            <a
                              href={entry.repo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate max-w-[320px] text-left"
                            >
                              {displayGithubPath(entry.repo)}
                            </a>
                          </div>
                          <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
