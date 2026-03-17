import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Key, Copy, Trash2, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'

export default function ApiKeysPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/keys').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/keys', { name }),
    onSuccess: (res) => {
      setCreatedKey(res.data.key)
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      setNewKeyName('')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="tag mb-1">// AUTHENTICATION</p>
          <h1 className="section-title text-2xl">API Keys</h1>
          <p className="text-xs text-blue-glow/50 mt-1 tracking-wide">
            Keys for programmatic access — format: <code className="text-blue-accent">icis_sk_...</code>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          GENERATE KEY
        </button>
      </div>

      {/* Security warning */}
      <div className="flex items-start gap-3 p-4 border border-yellow-500/30 bg-yellow-500/5 rounded mb-6">
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-400/80 tracking-wide leading-relaxed">
          API keys grant full access to your ICIS account. Never commit them to public repositories. Rotate keys regularly.
        </p>
      </div>

      {/* Keys table */}
      <div className="card overflow-hidden p-0">
        <div className="grid grid-cols-5 gap-4 px-6 py-3 border-b border-blue-mid bg-bg-3">
          {['NAME','KEY PREFIX','SCOPES','LAST USED','ACTIONS'].map((h) => (
            <p key={h} className="tag">{h}</p>
          ))}
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs text-blue-glow/40 tracking-widest">LOADING...</div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Key className="w-10 h-10 text-blue-mid" />
            <p className="text-xs text-blue-glow/40 tracking-wide">No API keys generated yet</p>
          </div>
        ) : (
          keys.map((key: any) => (
            <div key={key.id} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-blue-mid/50 hover:bg-blue-accent/3 transition-colors items-center">
              <p className="text-sm text-white font-medium">{key.name}</p>
              <code className="text-xs text-blue-accent font-mono">{key.keyPrefix}...</code>
              <div className="flex gap-1 flex-wrap">
                {key.scopes?.map((s: string) => (
                  <span key={s} className="text-xs border border-blue-mid px-2 py-0.5 rounded text-blue-glow/60">{s}</span>
                ))}
              </div>
              <p className="text-xs text-blue-glow/40">
                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString('en-IN') : 'Never'}
              </p>
              <button
                onClick={() => revokeMutation.mutate(key.id)}
                className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                REVOKE
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && !createdKey && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md card">
              <p className="tag mb-2">// GENERATE KEY</p>
              <h2 className="section-title text-xl mb-6">New API Key</h2>
              <div className="space-y-4">
                <div>
                  <label className="tag block mb-2">KEY NAME *</label>
                  <input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Production Key, Dev Key..."
                    className="input-field"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCreate(false)} className="btn-outline flex-1">CANCEL</button>
                  <button
                    onClick={() => createMutation.mutate(newKeyName)}
                    disabled={!newKeyName || createMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {createMutation.isPending ? 'GENERATING...' : 'GENERATE'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Show new key — one time only */}
        {createdKey && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-lg card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                <p className="tag">// KEY GENERATED</p>
              </div>
              <h2 className="section-title text-xl mb-2">Save your API key</h2>
              <p className="text-xs text-yellow-400 mb-6 tracking-wide">
                ⚠ This key will NOT be shown again. Copy it now and store it securely.
              </p>

              <div className="flex items-center gap-2 p-4 bg-bg-3 border border-blue-accent/30 rounded mb-6">
                <code className="flex-1 text-xs text-blue-bright font-mono break-all">{createdKey}</code>
                <button onClick={() => copyKey(createdKey)} className="flex-shrink-0 text-blue-accent hover:text-blue-bright transition-colors">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => { setCreatedKey(null); setShowCreate(false) }}
                className="btn-primary w-full"
              >
                {copied ? 'KEY COPIED — DONE' : 'I HAVE SAVED MY KEY'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
