import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Bot, Play, Pause, Trash2, ArrowRight, Search, Filter } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../../lib/api'

const AGENT_TYPES = ['TASK_AGENT','RESEARCH_AGENT','CODE_AGENT','DATA_AGENT','CHAT_AGENT','CUSTOM']
const STATUS_COLOR: Record<string, string> = {
  ACTIVE:   'bg-green-400',
  PAUSED:   'bg-yellow-400',
  TRAINING: 'bg-blue-accent',
  ERROR:    'bg-red-400',
  ARCHIVED: 'bg-blue-mid',
}

export default function AgentsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get('/agents').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/agents', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); setShowCreate(false); reset() },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: any) => api.patch(`/agents/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const filtered = agents.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="tag mb-1">// AGENT FLEET</p>
          <h1 className="section-title text-2xl">AI Agents</h1>
          <p className="text-xs text-blue-glow/50 mt-1 tracking-wide">{agents.length} agents deployed</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          DEPLOY AGENT
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-glow/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="input-field pl-9"
          />
        </div>
        <button className="btn-outline flex items-center gap-2">
          <Filter className="w-4 h-4" />
          FILTER
        </button>
      </div>

      {/* Agents grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-40" style={{ background: '#061220' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-4">
          <Bot className="w-12 h-12 text-blue-mid" />
          <p className="text-white text-sm tracking-wide">No agents deployed yet</p>
          <p className="text-xs text-blue-glow/40">Deploy your first AI agent to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
            DEPLOY FIRST AGENT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((agent: any) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card group hover:border-blue-accent/50 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLOR[agent.status] || 'bg-blue-mid'}`}
                      style={agent.status === 'ACTIVE' ? { boxShadow: '0 0 6px #4ade80' } : {}} />
                    <span className="text-xs text-blue-glow/50 tracking-widest">{agent.status}</span>
                  </div>
                  <span className="text-xs text-blue-accent border border-blue-accent/20 px-2 py-0.5 rounded">
                    {agent.type.replace('_', ' ')}
                  </span>
                </div>

                <Bot className="w-6 h-6 text-blue-accent mb-3" />
                <h3 className="text-white font-medium text-sm mb-1 tracking-wide">{agent.name}</h3>
                <p className="text-xs text-blue-glow/40 mb-4 line-clamp-2">{agent.description || 'No description'}</p>

                <div className="flex items-center justify-between text-xs text-blue-glow/40 mb-4">
                  <span>{agent.totalRuns} runs</span>
                  <span>{agent.successRuns} successful</span>
                </div>

                <div className="flex gap-2">
                  <Link to={`/dashboard/agents/${agent.id}`}
                    className="flex-1 text-center py-2 text-xs border border-blue-mid hover:border-blue-accent text-blue-glow/60 hover:text-blue-bright rounded transition-all tracking-widest flex items-center justify-center gap-1">
                    MANAGE <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => toggleMutation.mutate({ id: agent.id, status: agent.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })}
                    className="p-2 border border-blue-mid hover:border-yellow-400/50 rounded text-blue-glow/40 hover:text-yellow-400 transition-all"
                  >
                    {agent.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Agent Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg card"
            >
              <p className="tag mb-2">// DEPLOY NEW AGENT</p>
              <h2 className="section-title text-xl mb-6">Configure Agent</h2>

              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="tag block mb-2">AGENT NAME *</label>
                  <input {...register('name', { required: true })} placeholder="My Research Agent" className="input-field" />
                </div>

                <div>
                  <label className="tag block mb-2">DESCRIPTION</label>
                  <textarea {...register('description')} placeholder="What does this agent do?" className="input-field resize-none h-20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="tag block mb-2">AGENT TYPE</label>
                    <select {...register('type')} className="input-field">
                      {AGENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="tag block mb-2">MODEL</label>
                    <select {...register('config.model')} className="input-field">
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                      <option value="claude-opus-4">Claude Opus 4</option>
                      <option value="claude-haiku-4">Claude Haiku 4</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="tag block mb-2">SYSTEM PROMPT</label>
                  <textarea {...register('config.systemPrompt')} placeholder="You are a helpful AI agent that..." className="input-field resize-none h-24" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-outline flex-1">CANCEL</button>
                  <button type="submit" disabled={isSubmitting || createMutation.isPending} className="btn-primary flex-1">
                    {createMutation.isPending ? 'DEPLOYING...' : 'DEPLOY AGENT'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
