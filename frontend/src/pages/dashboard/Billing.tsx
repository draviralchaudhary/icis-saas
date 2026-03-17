import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, Zap, ArrowRight, ExternalLink } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/auth'

export default function BillingPage() {
  const user = useAuthStore((s) => s.user)
  const [params] = useSearchParams()
  const success  = params.get('success')
  const canceled = params.get('canceled')

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/billing/plans').then((r) => r.data),
  })

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/billing/subscription').then((r) => r.data),
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/billing/invoices').then((r) => r.data),
  })

  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) => api.post('/billing/checkout', { priceId }),
    onSuccess: (res) => { window.location.href = res.data.url },
  })

  const portalMutation = useMutation({
    mutationFn: () => api.post('/billing/portal'),
    onSuccess: (res) => { window.location.href = res.data.url },
  })

  const currentPlan = user?.organization?.plan || 'FREE'

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="tag mb-1">// SUBSCRIPTION MANAGEMENT</p>
        <h1 className="section-title text-2xl">Billing & Plans</h1>
        <p className="text-xs text-blue-glow/50 mt-1 tracking-wide">
          Current plan: <span className="text-blue-accent">{currentPlan}</span>
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 border border-green-500/30 bg-green-500/5 rounded mb-6 text-xs text-green-400">
          <Check className="w-4 h-4" />
          Payment successful! Your plan has been upgraded.
        </div>
      )}
      {canceled && (
        <div className="p-4 border border-yellow-500/30 bg-yellow-500/5 rounded mb-6 text-xs text-yellow-400">
          Checkout canceled. No charges were made.
        </div>
      )}

      {/* Active subscription */}
      {subscription && (
        <div className="card mb-8 flex items-center justify-between">
          <div>
            <p className="tag mb-1">// CURRENT SUBSCRIPTION</p>
            <p className="text-white text-sm font-medium">{currentPlan} Plan</p>
            <p className="text-xs text-blue-glow/50 mt-1">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')} •{' '}
              <span className={subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>
                {subscription.status}
              </span>
            </p>
          </div>
          <button onClick={() => portalMutation.mutate()} className="btn-outline flex items-center gap-2">
            MANAGE SUBSCRIPTION <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {plans.map((plan: any, i: number) => {
          const isCurrentPlan = plan.id.toUpperCase() === currentPlan
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card relative flex flex-col ${
                plan.popular ? 'border-blue-accent' : ''
              } ${isCurrentPlan ? 'bg-blue-accent/5' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-accent text-bg text-xs font-bold px-3 py-1 rounded tracking-widest">
                  POPULAR
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute top-3 right-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                </div>
              )}

              <div className="mb-4">
                <p className="tag mb-1">{plan.id.toUpperCase()}</p>
                <h3 className="section-title text-xl">{plan.name}</h3>
              </div>

              <div className="mb-6">
                {plan.price === null ? (
                  <p className="text-2xl text-white font-mono">Custom</p>
                ) : plan.price === 0 ? (
                  <p className="text-2xl text-white font-mono">Free</p>
                ) : (
                  <div>
                    <p className="text-2xl text-white font-mono">
                      ₹{(plan.price / 100).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-blue-glow/40">/ month</p>
                  </div>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-blue-glow/70">
                    <Check className="w-3.5 h-3.5 text-blue-accent flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <button disabled className="w-full py-2.5 text-xs text-green-400 border border-green-400/30 rounded tracking-widest cursor-default">
                  ✓ CURRENT PLAN
                </button>
              ) : plan.price === null ? (
                <a href="mailto:hello@icis.ai" className="btn-outline text-center text-xs py-2.5 tracking-widest">
                  CONTACT SALES
                </a>
              ) : plan.price === 0 ? (
                <button disabled className="btn-outline text-xs py-2.5 w-full tracking-widest opacity-50 cursor-default">
                  FREE TIER
                </button>
              ) : (
                <button
                  onClick={() => checkoutMutation.mutate(plan.priceId)}
                  disabled={checkoutMutation.isPending}
                  className="btn-primary text-xs py-2.5 w-full flex items-center justify-center gap-2"
                >
                  UPGRADE <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="card">
          <p className="tag mb-4">// BILLING HISTORY</p>
          <div className="space-y-3">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 border border-blue-mid rounded hover:border-blue-accent/40 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded border ${inv.status === 'paid' ? 'border-green-500/30 text-green-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                    {inv.status?.toUpperCase()}
                  </span>
                  <span className="text-xs text-white">₹{(inv.amount / 100).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-blue-glow/40">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                {inv.pdfUrl && (
                  <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-accent hover:text-blue-bright transition-colors flex items-center gap-1">
                    PDF <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
