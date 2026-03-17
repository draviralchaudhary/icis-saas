// Usage Page
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../lib/api'

const mockDaily = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  tokens: Math.floor(Math.random() * 8000 + 200),
  cost: parseFloat((Math.random() * 2 + 0.1).toFixed(3)),
}))

export function UsagePage() {
  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: () => api.get('/usage').then((r) => r.data),
  })

  const tooltipStyle = {
    contentStyle: { background: '#040c14', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 6, fontSize: 11 },
    labelStyle: { color: '#38bdf8' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="tag mb-1">// RESOURCE TELEMETRY</p>
        <h1 className="section-title text-2xl">Usage Analytics</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'TOKENS THIS MONTH', value: usage?.currentMonth?.tokens?.toLocaleString() || '0' },
          { label: 'COST THIS MONTH',   value: `$${(usage?.currentMonth?.cost || 0).toFixed(4)}` },
          { label: 'AVG DAILY TOKENS',  value: Math.floor((usage?.currentMonth?.tokens || 0) / 30).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <p className="tag mb-2">{label}</p>
            <p className="section-title text-3xl glow-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <p className="tag mb-4">// DAILY TOKEN USAGE</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockDaily} margin={{ left: -15 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="day" tick={{ fill: 'rgba(224,242,254,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(224,242,254,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="tokens" stroke="#0ea5e9" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="tag mb-4">// DAILY COST (USD)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockDaily} margin={{ left: -15 }}>
              <CartesianGrid stroke="rgba(14,165,233,0.06)" />
              <XAxis dataKey="day" tick={{ fill: 'rgba(224,242,254,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(224,242,254,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="cost" fill="#06b6d4" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default UsagePage
