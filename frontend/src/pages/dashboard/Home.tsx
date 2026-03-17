import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bot, Zap, Key, TrendingUp, Plus, ArrowRight, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../../store/auth'
import api from '../../lib/api'

// Fake chart data until real usage kicks in
const mockUsage = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  tokens: Math.floor(Math.random() * 5000 + 500),
  runs: Math.floor(Math.random() * 20 + 2),
}))

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user)

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get('/agents').then((r) => r.data),
  })

  const { data: keys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/keys').then((r) => r.data),
  })

  const stats = [
    { label: 'ACTIVE AGENTS',  value: agents?.filter((a: any) => a.status === 'ACTIVE').length ?? 0, icon: Bot,       color: 'text-blue-accent' },
    { label: 'TOTAL RUNS',     value: agents?.reduce((s: number, a: any) => s + a.totalRuns, 0) ?? 0, icon: Activity,  color: 'text-cyan-400'   },
    { label: 'API KEYS',       value: keys?.length ?? 0,                                              icon: Key,       color: 'text-purple-400' },
    { label: 'TOKENS THIS MO', value: '—',                                                            icon: TrendingUp, color: 'text-green-400' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="tag mb-1">// COMMAND CENTER</p>
          <h1 className="section-title text-2xl">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-blue-glow/50 mt-1 tracking-wide">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/dashboard/agents" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          NEW AGENT
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-accent to-transparent" />
            <div className={`${color} mb-3`}><Icon className="w-5 h-5" /></div>
            <p className="section-title text-3xl mb-1">{value}</p>
            <p className="tag">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Token usage chart */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="tag mb-1">// TOKEN CONSUMPTION</p>
              <p className="text-white text-sm font-medium tracking-wide">Last 14 days</p>
            </div>
            <Link to="/dashboard/usage" className="text-xs text-blue-accent hover:text-blue-bright transition-colors flex items-center gap-1">
              DETAILS <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockUsage} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(224,242,254,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(224,242,254,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#040c14', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: '#38bdf8' }}
              />
              <Area type="monotone" dataKey="tokens" stroke="#0ea5e9" strokeWidth={2} fill="url(#tokenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Agent status */}
        <div className="card">
          <p className="tag mb-4">// AGENT STATUS</p>
          {agents?.length === 0 || !agents ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Bot className="w-8 h-8 text-blue-mid" />
              <p className="text-xs text-blue-glow/40 text-center tracking-wide">No agents deployed yet</p>
              <Link to="/dashboard/agents" className="text-xs text-blue-accent hover:text-blue-bright">
                Deploy first agent →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.slice(0, 5).map((agent: any) => (
                <div key={agent.id} className="flex items-center gap-3 p-2 rounded border border-blue-mid hover:border-blue-accent/40 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    agent.status === 'ACTIVE'  ? 'bg-green-400'  :
                    agent.status === 'PAUSED'  ? 'bg-yellow-400' :
                    agent.status === 'ERROR'   ? 'bg-red-400'    : 'bg-blue-mid'
                  }`} style={agent.status === 'ACTIVE' ? { boxShadow: '0 0 6px #4ade80' } : {}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{agent.name}</p>
                    <p className="text-xs text-blue-glow/40">{agent._count?.runs} runs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <p className="tag mb-4">// QUICK ACTIONS</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { to: '/dashboard/agents',   icon: Bot,     label: 'Create Agent',     desc: 'Deploy a new AI agent'         },
            { to: '/dashboard/api-keys', icon: Key,     label: 'Generate API Key', desc: 'Create key for API access'     },
            { to: '/dashboard/billing',  icon: Zap,     label: 'Upgrade Plan',     desc: 'Unlock more compute power'     },
            { to: '/dashboard/usage',    icon: TrendingUp, label: 'View Analytics', desc: 'Monitor usage & performance'  },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to}
              className="flex flex-col gap-2 p-4 rounded border border-blue-mid hover:border-blue-accent/50 hover:bg-blue-accent/5 transition-all group">
              <Icon className="w-5 h-5 text-blue-accent group-hover:text-blue-bright transition-colors" />
              <p className="text-xs font-medium text-white tracking-wide">{label}</p>
              <p className="text-xs text-blue-glow/40">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
