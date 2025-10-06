import './App.css';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { QueryErrorBoundary } from './components/ErrorBoundary';
// import LoginCard from './components/LoginCard';
// import { useAuth } from "@/hooks/useAuth";
import { NavBar } from './components/NavBar';


// const { isAuthenticated } = useAuth();

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <QueryErrorBoundary>
          {/* {isAuthenticated ? <AppShell /> : <LoginCard />} */}
          <NavBar />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
