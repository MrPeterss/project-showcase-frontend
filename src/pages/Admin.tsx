import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { services } from '@/services';
import type {
  ProjectsResponse,
  TeamWithProjects,
  AdminTeam,
  AdminProject,
} from '@/services/admin';
import { getStatusBadge } from '@/pages/Dashboard/shared';
import {
  Trash2,
  RefreshCw,
  StopCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Package,
  HardDrive,
  FileText,
} from 'lucide-react';

// Helper to format team context
function formatTeamContext(team: AdminTeam): string {
  const { courseOffering } = team;
  const { course, semester } = courseOffering;
  return `${course.department} ${course.number} - ${semester.season} ${semester.year}`;
}

// Format date
const formatDate = (timestamp: string | null | undefined): string => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [projectsData, setProjectsData] = useState<ProjectsResponse | null>(
    null
  );
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<{
    projects: boolean;
    stopping: Set<number>;
    pruning: Set<number>;
    manualPruning: boolean;
  }>({
    projects: false,
    stopping: new Set(),
    pruning: new Set(),
    manualPruning: false,
  });

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/courses', { replace: true });
    }
  }, [user, navigate]);

  // Fetch projects
  const fetchProjects = async () => {
    setLoading((prev) => ({ ...prev, projects: true }));
    try {
      const response = await services.admin.getProjects();
      console.log('Projects response:', response);
      setProjectsData(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to fetch projects');
      setProjectsData(null);
    } finally {
      setLoading((prev) => ({ ...prev, projects: false }));
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchProjects();
    }
  }, [user]);

  // Toggle team expanded
  const toggleTeamExpanded = (teamId: number) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  // Handle stop project
  const handleStopProject = async (projectId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to stop this project? The container will be stopped.'
    );
    if (!confirmed) return;

    setLoading((prev) => ({
      ...prev,
      stopping: new Set(prev.stopping).add(projectId),
    }));

    try {
      await services.projects.stop(projectId);
      alert('Project stopped successfully');
      fetchProjects(); // Refresh projects
    } catch (error) {
      console.error('Error stopping project:', error);
      alert('Failed to stop project');
    } finally {
      setLoading((prev) => {
        const next = new Set(prev.stopping);
        next.delete(projectId);
        return { ...prev, stopping: next };
      });
    }
  };

  // Handle prune project
  const handlePruneProject = async (projectId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to prune this project? This will remove the container, image, and data file, and mark the project as pruned.'
    );
    if (!confirmed) return;

    setLoading((prev) => ({
      ...prev,
      pruning: new Set(prev.pruning).add(projectId),
    }));

    try {
      const response = await services.admin.pruneProject(projectId);
      const errors = response.data.errors;
      if (errors && errors.length > 0) {
        alert(
          `Project pruned with warnings:\n\n${errors.join(
            '\n'
          )}\n\nProject marked as pruned.`
        );
      } else {
        alert('Project pruned successfully');
      }
      fetchProjects(); // Refresh projects
    } catch (error) {
      console.error('Error pruning project:', error);
      alert('Failed to prune project');
    } finally {
      setLoading((prev) => {
        const next = new Set(prev.pruning);
        next.delete(projectId);
        return { ...prev, pruning: next };
      });
    }
  };

  // Handle manual prune (prune all untagged, non-running projects)
  const handleManualPrune = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to prune untagged, non-running projects? This will remove containers, images, and data files.'
    );
    if (!confirmed) return;

    setLoading((prev) => ({ ...prev, manualPruning: true }));

    try {
      const response = await services.admin.pruneProjects();
      const result = response.data.result;
      alert(
        `Pruning completed!\n\nTotal found: ${
          result.totalFound
        }\nSuccessfully removed: ${result.successCount}\nErrors: ${
          result.errorCount
        }${
          result.errors.length > 0
            ? '\n\nErrors:\n' + result.errors.join('\n')
            : ''
        }`
      );
      fetchProjects(); // Refresh projects
    } catch (error) {
      console.error('Error pruning projects:', error);
      alert('Failed to prune projects');
    } finally {
      setLoading((prev) => ({ ...prev, manualPruning: false }));
    }
  };

  // Render project row
  const renderProjectRow = (project: AdminProject) => {
    const isRunning = project.status === 'running';
    const isStopping = loading.stopping.has(project.id);
    const isPruning = loading.pruning.has(project.id);
    const shortContainerId = project.containerId
      ? project.containerId.substring(0, 12)
      : null;

    return (
      <tr key={project.id} className="border-t hover:bg-white">
        <td className="px-4 py-3 border-r">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getStatusBadge(project.status)}
              <span className="text-sm font-medium">Project #{project.id}</span>
            </div>
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {project.githubUrl
                  .replace(/^https?:\/\//, '')
                  .split('/')
                  .slice(0, 2)
                  .join('/')}
              </a>
            )}
            {project.tag && (
              <Badge variant="outline" className="text-xs">
                {project.tag}
              </Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-3 border-r">
          <div className="space-y-1 text-sm">
            {project.containerId ? (
              <>
                <div className="font-mono text-xs">{shortContainerId}</div>
                {project.containerName && (
                  <div className="text-xs text-muted-foreground">
                    {project.containerName.replace(/^\//, '')}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-muted-foreground">No container</div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 border-r">
          <div className="space-y-1 text-sm">
            {project.imageName || project.imageHash ? (
              <>
                {project.imageName ? (
                  <div className="text-xs font-mono">{project.imageName}</div>
                ) : (
                  <div className="text-xs font-mono text-muted-foreground">
                    {project.imageHash?.substring(0, 19) || 'Unknown'}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-muted-foreground">No image</div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 border-r">
          <div className="space-y-1 text-sm">
            {project.dataFile ? (
              <>
                <div className="text-xs">{project.dataFile.fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {project.dataFile.sizeFormatted}
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">No data file</div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground border-r">
          <div>{formatDate(project.deployedAt)}</div>
          {project.stoppedAt && (
            <div className="mt-1">Stopped: {formatDate(project.stoppedAt)}</div>
          )}
        </td>
        <td className="px-4 py-3 text-right border-l">
          <div className="flex gap-1 justify-end">
            {isRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStopProject(project.id)}
                disabled={isStopping || isPruning}
              >
                {isStopping ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePruneProject(project.id)}
              disabled={isStopping || isPruning}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isPruning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  // Render team section
  const renderTeamSection = (teamData: TeamWithProjects) => {
    const { team, projects } = teamData;
    const isExpanded = expandedTeams.has(team.id);

    return (
      <div key={team.id} className="border-b">
        <div
          className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
          onClick={() => toggleTeamExpanded(team.id)}
        >
          <div className="w-8">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium">{team.name}</div>
            <div className="text-sm text-muted-foreground">
              {formatTeamContext(team)}
            </div>
          </div>
          <Badge variant="outline">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {isExpanded && (
          <div className="bg-gray-50 border-t">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r">
                    Project
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      Container
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3 w-3" />
                      Image
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Data File
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r">
                    Deployed
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => renderProjectRow(project))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const totalProjects = projectsData?.totalProjects ?? 0;

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Resource Management</CardTitle>
          <CardDescription>
            Manage projects, containers, images, and data files. Admin access
            only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleManualPrune}
              disabled={loading.manualPruning}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  loading.manualPruning ? 'animate-spin' : ''
                }`}
              />
              {loading.manualPruning ? 'Pruning...' : 'Manual Prune'}
            </Button>
            <Button
              variant="outline"
              onClick={fetchProjects}
              disabled={loading.projects}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  loading.projects ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription className="mt-1">
                All projects organized by team ({totalProjects} total)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              disabled={loading.projects}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading.projects ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading.projects ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : !projectsData || projectsData.teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No projects found
            </div>
          ) : (
            <div className="overflow-x-auto">
              {projectsData.teams.map(renderTeamSection)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
