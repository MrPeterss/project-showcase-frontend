import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Github,
  Globe,
  Clock,
  Users,
  Terminal,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

// Hardcoded dummy data
const deploymentData = {
  status: 'ready', // 'ready', 'building', 'error', 'queued'
  teamName: 'Recommendations Team',
  portNumber: 3000,
  githubUrl: 'https://github.com/cornell-appdev/project-showcase-frontend',
  domain: 'project-showcase-frontend.vercel.app',
  lastDeployment: '2 minutes ago',
  buildTime: '1m 23s',
};

const teamMembers = [
  {
    id: 1,
    name: 'Alice Johnson',
    role: 'Team Lead',
    avatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    initials: 'AJ',
  },
  {
    id: 2,
    name: 'Bob Chen',
    role: 'Frontend Developer',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    initials: 'BC',
  },
  {
    id: 3,
    name: 'Carol Davis',
    role: 'Backend Developer',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    initials: 'CD',
  },
  {
    id: 4,
    name: 'David Wilson',
    role: 'DevOps Engineer',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    initials: 'DW',
  },
  {
    id: 5,
    name: 'Eva Martinez',
    role: 'UI/UX Designer',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    initials: 'EM',
  },
];

const deploymentHistory = [
  {
    id: 1,
    commit: 'feat: add user authentication',
    hash: 'a1b2c3d',
    status: 'ready',
    time: '2 minutes ago',
    duration: '1m 23s',
  },
  {
    id: 2,
    commit: 'fix: resolve navbar styling issues',
    hash: 'e4f5g6h',
    status: 'ready',
    time: '1 hour ago',
    duration: '2m 15s',
  },
  {
    id: 3,
    commit: 'refactor: update API endpoints',
    hash: 'i7j8k9l',
    status: 'ready',
    time: '3 hours ago',
    duration: '1m 45s',
  },
  {
    id: 4,
    commit: 'feat: implement dashboard layout',
    hash: 'm0n1o2p',
    status: 'error',
    time: '5 hours ago',
    duration: '45s',
  },
];

const containerLogs = [
  {
    id: 1,
    timestamp: '2025-10-06 14:32:15',
    level: 'INFO',
    message: 'Server started on port 3000',
  },
  {
    id: 2,
    timestamp: '2025-10-06 14:32:16',
    level: 'INFO',
    message: 'Database connection established',
  },
  {
    id: 3,
    timestamp: '2025-10-06 14:32:17',
    level: 'INFO',
    message: 'Routes initialized successfully',
  },
  {
    id: 4,
    timestamp: '2025-10-06 14:35:22',
    level: 'INFO',
    message: 'GET /api/users - 200 OK (15ms)',
  },
  {
    id: 5,
    timestamp: '2025-10-06 14:35:45',
    level: 'WARN',
    message: 'Rate limit approaching for IP 192.168.1.100',
  },
  {
    id: 6,
    timestamp: '2025-10-06 14:36:12',
    level: 'INFO',
    message: 'POST /api/auth/login - 200 OK (234ms)',
  },
  {
    id: 7,
    timestamp: '2025-10-06 14:37:03',
    level: 'ERROR',
    message: 'Failed to connect to external API: timeout after 5000ms',
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'building':
      return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'queued':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants = {
    ready: 'bg-green-100 text-green-800 border-green-200',
    building: 'bg-blue-100 text-blue-800 border-blue-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    queued: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <Badge className={`${variants[status as keyof typeof variants]} border`}>
      {getStatusIcon(status)}
      <span className="ml-1 capitalize">{status}</span>
    </Badge>
  );
};

export function Dashboard() {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulate deployment
    setTimeout(() => {
      setIsDeploying(false);
    }, 3000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusBadge(deploymentData.status)}
              <h1 className="text-3xl font-bold text-gray-900">
                {deploymentData.teamName}
              </h1>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Github className="h-4 w-4" />
                <a
                  href={deploymentData.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {deploymentData.githubUrl}
                </a>
              </div>
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

          {/* Deployment Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Deployment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Team Name
                  </label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {deploymentData.teamName}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Port Number
                  </label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {deploymentData.portNumber}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  GitHub Repository
                </label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <Github className="h-4 w-4" />
                  <a
                    href={deploymentData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex-1"
                  >
                    {deploymentData.githubUrl}
                  </a>
                </div>
              </div>

              <div className="text-sm text-gray-600 pt-2">
                Last deployed {deploymentData.lastDeployment} • Build time:{' '}
                {deploymentData.buildTime}
              </div>
            </CardContent>
          </Card>

          {/* Container Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Container Logs
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      View Logs <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96 max-h-64 overflow-y-auto">
                    {containerLogs.map((log) => (
                      <DropdownMenuItem
                        key={log.id}
                        className="flex-col items-start p-3 border-b"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xs text-gray-500">
                            {log.timestamp}
                          </span>
                          <Badge
                            variant={
                              log.level === 'ERROR'
                                ? 'destructive'
                                : log.level === 'WARN'
                                ? 'secondary'
                                : 'default'
                            }
                            className="text-xs"
                          >
                            {log.level}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1 font-mono">{log.message}</p>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-48 overflow-y-auto">
                {containerLogs.slice(-3).map((log) => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-500">[{log.timestamp}]</span>
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
            </CardContent>
          </Card>

          {/* Deployment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Deployment History
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      View History <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80">
                    {deploymentHistory.map((deployment) => (
                      <DropdownMenuItem
                        key={deployment.id}
                        className="flex-col items-start p-3 border-b"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deployment.status)}
                            <span className="font-medium text-sm">
                              {deployment.hash}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {deployment.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {deployment.commit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Build time: {deployment.duration}
                        </p>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deploymentHistory.slice(0, 3).map((deployment) => (
                  <div
                    key={deployment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {deployment.commit}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deployment.hash} • {deployment.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {deployment.duration}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="space-y-6">
          {/* Team Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {deploymentData.teamName}
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{teamMembers.length} members</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <a
                  href={`https://${deploymentData.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {deploymentData.domain}
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
                    <p className="text-xs text-gray-600">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Deployments</span>
                <span className="font-medium">247</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium text-green-600">98.4%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Build Time</span>
                <span className="font-medium">1m 34s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Activity</span>
                <span className="font-medium">
                  {deploymentData.lastDeployment}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
