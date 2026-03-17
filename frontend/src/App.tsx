import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'

// Pages
import LandingPage      from './pages/Landing'
import LoginPage        from './pages/Login'
import RegisterPage     from './pages/Register'
import DashboardLayout  from './pages/dashboard/Layout'
import DashboardHome    from './pages/dashboard/Home'
import AgentsPage       from './pages/dashboard/Agents'
import AgentDetailPage  from './pages/dashboard/AgentDetail'
import ApiKeysPage      from './pages/dashboard/ApiKeys'
import BillingPage      from './pages/dashboard/Billing'
import SettingsPage     from './pages/dashboard/Settings'
import UsagePage        from './pages/dashboard/Usage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Dashboard — protected */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index              element={<DashboardHome />} />
        <Route path="agents"      element={<AgentsPage />} />
        <Route path="agents/:id"  element={<AgentDetailPage />} />
        <Route path="api-keys"    element={<ApiKeysPage />} />
        <Route path="billing"     element={<BillingPage />} />
        <Route path="usage"       element={<UsagePage />} />
        <Route path="settings"    element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
