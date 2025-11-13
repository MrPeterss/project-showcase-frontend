import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import CollapsibleCard from '@/components/CollapsibleCard';
import { Card } from '@/components/ui/card';
import {
  ChevronDown,
  Clock,
  Github,
  Terminal,
  Wrench,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Team } from '@/services/types';
import {
  displayGithubPath,
  formatDateLabel,
  formatTime,
  formatTimestamp,
  getStatusBadge,
} from './shared';
import { useProjectsByTeam, useDeployProject, useContainerLogs } from '@/hooks';
import { parseLogs } from '@/services/projects';
import type { ParsedLogLine } from '@/services/projects';

interface DashboardMainSectionProps {
  team: Team;
}

export default function DashboardMainSection({
  team,
}: DashboardMainSectionProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLogsCardOpen, setIsLogsCardOpen] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useProjectsByTeam(
    team.id
  );
  const deployProject = useDeployProject(team.id);
  const isDeploying = deployProject.isPending;

  // Ensure projectsData is always an array
  // The API returns { projects: [...] } and the first entry is the latest deployment
  const projects = useMemo(() => {
    // Handle various possible response shapes
    let projectsArray: any[] = [];

    if (Array.isArray(projectsData)) {
      projectsArray = projectsData;
    } else if (projectsData && typeof projectsData === 'object') {
      // Check if it's wrapped in a projects property (API response structure)
      if (Array.isArray((projectsData as any).projects)) {
        projectsArray = (projectsData as any).projects;
      } else if (Array.isArray((projectsData as any).data)) {
        projectsArray = (projectsData as any).data;
      }
    }

    // No need to sort - API returns projects with latest first
    return projectsArray;
  }, [projectsData]);

  // Get the latest project (first entry is the latest deployment)
  const latestProject = projects.length > 0 ? projects[0] : null;

  // Prefill deployment URL using the most recent deployment when available
  useEffect(() => {
    if (!githubUrl && latestProject) {
      const url = (latestProject as any).githubUrl || latestProject.gitHubLink;
      if (url) {
        setGithubUrl(url);
      }
    }
  }, [githubUrl, latestProject]);

  // Fetch logs for the latest project only when the logs card is open
  // Request timestamps and last 200 lines
  const { data: containerLogsResponse, isLoading: logsLoading } =
    useContainerLogs(latestProject?.id, isLogsCardOpen && !!latestProject, {
      tail: 200,
      timestamps: true,
    });

  // Parse the logs string into individual log lines
  const containerLogs = useMemo(() => {
    if (!containerLogsResponse?.logs) {
      return [];
    }
    return parseLogs(containerLogsResponse.logs);
  }, [containerLogsResponse]);

  const handleDeploy = async () => {
    if (isDeploying) {
      return;
    }

    if (!githubUrl.trim()) {
      return;
    }

    // Basic GitHub URL validation
    const githubUrlPattern =
      /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(\/)?$/;
    if (!githubUrlPattern.test(githubUrl.trim())) {
      alert(
        'Please enter a valid GitHub URL (e.g., https://github.com/username/repository)'
      );
      return;
    }

    try {
      await deployProject.mutateAsync({ githubUrl: githubUrl.trim() });
      setGithubUrl(''); // Clear input on success
    } catch (error) {
      console.error('Deployment failed:', error);
      // Error will be handled by React Query's error state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isDeploying) {
      handleDeploy();
    }
  };

  // Determine status from latest project (first entry in projects array)
  // Map API status values to badge status values
  const getProjectStatus = () => {
    if (!latestProject) return 'ready';

    // If container is stopped, show ready
    if (latestProject.stoppedAt) return 'ready';

    // Map API status to badge status
    if (latestProject.status) {
      const statusLower = latestProject.status.toLowerCase();

      // Handle various status values from API
      if (statusLower === 'failed' || statusLower === 'error') return 'error';
      if (statusLower === 'building' || statusLower === 'queued')
        return 'building';
      if (
        statusLower === 'running' ||
        statusLower === 'ready' ||
        statusLower === 'success'
      )
        return 'ready';

      // Default to ready for unknown statuses
      return 'ready';
    }

    return 'ready';
  };

  const projectStatus = getProjectStatus();
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getStatusBadge(projectStatus)}
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          </div>
          <div className="space-y-2">
            {(() => {
              const githubUrl = latestProject
                ? (latestProject as any).githubUrl || latestProject.gitHubLink
                : null;
              return githubUrl ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <Github className="h-4 w-4" />
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {displayGithubPath(githubUrl)}
                  </a>
                </div>
              ) : null;
            })()}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="add a GitHub url here..."
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isDeploying}
              />
              <Button
                onClick={handleDeploy}
                disabled={isDeploying || !githubUrl.trim()}
                className="bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                aria-busy={isDeploying}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  'Deploy'
                )}
              </Button>
            </div>
            {deployProject.error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {(deployProject.error as any)?.response?.data?.message ||
                    (deployProject.error as any)?.message ||
                    'Deployment failed. Please try again.'}
                </span>
              </div>
            )}
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
          onToggle={setIsLogsCardOpen}
        >
          {logsLoading ? (
            <div className="font-mono text-sm text-gray-600 p-4">
              Loading logs...
            </div>
          ) : containerLogs.length === 0 ? (
            <div className="font-mono text-sm text-gray-600 p-4">
              {latestProject
                ? 'No logs available yet.'
                : 'Deploy a project to see container logs.'}
            </div>
          ) : (
            <div className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-y-auto max-h-80 text-left">
              {containerLogs.map((log: ParsedLogLine) => (
                <div key={log.id} className="mb-1 text-left">
                  {log.timestamp && (
                    <span className="text-gray-500">
                      [{formatTimestamp(log.timestamp)}]
                    </span>
                  )}
                  {log.level && (
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
                  )}
                  <span
                    className={log.level ? 'ml-1' : log.timestamp ? 'ml-2' : ''}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleCard>

        {/* Deployment History (collapsible) */}
        <Card>
          <div className="px-6">
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
            <div className="px-6 pb-6 pt-2 max-h-80 overflow-y-auto">
              {projectsLoading ? (
                <div className="text-sm text-gray-600">
                  Loading deployment history...
                </div>
              ) : projects.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No deployment history yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    projects.reduce<Record<string, typeof projects>>(
                      (groups, project) => {
                        const dateLabel = formatDateLabel(project.deployedAt);
                        (groups[dateLabel] ||= []).push(project);
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
                        {entries.map((project) => {
                          const githubUrl =
                            (project as any).githubUrl || project.gitHubLink;
                          return (
                            <div
                              key={project.id}
                              className="flex items-start justify-between py-3"
                            >
                              <div className="flex flex-col items-start text-left">
                                <span className="text-sm text-gray-900 text-left">
                                  <span className="font-medium">
                                    {project.deployedBy?.email ||
                                      'Unknown user'}
                                  </span>{' '}
                                  deployed{' '}
                                  <span className="text-gray-700">
                                    the server
                                  </span>
                                </span>
                                {githubUrl && (
                                  <a
                                    href={githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline truncate max-w-[320px] text-left"
                                  >
                                    {displayGithubPath(githubUrl)}
                                  </a>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                                {formatTime(project.deployedAt)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
