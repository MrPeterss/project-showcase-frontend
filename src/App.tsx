import './App.css';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { QueryErrorBoundary } from './components/ErrorBoundary';
import { NavBar } from './components/NavBar';
import { GlobalHeader } from './components/GlobalHeader';
import { CourseLayout } from './components/CourseLayout';
import Courses from './pages/Courses';
import CourseProjects from './pages/CourseProjects';
import CourseDashboard from './pages/CourseDashboard';
import CourseTeamDashboard from './pages/CourseTeamDashboard';
import CourseSettings from './pages/CourseSettings';
import Dashboard from './pages/Dashboard';
import ProjectNotFound from './pages/ProjectNotFound';
import LoginCard from './components/LoginCard';

function AppContent() {
  const location = useLocation();
  const shouldShowNav =
    location.pathname !== '/login' &&
    location.pathname !== '/courses' &&
    !location.pathname.startsWith('/courses/') &&
    !location.pathname.startsWith('/dashboard/') &&
    !location.pathname.startsWith('/not-found/');

  return (
    <div className="min-h-svh">
      {/* Global Header - Always visible except on login page */}
      <GlobalHeader />

      {shouldShowNav && <NavBar />}
      <main className="mx-auto max-w-6xl">
        <Routes>
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseLayout />}>
            <Route index element={<CourseProjects />} />
            <Route path="dashboard" element={<CourseDashboard />} />
            <Route path="dashboard/:teamId" element={<CourseTeamDashboard />} />
            <Route path="settings" element={<CourseSettings />} />
          </Route>
          <Route path="/dashboard/:teamId" element={<Dashboard />} />
          <Route path="/not-found/:team_name" element={<ProjectNotFound />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <QueryErrorBoundary>
          <BrowserRouter>
            <AppContent />
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </BrowserRouter>
        </QueryErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
