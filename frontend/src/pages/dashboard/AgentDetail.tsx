import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Bot, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import api from '../../lib/api'

const STATUS_ICON: Record<string, any> = {
  completed: CheckCircle,
  failed:    XCircle,
  running:   Loader,
}
const STATUS_COLOR: Record<string, string> = {
  completed: 'text-green-400',
  failed:    'text-red-400',
  running:   'text-blue-accent',
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [runOutput, setRunOutput] = useState<any>(null)

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => api.get(`/agents/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const runMutation = useMutation({
    mutationFn: () => api.post(`/agents/${id}/run`, { input }),
    onSuccess: (res) => {
      setRunOutput(res.data)
      setInput('')
      setTimeout(() => qc.invalidateQueries({ queryKey: ['agent', id] }), 1500)
    },
  })

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-blue-glow/50 text-xs">
      <Loader className="w-4 h-4 animate-spin" /> LOADING AGENT...
    </div>
  )
  if (!agent) return <div className="p-8 text-red-400 text-xs">Agent not found</div>

  return (
    <div className="p-8">
      {/* Back */}
      <Link to="/dashboard/agents" className="flex items-center gap-2 text-xs text-blue-glow/50 hover:text-blue-bright transition-colors mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" /> BACK TO AGENTS
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg border border-blue-accent/40 bg-blue-accent/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-accent" />
          </div>
          <div>
            <h1 className="section-title text-2xl">{agent.name}</h1>
            <p className="text-xs text-blue-glow/50 mt-1">{agent.description || 'No description'}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs border border-blue-mid px-2 py-0.5 rounded text-blue-glow/60">{agent.type}</span>
              <span className={`text-xs flex items-center gap-1 ${
                agent.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                {agent.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          {[
            { label: 'TOTAL RUNS',   value: agent.totalRuns  },
            { label: 'SUCCESSFUL',   value: agent.successRuns },
            { label: 'SUCCESS RATE', value: agent.totalRuns ? `${Math.round(agent.successRuns / agent.totalRuns * 100)}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="text-right">
              <p className="section-title text-2xl">{value}</p>
              <p className="tag">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Run agent */}
        <div className="card">
          <p className="tag mb-4">// RUN AGENT</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter task or prompt for this agent..."
            className="input-field resize-none h-32 mb-4"
          />
          <button
            onClick={() => runMutation.mutate()}
            disabled={!input.trim() || runMutation.isPending || agent.status !== 'ACTIVE'}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {runMutation.isPending ? (
              <><Loader className="w-4 h-4 animate-spin" /> RUNNING...</>
            ) : (
              <><Play className="w-4 h-4" /> EXECUTE AGENT</>
            )}
          </button>

          {runOutput && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-bg-3 border border-green-500/20 rounded"
            >
              <p className="tag text-green-400 mb-2">// RUN INITIATED</p>
              <p className="text-xs text-blue-glow/70">Run ID: <span className="text-blue-accent">{runOutput.run?.id}</span></p>
              <p className="text-xs text-blue-glow/50 mt-1">Processing in background...</p>
            </motion.div>
          )}
        </div>

        {/* Config */}
        <div className="card">
          <p className="tag mb-4">// CONFIGURATION</p>
          <div className="space-y-3">
            {[
              { k: 'MODEL',          v: agent.config?.model || 'claude-sonnet-4-20250514' },
              { k: 'TEMPERATURE',    v: agent.config?.temperature ?? 0.7 },
              { k: 'MAX TOKENS',     v: agent.config?.maxTokens ?? 4096 },
              { k: 'MEMORY',         v: agent.config?.memoryEnabled ? 'ENABLED' : 'DISABLED' },
              { k: 'CREATED',        v: new Date(agent.createdAt).toLocaleDateString('en-IN') },
            ].map(({ k, v }) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-blue-mid/50">
                <span className="tag">{k}</span>
                <span className="text-xs text-white font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Run history */}
      <div className="card mt-6">
        <p className="tag mb-4">// RUN HISTORY</p>
        {!agent.runs?.length ? (
          <p className="text-xs text-blue-glow/40 text-center py-8">No runs yet. Execute the agent above.</p>
        ) : (
          <div className="space-y-2">
            {agent.runs.map((run: any) => {
              const Icon = STATUS_ICON[run.status] || Clock
              return (
                <div key={run.id} className="flex items-center gap-4 p-3 rounded border border-blue-mid hover:border-blue-accent/30 transition-colors">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${STATUS_COLOR[run.status] || 'text-blue-glow/50'} ${run.status === 'running' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-glow/60 truncate">{JSON.stringify(run.input)?.slice(0, 80)}...</p>
                  </div>
                  <span className="text-xs text-blue-glow/40">{run.tokensUsed} tokens</span>
                  <span className="text-xs text-blue-glow/40">{run.durationMs ? `${run.durationMs}ms` : '—'}</span>
                  <span className="text-xs text-blue-glow/40">{new Date(run.createdAt).toLocaleTimeString('en-IN')}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
