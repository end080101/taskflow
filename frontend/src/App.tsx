import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from '@/pages/dashboard';
import Tasks from '@/pages/tasks';
import Scripts from '@/pages/scripts';
import Logs from '@/pages/logs';
import Envs from '@/pages/envs';
import Dependencies from '@/pages/dependencies';
import Settings from '@/pages/settings';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="scripts" element={<Scripts />} />
            <Route path="logs" element={<Logs />} />
            <Route path="envs" element={<Envs />} />
            <Route path="dependencies" element={<Dependencies />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
