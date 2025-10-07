// TODO: GET RID OF THIS

import { Activity, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const deploymentData = {
  status: 'ready' as 'ready' | 'building' | 'error' | 'queued',
  teamName: 'crumbless',
  portNumber: 5200,
  githubUrl: 'https://github.com/cornell-appdev/project-showcase-frontend',
};

export const teamMembers = [
  { id: 1, name: 'Alice Johnson', initials: 'AJ', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
  { id: 2, name: 'Bob Chen', initials: 'BC', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { id: 3, name: 'Carol Davis', initials: 'CD', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
  { id: 4, name: 'David Wilson', initials: 'DW', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
  { id: 5, name: 'Eva Martinez', initials: 'EM', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
];

export const containerLogs = [
  { id: 1, timestamp: '2025-10-06 14:32:15', level: 'INFO', message: 'Server started on port 5200' },
  { id: 2, timestamp: '2025-10-06 14:32:16', level: 'INFO', message: 'Database connection established' },
  { id: 3, timestamp: '2025-10-06 14:32:17', level: 'INFO', message: 'Routes initialized successfully' },
  { id: 4, timestamp: '2025-10-06 14:35:22', level: 'INFO', message: 'GET /api/users - 200 OK (15ms)' },
  { id: 5, timestamp: '2025-10-06 14:35:45', level: 'WARN', message: 'Rate limit approaching for IP 192.168.1.100' },
  { id: 6, timestamp: '2025-10-06 14:36:12', level: 'INFO', message: 'POST /api/auth/login - 200 OK (234ms)' },
  { id: 7, timestamp: '2025-10-06 14:37:03', level: 'ERROR', message: 'Failed to connect to external API: timeout after 5000ms' },
];

export const activityLogs = [
  { id: 1, timestamp: '2025-10-06 14:32:15', user: 'Alice Johnson', action: 'built', repo: 'https://github.com/cornell-appdev/project-showcase-frontend' },
  { id: 2, timestamp: '2025-10-06 13:11:02', user: 'Bob Chen', action: 'built', repo: 'https://github.com/cornell-appdev/project-showcase-backend' },
  { id: 3, timestamp: '2025-10-06 12:45:30', user: 'Carol Davis', action: 'built', repo: 'https://github.com/cornell-appdev/crumbless-service' },
  { id: 4, timestamp: '2025-10-06 11:05:47', user: 'David Wilson', action: 'built', repo: 'https://github.com/cornell-appdev/project-showcase-frontend' },
  { id: 5, timestamp: '2025-10-05 18:22:10', user: 'Alice Johnson', action: 'built', repo: 'https://github.com/cornell-appdev/project-showcase-backend' },
  { id: 6, timestamp: '2025-10-05 09:14:55', user: 'Eva Martinez', action: 'built', repo: 'https://github.com/cornell-appdev/crumbless-web' },
  { id: 7, timestamp: '2025-10-04 21:05:03', user: 'Bob Chen', action: 'built', repo: 'https://github.com/cornell-appdev/project-showcase-frontend' },
  { id: 8, timestamp: '2025-10-04 08:49:12', user: 'Carol Davis', action: 'built', repo: 'https://github.com/cornell-appdev/crumbless-service' },
  { id: 9, timestamp: '2025-09-30 16:30:00', user: 'David Wilson', action: 'built', repo: 'https://github.com/cornell-appdev/deploy-infra' },
  { id: 10, timestamp: '2025-09-30 10:12:37', user: 'Alice Johnson', action: 'built', repo: 'https://github.com/cornell-appdev/project-showcase-backend' },
];

export const getStatusIcon = (status: string) => {
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

export const getStatusBadge = (status: string) => {
  const variants = {
    ready: 'bg-green-100 text-green-800 border-green-200',
    building: 'bg-blue-100 text-blue-800 border-blue-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    queued: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  } as const;

  return (
    <Badge className={`${variants[status as keyof typeof variants]} border`}>
      {getStatusIcon(status)}
      <span className="ml-1 capitalize">{status}</span>
    </Badge>
  );
};

export const displayGithubPath = (url: string) => url.replace(/^https?:\/\/github\.com\//, '');

export const formatTimestamp = (isoLike: string) => {
  const normalized = isoLike.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return isoLike;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatDateLabel = (isoLike: string) => {
  const normalized = isoLike.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return isoLike;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (isoLike: string) => {
  const normalized = isoLike.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return isoLike;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};


