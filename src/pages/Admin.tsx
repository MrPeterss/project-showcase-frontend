import { useState, useEffect, useMemo, useRef } from 'react';
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
  AdminSystemStorageResponse,
  AdminSystemStreamReadyEvent,
  AdminSystemStreamStatsEvent,
  AdminSystemStreamErrorEvent,
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
import { SortableTable } from '@/components/ui/sortable-table';
import type { ColumnDef } from '@/components/ui/sortable-table';
import { API_BASE_URL } from '@/lib/api';
import { createSseStream, type SseStreamConnection } from '@/lib/streaming';
import CollapsibleCard from '@/components/CollapsibleCard';

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

function readNumericPercentLike(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // accept 0..1 or 0..100, normalize to 0..100
    if (value >= 0 && value <= 1) return value * 100;
    if (value >= 0 && value <= 100) return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // e.g. "12.3%" or "12.3"
    const maybe = trimmed.endsWith('%') ? trimmed.slice(0, -1) : trimmed;
    const n = Number(maybe);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return '—';
  const abs = Math.abs(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let u = 0;
  let n = abs;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  const sign = bytes < 0 ? '-' : '';
  const value =
    n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2);
  return `${sign}${value} ${units[u]}`;
}

function progressColorClass(percent: number | null | undefined): string {
  const p = percent ?? 0;
  if (p > 95) return 'bg-red-600';
  if (p > 75) return 'bg-orange-500';
  if (p > 50) return 'bg-yellow-500';
  return 'bg-green-600';
}

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
    systemStorage: boolean;
  }>({
    projects: false,
    stopping: new Set(),
    pruning: new Set(),
    manualPruning: false,
    systemStorage: false,
  });

  const systemStreamRef = useRef<SseStreamConnection | null>(null);
  const [systemStreamStatus, setSystemStreamStatus] = useState<
    'connecting' | 'connected' | 'error'
  >('connecting');
  const [systemStreamError, setSystemStreamError] = useState<string | null>(
    null
  );
  const [systemStats, setSystemStats] = useState<AdminSystemStreamStatsEvent | null>(
    null
  );

  const [systemStorage, setSystemStorage] = useState<AdminSystemStorageResponse | null>(
    null
  );
  const [systemStorageError, setSystemStorageError] = useState<string | null>(null);

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

  const fetchSystemStorage = async () => {
    setLoading((prev) => ({ ...prev, systemStorage: true }));
    setSystemStorageError(null);
    try {
      const response = await services.admin.getSystemStorage();
      setSystemStorage(response.data);
    } catch (error) {
      console.error('Error fetching system storage:', error);
      setSystemStorage(null);
      setSystemStorageError('Failed to fetch filesystem usage');
    } finally {
      setLoading((prev) => ({ ...prev, systemStorage: false }));
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchProjects();
      fetchSystemStorage();
    }
  }, [user]);

  // Stream CPU + memory (SSE)
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    // Close any previous connection
    if (systemStreamRef.current) {
      systemStreamRef.current.close();
      systemStreamRef.current = null;
    }

    setSystemStreamStatus('connecting');
    setSystemStreamError(null);

    const streamUrl = `${API_BASE_URL}/admin/system/stream`;
    const stream = createSseStream(streamUrl, {
      onOpen: () => setSystemStreamStatus('connected'),
      onError: () => {
        setSystemStreamStatus('error');
        setSystemStreamError('SSE connection error');
      },
      onEvent: (evt) => {
        if (evt.event === 'ready') {
          try {
            JSON.parse(evt.data) as AdminSystemStreamReadyEvent;
            setSystemStreamStatus('connected');
            setSystemStreamError(null);
          } catch {
            // ignore
          }
          return;
        }

        if (evt.event === 'stats') {
          try {
            const parsed = JSON.parse(evt.data) as AdminSystemStreamStatsEvent;
            setSystemStats(parsed);
            setSystemStreamStatus('connected');
            setSystemStreamError(null);
          } catch (err) {
            console.error('Failed to parse system stats SSE payload:', err);
          }
          return;
        }

        if (evt.event === 'error') {
          try {
            const parsed = JSON.parse(evt.data) as AdminSystemStreamErrorEvent;
            setSystemStreamStatus('error');
            setSystemStreamError(parsed.message || 'System stream error');
          } catch {
            setSystemStreamStatus('error');
            setSystemStreamError('System stream error');
          }
        }
      },
    });

    systemStreamRef.current = stream;

    return () => {
      stream.close();
      if (systemStreamRef.current === stream) systemStreamRef.current = null;
    };
  }, [user]);

  const cpuDetails = useMemo(() => {
    const cpu = (systemStats?.cpu ?? null) as Record<string, unknown> | null;
    if (!cpu) return null;

    const smoothed = readRecord(cpu.smoothed);

    const currentLoad =
      readFiniteNumber(smoothed?.currentLoad) ?? readFiniteNumber(cpu.currentLoad);
    const user = readFiniteNumber(smoothed?.user) ?? readFiniteNumber(cpu.user);
    const system =
      readFiniteNumber(smoothed?.system) ?? readFiniteNumber(cpu.system);
    const idle =
      readNumericPercentLike(smoothed?.idle) ?? readNumericPercentLike(cpu.idle);

    const loadFromIdle = idle !== null ? 100 - idle : null;

    return {
      isSmoothed: !!smoothed,
      // Prefer 100-idle to align with backend reporting; fall back to currentLoad.
      currentLoadPercent:
        loadFromIdle !== null ? loadFromIdle : currentLoad !== null ? currentLoad * 100 : null,
      userPercent: user !== null ? readNumericPercentLike(user) : null,
      systemPercent: system !== null ? readNumericPercentLike(system) : null,
      idlePercent: idle,
    };
  }, [systemStats]);

  const cpuCores = useMemo(() => {
    const cpu = (systemStats?.cpu ?? null) as Record<string, unknown> | null;
    if (!cpu) return [];
    const coresRaw = cpu.cores;
    if (!Array.isArray(coresRaw)) return [];

    return coresRaw
      .map((c) => c as Record<string, unknown>)
      .map((c) => {
        const smoothed = readRecord(c.smoothed);
        const core = readFiniteNumber(c.core);
        const load = readFiniteNumber(smoothed?.load) ?? readFiniteNumber(c.load);
        const user = readFiniteNumber(smoothed?.user) ?? readFiniteNumber(c.user);
        const system =
          readFiniteNumber(smoothed?.system) ?? readFiniteNumber(c.system);
        const idle =
          readNumericPercentLike(smoothed?.idle) ?? readNumericPercentLike(c.idle);

        const loadFromIdle = idle !== null ? 100 - idle : null;
        return {
          core: core ?? null,
          // Prefer 100-idle to align with overall display; fall back to load.
          loadPercent: loadFromIdle !== null ? loadFromIdle : load !== null ? load * 100 : null,
          userPercent: user !== null ? user * 100 : null,
          systemPercent: system !== null ? system * 100 : null,
          idlePercent: idle,
        };
      })
      .filter((c) => c.core !== null)
      .sort((a, b) => (a.core ?? 0) - (b.core ?? 0));
  }, [systemStats]);

  const memoryDetails = useMemo(() => {
    const mem = (systemStats?.memory ?? null) as Record<string, unknown> | null;
    if (!mem) return null;

    const total = readFiniteNumber(mem.total);
    const used = readFiniteNumber(mem.used);
    const available = readFiniteNumber(mem.available);
    const free = readFiniteNumber(mem.free);
    const active = readFiniteNumber(mem.active);

    const swaptotal = readFiniteNumber(mem.swaptotal);
    const swapused = readFiniteNumber(mem.swapused);
    const swapfree = readFiniteNumber(mem.swapfree);

    const percentUsed =
      total && active !== null && total > 0 ? (active / total) * 100 : null;

    const swapPercentUsed =
      swaptotal && swapused !== null && swaptotal > 0 ? (swapused / swaptotal) * 100 : null;

    return {
      total,
      used,
      available,
      free,
      active,
      swaptotal,
      swapused,
      swapfree,
      percentUsed,
      swapPercentUsed,
    };
  }, [systemStats]);

  // "Live" indicator should be time-based (not load-based). We use a pulse animation
  // that visually interpolates between deeper red and lighter red.

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

  // Define project columns for sortable table
  const projectColumns: ColumnDef<AdminProject>[] = [
    {
      key: 'project',
      label: 'Project',
      headerClassName: 'border-r',
      cellClassName: 'border-r',
      accessor: (project) => project.id,
      render: (project) => (
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
      ),
    },
    {
      key: 'container',
      label: (
        <div className="flex items-center gap-2">
          <Package className="h-3 w-3" />
          Container
        </div>
      ),
      headerClassName: 'border-r',
      cellClassName: 'border-r',
      accessor: (project) => project.containerName || project.containerId || '',
      render: (project) => {
        const shortContainerId = project.containerId
          ? project.containerId.substring(0, 12)
          : null;

        return (
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
        );
      },
    },
    {
      key: 'image',
      label: (
        <div className="flex items-center gap-2">
          <HardDrive className="h-3 w-3" />
          Image
        </div>
      ),
      headerClassName: 'border-r',
      cellClassName: 'border-r',
      accessor: (project) => project.imageName || project.imageHash || '',
      render: (project) => (
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
      ),
    },
    {
      key: 'dataFile',
      label: (
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3" />
          Data File
        </div>
      ),
      headerClassName: 'border-r',
      cellClassName: 'border-r',
      accessor: (project) => project.dataFile?.fileName || '',
      render: (project) => (
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
      ),
    },
    {
      key: 'deployed',
      label: 'Deployed',
      headerClassName: 'border-r',
      cellClassName: 'border-r',
      accessor: (project) => project.deployedAt || '',
      sortFn: (a, b, direction) => {
        const aTime = a.deployedAt ? new Date(a.deployedAt).getTime() : 0;
        const bTime = b.deployedAt ? new Date(b.deployedAt).getTime() : 0;
        return direction === 'asc' ? aTime - bTime : bTime - aTime;
      },
      render: (project) => (
        <div className="text-xs text-muted-foreground">
          <div>{formatDate(project.deployedAt)}</div>
          {project.stoppedAt && (
            <div className="mt-1">Stopped: {formatDate(project.stoppedAt)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'border-l',
      cellClassName: 'border-l',
      align: 'right',
      sortable: false,
      render: (project) => {
        const isRunning = project.status === 'running';
        const isStopping = loading.stopping.has(project.id);
        const isPruning = loading.pruning.has(project.id);

        return (
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
        );
      },
    },
  ];

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
            <SortableTable
              columns={projectColumns}
              data={projects}
              getRowKey={(project) => project.id}
              headerClassName="bg-gray-100"
              rowClassName="border-t hover:bg-white"
            />
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
        <CardHeader className="text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>System resources</CardTitle>
              <CardDescription className="mt-1">
                Live CPU + memory and on-demand filesystem usage.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {systemStreamStatus === 'connected' ? (
                <Badge
                  variant="outline"
                  className="border border-red-700 bg-red-600 text-white animate-pulse"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white/90" />
                    Live
                  </span>
                </Badge>
              ) : (
                <Badge
                  variant={systemStreamStatus === 'connecting' ? 'secondary' : 'destructive'}
                >
                  {systemStreamStatus === 'connecting' ? 'Connecting' : 'Offline'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemStreamError && (
            <div className="text-sm text-red-600">{systemStreamError}</div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">CPU</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {cpuDetails?.currentLoadPercent !== null &&
                cpuDetails?.currentLoadPercent !== undefined
                  ? `${cpuDetails.currentLoadPercent.toFixed(1)}%`
                  : '—'}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${progressColorClass(
                    cpuDetails?.currentLoadPercent ?? 0
                  )}`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, cpuDetails?.currentLoadPercent ?? 0)
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground tabular-nums">
                <span>
                  User:{' '}
                  {cpuDetails?.userPercent !== null &&
                  cpuDetails?.userPercent !== undefined
                    ? `${cpuDetails.userPercent.toFixed(1)}%`
                    : '—'}
                </span>
                {' · '}
                <span>
                  System:{' '}
                  {cpuDetails?.systemPercent !== null &&
                  cpuDetails?.systemPercent !== undefined
                    ? `${cpuDetails.systemPercent.toFixed(1)}%`
                    : '—'}
                </span>
                {' · '}
                <span>
                  Idle:{' '}
                  {cpuDetails?.idlePercent !== null &&
                  cpuDetails?.idlePercent !== undefined
                    ? `${cpuDetails.idlePercent.toFixed(1)}%`
                    : '—'}
                </span>
              </div>
              {cpuCores.length > 0 && (
                <div className="mt-4">
                  <CollapsibleCard
                    title={`Core details (${cpuCores.length})`}
                    defaultOpen={false}
                    maxBodyHeightClass="max-h-64"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cpuCores.map((c) => (
                        <div
                          key={`core-${c.core}`}
                          className="rounded-md border bg-white p-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-mono text-muted-foreground">
                              Core {c.core}
                            </div>
                            <div className="text-xs tabular-nums text-muted-foreground">
                              {c.loadPercent !== null
                                ? `${c.loadPercent.toFixed(1)}%`
                                : '—'}
                            </div>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                            <div
                            className={`h-1.5 rounded-full ${progressColorClass(
                              c.loadPercent ?? 0
                            )}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, c.loadPercent ?? 0)
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                            <span>
                              U:{' '}
                              {c.userPercent !== null
                                ? `${c.userPercent.toFixed(1)}%`
                                : '—'}
                            </span>
                            {' · '}
                            <span>
                              S:{' '}
                              {c.systemPercent !== null
                                ? `${c.systemPercent.toFixed(1)}%`
                                : '—'}
                            </span>
                            {' · '}
                            <span>
                              I:{' '}
                              {c.idlePercent !== null
                                ? `${c.idlePercent.toFixed(1)}%`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleCard>
                </div>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Memory</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {memoryDetails?.percentUsed !== null &&
                memoryDetails?.percentUsed !== undefined
                  ? `${memoryDetails.percentUsed.toFixed(1)}%`
                  : '—'}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-[11px] text-muted-foreground tabular-nums w-10">
                  Mem
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${progressColorClass(
                      memoryDetails?.percentUsed ?? 0
                    )}`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, memoryDetails?.percentUsed ?? 0)
                      )}%`,
                    }}
                  />
                </div>
              </div>
              {memoryDetails?.swapPercentUsed !== null &&
                memoryDetails?.swapPercentUsed !== undefined && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-[11px] text-muted-foreground tabular-nums w-10">
                      Swp
                    </div>
                    <div className="h-1 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-1 rounded-full ${progressColorClass(
                          memoryDetails.swapPercentUsed
                        )}`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, memoryDetails.swapPercentUsed)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              <div className="mt-2 text-xs text-muted-foreground tabular-nums space-y-1">
                <div>
                  Active: {formatBytes(memoryDetails?.active ?? null)} /{' '}
                  {formatBytes(memoryDetails?.total ?? null)}
                </div>
                <div>
                  Available: {formatBytes(memoryDetails?.available ?? null)}
                  {memoryDetails?.used !== null && memoryDetails?.used !== undefined
                    ? ` · Used: ${formatBytes(memoryDetails.used)}`
                    : ''}
                </div>
                {(memoryDetails?.swaptotal ?? null) !== null && (
                  <div>
                    Swap: {formatBytes(memoryDetails?.swapused ?? null)} /{' '}
                    {formatBytes(memoryDetails?.swaptotal ?? null)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Filesystem usage</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  {systemStorage?.timestamp
                    ? `As of ${formatDate(systemStorage.timestamp)}`
                    : ''}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSystemStorage}
                  disabled={loading.systemStorage}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      loading.systemStorage ? 'animate-spin' : ''
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {systemStorageError ? (
              <div className="px-4 py-3 text-sm text-red-600">{systemStorageError}</div>
            ) : !systemStorage ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                {loading.systemStorage ? 'Loading filesystem usage…' : 'No filesystem data yet.'}
              </div>
            ) : systemStorage.filesystems.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No filesystems reported.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium">Mount</th>
                      <th className="px-4 py-2 font-medium">FS</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Used</th>
                      <th className="px-4 py-2 font-medium">Size</th>
                      <th className="px-4 py-2 font-medium">Use</th>
                      <th className="px-4 py-2 font-medium">RW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemStorage.filesystems.map((fs) => (
                      <tr key={`${fs.fs}-${fs.mount}`} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs">{fs.mount}</td>
                        <td className="px-4 py-2 font-mono text-xs">{fs.fs}</td>
                        <td className="px-4 py-2">{fs.type}</td>
                        <td className="px-4 py-2 tabular-nums">
                          {formatBytes(readFiniteNumber(fs.used))}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {formatBytes(readFiniteNumber(fs.size))}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{fs.use}</td>
                        <td className="px-4 py-2">{fs.rw ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
