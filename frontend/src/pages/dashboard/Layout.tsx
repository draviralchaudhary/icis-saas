import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Bot, Key, CreditCard,
  BarChart3, Settings, LogOut, Zap, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'

const navItems = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Overview',   end: true },
  { to: '/dashboard/agents',   icon: Bot,             label: 'AI Agents'  },
  { to: '/dashboard/api-keys', icon: Key,             label: 'API Keys'   },
  { to: '/dashboard/usage',    icon: BarChart3,       label: 'Usage'      },
  { to: '/dashboard/billing',  icon: CreditCard,      label: 'Billing'    },
  { to: '/dashboard/settings', icon: Settings,        label: 'Settings'   },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-blue-mid bg-bg-2">
        {/* Logo */}
        <div className="p-6 border-b border-blue-mid">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-blue-accent rounded flex items-center justify-center text-blue-bright text-xs font-bold"
              style={{ boxShadow: '0 0 10px rgba(14,165,233,0.3)' }}>
              ICIS
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-white">ICIS</p>
              <p className="text-xs text-blue-glow/40 tracking-widest">PLATFORM</p>
            </div>
          </div>
        </div>

        {/* Plan badge */}
        <div className="mx-4 mt-4 px-3 py-2 border border-blue-accent/30 rounded bg-blue-accent/5 flex items-center gap-2">
          <Zap className="w-3 h-3 text-blue-accent" />
          <span className="text-xs text-blue-accent tracking-widest">
            {user?.organization?.plan || 'FREE'} PLAN
          </span>
          <ChevronRight className="w-3 h-3 text-blue-accent ml-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 mt-2">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-widest transition-all ${
                  isActive
                    ? 'bg-blue-accent/10 text-blue-bright border border-blue-accent/30'
                    : 'text-blue-glow/50 hover:text-blue-glow hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-blue-mid">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-accent/20 border border-blue-accent/40 flex items-center justify-center text-xs font-bold text-blue-bright">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-blue-glow/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-blue-glow/50 hover:text-red-400 transition-colors rounded hover:bg-red-500/5 tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
