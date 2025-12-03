import { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import CollapsibleCard from '@/components/CollapsibleCard';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Clock,
  Github,
  Terminal,
  Wrench,
  AlertCircle,
  Loader2,
  CheckCircle,
  File,
  X,
  Globe,
  ExternalLink,
  StopCircle,
} from 'lucide-react';
import type { Team } from '@/services/types';
import {
  displayGithubPath,
  formatDateLabel,
  formatTime,
  formatTimestamp,
  getStatusBadge,
} from './shared';
import {
  useProjectsByTeam,
  useStreamingDeploy,
  useStreamingContainerLogs,
} from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { projectKeys } from '@/hooks/useProjects';
import { teamKeys } from '@/hooks/useTeams';
import type { ParsedLogLine } from '@/services/projects';
import { useAuth } from '@/hooks/useAuth';
import { services } from '@/services';
import { useCourseContext } from '@/components/CourseLayout';

interface DashboardMainSectionProps {
  team: Team;
}

export default function DashboardMainSection({
  team,
}: DashboardMainSectionProps) {
  const { user } = useAuth();
  // Get effectiveRole from CourseContext if available (respects student view toggle)
  // This will be undefined if not in a course context (e.g., standalone dashboard)
  let effectiveRole: string | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const courseContext = useCourseContext();
    effectiveRole = courseContext?.effectiveRole;
  } catch {
    // Not in course context, use user role
    effectiveRole = user?.role;
  }
  const isAdmin = effectiveRole === 'ADMIN';
  const [githubUrl, setGithubUrl] = useState('');
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLogsCardOpen, setIsLogsCardOpen] = useState(false);
  const [isBuildLogsOpen, setIsBuildLogsOpen] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState<string | null>(
    null
  );
  const [isBuildingOldJson, setIsBuildingOldJson] = useState(false);
  const [isBuildingOldSql, setIsBuildingOldSql] = useState(false);
  const [oldBuildError, setOldBuildError] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buildLogsRef = useRef<HTMLDivElement | null>(null);
  const containerLogsRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();
  const { data: projectsData, isLoading: projectsLoading } = useProjectsByTeam(
    team.id
  );

  // Use streaming deploy hook for build logs
  const streamingDeploy = useStreamingDeploy(team.id, {
    onComplete: (project) => {
      // Invalidate queries when deployment completes
      queryClient.invalidateQueries({
        queryKey: projectKeys.listByTeam(team.id),
      });
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: projectKeys.containers() });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Invalidate teams queries since teams include projects
      if (team.courseOfferingId) {
        queryClient.invalidateQueries({
          queryKey: teamKeys.listByOffering(team.courseOfferingId),
        });
        queryClient.invalidateQueries({
          queryKey: teamKeys.listMyByOffering(team.courseOfferingId),
        });
      }
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });

  const isDeploying = streamingDeploy.isDeploying;
  const streamStarted = streamingDeploy.streamStarted;
  const buildLogs = streamingDeploy.buildLogs;
  const isBuildLogsStreaming = streamingDeploy.isDeploying;
  const buildLogsError = streamingDeploy.error;

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

  // Clear success message when an error occurs
  useEffect(() => {
    if (streamingDeploy.error) {
      setDeploymentSuccess(null);
      // Clear timeout if error occurs
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    }
  }, [streamingDeploy.error]);

  // Show success message when deployment completes
  useEffect(() => {
    if (streamingDeploy.deployedProject && !isDeploying) {
      const project = streamingDeploy.deployedProject;
      const hasFailedStatus =
        project?.status?.toLowerCase() === 'failed' ||
        project?.status?.toLowerCase() === 'error';

      if (!hasFailedStatus) {
        setDeploymentSuccess(
          'Project deployed successfully! The build is in progress.'
        );

        // Auto-dismiss success message after 5 seconds
        successTimeoutRef.current = setTimeout(() => {
          setDeploymentSuccess(null);
          successTimeoutRef.current = null;
        }, 5000);
      }
    }
  }, [streamingDeploy.deployedProject, isDeploying]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Stream container logs when container logs card is open
  const {
    logs: containerLogs,
    isStreaming: isContainerLogsStreaming,
    error: containerLogsError,
  } = useStreamingContainerLogs(
    latestProject?.id,
    isLogsCardOpen && !!latestProject,
    {
      tail: 200,
      timestamps: true,
    }
  );

  // Auto-scroll build logs to bottom when new logs arrive
  useEffect(() => {
    if (buildLogsRef.current && isBuildLogsOpen) {
      buildLogsRef.current.scrollTop = buildLogsRef.current.scrollHeight;
    }
  }, [buildLogs, isBuildLogsOpen]);

  // Auto-scroll container logs to bottom when new logs arrive
  useEffect(() => {
    if (containerLogsRef.current && isLogsCardOpen) {
      containerLogsRef.current.scrollTop =
        containerLogsRef.current.scrollHeight;
    }
  }, [containerLogs, isLogsCardOpen]);

  const handleDeploy = async () => {
    if (isDeploying) {
      return;
    }

    if (!githubUrl.trim()) {
      return;
    }

    // Clear any previous success/error messages when starting new deployment
    setDeploymentSuccess(null);
    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
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

    // Auto-open build logs when deployment starts
    setIsBuildLogsOpen(true);

    // Optimistically update project status to "building" if there's a latest project
    if (latestProject) {
      queryClient.setQueryData(projectKeys.detail(latestProject.id), {
        ...latestProject,
        status: 'building',
      });
      // Also update in the team projects list
      queryClient.setQueryData(projectKeys.listByTeam(team.id), (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((p: any) =>
          p.id === latestProject.id ? { ...p, status: 'building' } : p
        );
      });
    }

    try {
      await streamingDeploy.deploy({
        githubUrl: githubUrl.trim(),
        dataFile: dataFile || undefined,
      });

      // The streaming deploy hook handles the streaming and will call onComplete
      // when deployment is done. We'll show success message when project is deployed.
      // Check for deployed project in useEffect below

      setGithubUrl(''); // Clear input on success
      setDataFile(null); // Clear file input on success
      // Reset the file input element
      const fileInput = document.getElementById(
        'data-file-input'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentSuccess(null); // Clear any success message on error
      // Error will be handled by the streaming deploy hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isDeploying) {
      handleDeploy();
    }
  };

  const handleBuildOldJson = async () => {
    if (isBuildingOldJson || isBuildingOldSql || isDeploying) {
      return;
    }

    if (!githubUrl.trim()) {
      return;
    }

    setOldBuildError(null);
    setIsBuildingOldJson(true);

    // Optimistically update project status to "building" if there's a latest project
    if (latestProject) {
      queryClient.setQueryData(projectKeys.detail(latestProject.id), {
        ...latestProject,
        status: 'building',
      });
      // Also update in the team projects list
      queryClient.setQueryData(projectKeys.listByTeam(team.id), (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((p: any) =>
          p.id === latestProject.id ? { ...p, status: 'building' } : p
        );
      });
      // Also update in teams lists (for CourseProjects page)
      if (team.courseOfferingId) {
        queryClient.setQueryData(
          teamKeys.listByOffering(team.courseOfferingId),
          (old: any) => {
            if (!old || !Array.isArray(old)) return old;
            return old.map((t: any) => {
              if (t.id === team.id && t.projects && Array.isArray(t.projects)) {
                return {
                  ...t,
                  projects: t.projects.map((p: any) =>
                    p.id === latestProject.id ? { ...p, status: 'building' } : p
                  ),
                };
              }
              return t;
            });
          }
        );
        queryClient.setQueryData(
          teamKeys.listMyByOffering(team.courseOfferingId),
          (old: any) => {
            if (!old || !Array.isArray(old)) return old;
            return old.map((t: any) => {
              if (t.id === team.id && t.projects && Array.isArray(t.projects)) {
                return {
                  ...t,
                  projects: t.projects.map((p: any) =>
                    p.id === latestProject.id ? { ...p, status: 'building' } : p
                  ),
                };
              }
              return t;
            });
          }
        );
      }
    }

    try {
      const response = await services.projects.buildOldJson({
        githubUrl: githubUrl.trim(),
        teamId: team.id,
      });

      if (response.data) {
        // Invalidate queries to refresh the project list
        queryClient.invalidateQueries({
          queryKey: projectKeys.listByTeam(team.id),
        });
        queryClient.setQueryData(
          projectKeys.detail(response.data.id),
          response.data
        );
        queryClient.invalidateQueries({ queryKey: projectKeys.containers() });
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        // Invalidate teams queries since teams include projects
        if (team.courseOfferingId) {
          queryClient.invalidateQueries({
            queryKey: teamKeys.listByOffering(team.courseOfferingId),
          });
          queryClient.invalidateQueries({
            queryKey: teamKeys.listMyByOffering(team.courseOfferingId),
          });
        }
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });

        setDeploymentSuccess('Old JSON project built successfully!');
        setTimeout(() => setDeploymentSuccess(null), 5000);
      }
    } catch (error) {
      console.error('Old JSON build failed:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Old JSON build failed. Please try again.';
      setOldBuildError(errorMessage);
    } finally {
      setIsBuildingOldJson(false);
    }
  };

  const handleBuildOldSql = async () => {
    if (isBuildingOldJson || isBuildingOldSql || isDeploying) {
      return;
    }

    if (!githubUrl.trim()) {
      return;
    }

    setOldBuildError(null);
    setIsBuildingOldSql(true);

    // Optimistically update project status to "building" if there's a latest project
    if (latestProject) {
      queryClient.setQueryData(projectKeys.detail(latestProject.id), {
        ...latestProject,
        status: 'building',
      });
      // Also update in the team projects list
      queryClient.setQueryData(projectKeys.listByTeam(team.id), (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((p: any) =>
          p.id === latestProject.id ? { ...p, status: 'building' } : p
        );
      });
      // Also update in teams lists (for CourseProjects page)
      if (team.courseOfferingId) {
        queryClient.setQueryData(
          teamKeys.listByOffering(team.courseOfferingId),
          (old: any) => {
            if (!old || !Array.isArray(old)) return old;
            return old.map((t: any) => {
              if (t.id === team.id && t.projects && Array.isArray(t.projects)) {
                return {
                  ...t,
                  projects: t.projects.map((p: any) =>
                    p.id === latestProject.id ? { ...p, status: 'building' } : p
                  ),
                };
              }
              return t;
            });
          }
        );
        queryClient.setQueryData(
          teamKeys.listMyByOffering(team.courseOfferingId),
          (old: any) => {
            if (!old || !Array.isArray(old)) return old;
            return old.map((t: any) => {
              if (t.id === team.id && t.projects && Array.isArray(t.projects)) {
                return {
                  ...t,
                  projects: t.projects.map((p: any) =>
                    p.id === latestProject.id ? { ...p, status: 'building' } : p
                  ),
                };
              }
              return t;
            });
          }
        );
      }
    }

    try {
      const response = await services.projects.buildOldSql({
        githubUrl: githubUrl.trim(),
        teamId: team.id,
      });

      if (response.data) {
        // Invalidate queries to refresh the project list
        queryClient.invalidateQueries({
          queryKey: projectKeys.listByTeam(team.id),
        });
        queryClient.setQueryData(
          projectKeys.detail(response.data.id),
          response.data
        );
        queryClient.invalidateQueries({ queryKey: projectKeys.containers() });
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        // Invalidate teams queries since teams include projects
        if (team.courseOfferingId) {
          queryClient.invalidateQueries({
            queryKey: teamKeys.listByOffering(team.courseOfferingId),
          });
          queryClient.invalidateQueries({
            queryKey: teamKeys.listMyByOffering(team.courseOfferingId),
          });
        }
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });

        setDeploymentSuccess('Old SQL project built successfully!');
        setTimeout(() => setDeploymentSuccess(null), 5000);
      }
    } catch (error) {
      console.error('Old SQL build failed:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Old SQL build failed. Please try again.';
      setOldBuildError(errorMessage);
    } finally {
      setIsBuildingOldSql(false);
    }
  };

  const handleStopProject = async () => {
    if (!latestProject || isStopping) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to stop this project? The container will be stopped.'
    );
    if (!confirmed) return;

    setStopError(null);
    setIsStopping(true);

    try {
      await services.projects.stop(latestProject.id);

      // Invalidate queries to refresh the project list
      queryClient.invalidateQueries({
        queryKey: projectKeys.listByTeam(team.id),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.containers() });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(latestProject.id),
      });
      // Invalidate teams queries since teams include projects
      if (team.courseOfferingId) {
        queryClient.invalidateQueries({
          queryKey: teamKeys.listByOffering(team.courseOfferingId),
        });
        queryClient.invalidateQueries({
          queryKey: teamKeys.listMyByOffering(team.courseOfferingId),
        });
      }
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });

      setDeploymentSuccess('Project stopped successfully!');
      setTimeout(() => setDeploymentSuccess(null), 5000);
    } catch (error) {
      console.error('Stop project failed:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to stop project. Please try again.';
      setStopError(errorMessage);
    } finally {
      setIsStopping(false);
    }
  };

  // Check if the project can be stopped (is running)
  const canStopProject =
    latestProject &&
    latestProject.status === 'running' &&
    !latestProject.stoppedAt;

  // Determine status from latest project (first entry in projects array)
  // Map API status values to badge status values
  const getProjectStatus = () => {
    // If deployment or build is in progress, show building status
    if (isDeploying || isBuildingOldJson || isBuildingOldSql) {
      return 'building';
    }

    if (!latestProject) return 'none';

    // Map API status to badge status
    if (latestProject.status) {
      const statusLower = latestProject.status.toLowerCase();

      // Handle various status values from API
      if (statusLower === 'stopped') return 'stopped';
      if (statusLower === 'pruned') return 'pruned';
      if (statusLower === 'failed' || statusLower === 'error') return 'error';
      if (statusLower === 'building' || statusLower === 'queued')
        return 'building';
      if (statusLower === 'running') return 'running';
      if (statusLower === 'ready' || statusLower === 'success') return 'ready';

      // Default to the status as-is for unknown statuses
      return statusLower;
    }

    // If no status but has stoppedAt, show stopped
    if (latestProject.stoppedAt) return 'stopped';

    return 'none';
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
            <div className="flex items-center gap-2 ml-auto">
              {(() => {
                // Get project URL using the same method as CourseProjects page
                const siteUrl =
                  import.meta.env.VITE_SITE_URL || window.location.hostname;
                const rawName =
                  latestProject?.containerName?.replace(/^\//, '') || team.name;

                // Format: {container-name}.{site_URL}
                // Remove slashes/spaces and convert to lowercase for URL
                const sanitizedName = rawName
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '');
                const projectUrl = `https://${sanitizedName}.${siteUrl}`;

                const isRunning = projectStatus === 'running';

                return (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(projectUrl, '_blank', 'noopener,noreferrer');
                    }}
                    disabled={!isRunning}
                    className={`flex items-center gap-2 ${
                      !isRunning
                        ? 'opacity-50 cursor-not-allowed text-gray-500'
                        : ''
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Open Project</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                );
              })()}
              {canStopProject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopProject}
                  disabled={isStopping}
                  className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  {isStopping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Stopping...</span>
                    </>
                  ) : (
                    <>
                      <StopCircle className="h-4 w-4" />
                      <span>Stop Project</span>
                    </>
                  )}
                </Button>
              )}
            </div>
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
            <div className="space-y-2">
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
                  disabled={
                    isDeploying ||
                    isBuildingOldJson ||
                    isBuildingOldSql ||
                    !githubUrl.trim()
                  }
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
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        disabled={
                          isDeploying ||
                          isBuildingOldJson ||
                          isBuildingOldSql ||
                          !githubUrl.trim()
                        }
                        className="bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Alternative Build
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleBuildOldJson}
                        disabled={
                          isDeploying ||
                          isBuildingOldJson ||
                          isBuildingOldSql ||
                          !githubUrl.trim()
                        }
                        className="cursor-pointer"
                      >
                        {isBuildingOldJson ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Building Old JSON...
                          </>
                        ) : (
                          'Build Old JSON'
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleBuildOldSql}
                        disabled={
                          isDeploying ||
                          isBuildingOldJson ||
                          isBuildingOldSql ||
                          !githubUrl.trim()
                        }
                        className="cursor-pointer"
                      >
                        {isBuildingOldSql ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Building Old SQL...
                          </>
                        ) : (
                          'Build Old SQL'
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  Data File (optional):
                </span>
                <label
                  htmlFor="data-file-input"
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  {dataFile ? dataFile.name : 'Choose file...'}
                </label>
                <input
                  type="file"
                  id="data-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDataFile(file);
                  }}
                  className="hidden"
                  disabled={isDeploying}
                />
                {dataFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setDataFile(null);
                      // Reset the file input
                      const fileInput = document.getElementById(
                        'data-file-input'
                      ) as HTMLInputElement;
                      if (fileInput) {
                        fileInput.value = '';
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    disabled={isDeploying}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {deploymentSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>{deploymentSuccess}</span>
              </div>
            )}
            {streamingDeploy.error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {streamingDeploy.error.message ||
                    'Deployment failed. Please try again.'}
                </span>
              </div>
            )}
            {oldBuildError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{oldBuildError}</span>
              </div>
            )}
            {stopError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{stopError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Build Logs (collapsible) */}
        <CollapsibleCard
          title="Build Logs"
          icon={<Wrench className="h-5 w-5" />}
          open={isBuildLogsOpen}
          onToggle={setIsBuildLogsOpen}
          maxBodyHeightClass="max-h-80"
        >
          {isBuildLogsStreaming && !streamStarted ? (
            <div className="font-mono text-sm text-gray-600 p-4">
              <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
              Connecting to build logs stream...
            </div>
          ) : isBuildLogsStreaming &&
            streamStarted &&
            buildLogs.length === 0 ? (
            <div className="font-mono text-sm text-gray-600 p-4">
              <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
              Waiting for build to start...
            </div>
          ) : buildLogsError ? (
            <div className="font-mono text-sm text-red-600 p-4">
              <AlertCircle className="h-4 w-4 inline-block mr-2" />
              Error streaming build logs: {buildLogsError.message}
            </div>
          ) : buildLogs.length === 0 ? (
            <div className="font-mono text-sm text-gray-600 p-4">
              No build logs available yet. Deploy a project to see build logs.
            </div>
          ) : (
            <div
              ref={buildLogsRef}
              className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-y-auto max-h-80 text-left"
            >
              {buildLogs.map((log: ParsedLogLine) => (
                <div key={log.id} className="mb-1 text-left">
                  {log.timestamp && (
                    <span className="text-gray-500">
                      [{formatTimestamp(log.timestamp)}]
                    </span>
                  )}
                  <span
                    className={`${log.timestamp ? 'ml-2' : ''} ${
                      log.level === 'ERROR'
                        ? 'text-red-400'
                        : log.level === 'WARN'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              {isBuildLogsStreaming && (
                <div className="text-gray-500 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin inline-block mr-1" />
                  Streaming...
                </div>
              )}
            </div>
          )}
        </CollapsibleCard>

        {/* Container Logs (collapsible) */}
        <CollapsibleCard
          title="Container Logs"
          icon={<Terminal className="h-5 w-5" />}
          defaultOpen={false}
          maxBodyHeightClass="max-h-80"
          onToggle={setIsLogsCardOpen}
        >
          {isContainerLogsStreaming && containerLogs.length === 0 ? (
            <div className="font-mono text-sm text-gray-600 p-4">
              <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
              Connecting to container logs stream...
            </div>
          ) : containerLogsError ? (
            <div className="font-mono text-sm text-red-600 p-4">
              <AlertCircle className="h-4 w-4 inline-block mr-2" />
              Error streaming container logs: {containerLogsError.message}
            </div>
          ) : containerLogs.length === 0 ? (
            <div className="font-mono text-sm text-gray-600 p-4">
              {latestProject
                ? 'No logs available yet.'
                : 'Deploy a project to see container logs.'}
            </div>
          ) : (
            <div
              ref={containerLogsRef}
              className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-y-auto max-h-80 text-left"
            >
              {containerLogs.map((log: ParsedLogLine) => (
                <div key={log.id} className="mb-1 text-left">
                  {log.timestamp && (
                    <span className="text-gray-500">
                      [{formatTimestamp(log.timestamp)}]
                    </span>
                  )}
                  <span
                    className={`${log.timestamp ? 'ml-2' : ''} ${
                      log.level === 'ERROR'
                        ? 'text-red-400'
                        : log.level === 'WARN'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              {isContainerLogsStreaming && (
                <div className="text-gray-500 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin inline-block mr-1" />
                  Streaming...
                </div>
              )}
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
                                    {(project.deployedBy as any)?.name ||
                                      project.deployedBy?.email ||
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
