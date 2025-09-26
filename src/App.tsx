import './App.css';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { QueryErrorBoundary } from './components/ErrorBoundary';
import LoginCard from './components/LoginCard';

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <QueryErrorBoundary>
          <LoginCard />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
