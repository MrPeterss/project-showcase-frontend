import './App.css';
import { Provider } from 'react-redux';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { store } from './store';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { NavBar } from './components/NavBar';
import { GlobalHeader } from './components/GlobalHeader';
import { CourseLayout } from './components/CourseLayout';
import Courses from './pages/Courses';
import CourseProjects from './pages/CourseProjects';
import CourseDashboard from './pages/CourseDashboard';
import CourseTeamDashboard from './pages/CourseTeamDashboard';
import CourseSettings from './pages/CourseSettings';
import CourseSpark from './pages/CourseSpark';
import Dashboard from './pages/Dashboard';
import ProjectNotFound from './pages/ProjectNotFound';
import NotFound from './pages/NotFound';
import LoginCard from './components/LoginCard';
import Admin from './pages/Admin';

function AppContent() {
  const location = useLocation();

  // Define all valid route patterns
  const isValidRoute =
    location.pathname === '/login' ||
    location.pathname === '/courses' ||
    location.pathname === '/' ||
    location.pathname === '/admin' ||
    location.pathname.startsWith('/courses/') ||
    location.pathname.startsWith('/dashboard/') ||
    location.pathname.startsWith('/not-found/');

  // Only show NavBar on routes that need it
  // Exclude: login, courses, course pages, dashboard pages, admin, not-found pages, and 404 pages
  const shouldShowNav =
    isValidRoute &&
    location.pathname !== '/login' &&
    location.pathname !== '/courses' &&
    !location.pathname.startsWith('/courses/') &&
    !location.pathname.startsWith('/dashboard/') &&
    !location.pathname.startsWith('/not-found/') &&
    !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-svh">
      {/* Global Header - Always visible except on login page */}
      <GlobalHeader />

      {shouldShowNav && <NavBar />}
      <main className="mx-auto max-w-6xl">
        <Routes>
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:offeringId" element={<CourseLayout />}>
            <Route index element={<CourseProjects />} />
            <Route path="dashboard/:teamId" element={<CourseTeamDashboard />} />
            <Route path="dashboard" element={<CourseDashboard />} />
            <Route path="settings" element={<CourseSettings />} />
            <Route path="spark" element={<CourseSpark />} />
          </Route>
          <Route path="/dashboard/:teamId" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/not-found/:team_name" element={<ProjectNotFound />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppErrorBoundary>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AppErrorBoundary>
    </Provider>
  );
}

export default App;
