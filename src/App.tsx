import './App.css';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { QueryErrorBoundary } from './components/ErrorBoundary';
// import LoginCard from './components/LoginCard';
// import { useAuth } from "@/hooks/useAuth";
import { NavBar } from './components/NavBar';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';

// const { isAuthenticated } = useAuth();

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <QueryErrorBoundary>
          <BrowserRouter>
            {/* {isAuthenticated ? <AppShell /> : <LoginCard />} */}
            <div className="min-h-svh">
              <NavBar />
              <main className="mx-auto max-w-6xl px-4 py-6">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </main>
            </div>
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
