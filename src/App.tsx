import './App.css';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { QueryErrorBoundary } from './components/ErrorBoundary';
import { NavBar } from './components/NavBar';
import { GlobalHeader } from './components/GlobalHeader';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Admin from './pages/Admin';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseProjects from './pages/CourseProjects';
import CourseDashboard from './pages/CourseDashboard';
import CourseSettings from './pages/CourseSettings';
import LoginCard from './components/LoginCard';

function AppContent() {
  const location = useLocation();
  
  // Don't show navigation on login page, main courses page, or course detail pages
  // Navigation will be handled within the course detail page itself
  const shouldShowNav = location.pathname !== '/login' && 
                       location.pathname !== '/courses' &&
                       !location.pathname.startsWith('/courses/');

  return (
    <div className="min-h-svh">
      {/* Global Header - Always visible except on login page */}
      <GlobalHeader />
      
      {shouldShowNav && <NavBar />}
      <main className="mx-auto max-w-6xl">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/projects" element={<CourseProjects />} />
          <Route path="/courses/:courseId/dashboard" element={<CourseDashboard />} />
          <Route path="/courses/:courseId/settings" element={<CourseSettings />} />
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
