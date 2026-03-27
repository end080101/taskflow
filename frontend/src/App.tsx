import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import Dashboard from '@/pages/dashboard'
import Tasks from '@/pages/tasks'
import Scripts from '@/pages/scripts'
import Logs from '@/pages/logs'
import Envs from '@/pages/envs'
import Dependencies from '@/pages/dependencies'
import Subscriptions from '@/pages/subscriptions'
import Settings from '@/pages/settings'
import Login from '@/pages/login'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="scripts" element={<Scripts />} />
            <Route path="logs" element={<Logs />} />
            <Route path="envs" element={<Envs />} />
            <Route path="dependencies" element={<Dependencies />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
