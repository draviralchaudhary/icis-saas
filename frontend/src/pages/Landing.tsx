import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../lib/api'
import AiChat from "../components/AiChat";

const ContactSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  company:  z.string().optional(),
  phone:    z.string().optional(),
  interest: z.string().min(1),
  message:  z.string().min(10),
})
type ContactForm = z.infer<typeof ContactSchema>

const services = [
  { icon: '🤖', name: 'Autonomous AI Agents',     tag: 'CORE',           desc: 'Goal-driven agents that perceive, reason, plan, and execute multi-step tasks with minimal human oversight.' },
  { icon: '🧠', name: 'Cognitive SaaS Platform',  tag: 'SAAS',           desc: 'Cloud-native SaaS layer that lets enterprises embed AI cognition into existing workflows via REST APIs.' },
  { icon: '⚡', name: 'AI Supercompute Fabric',   tag: 'INFRASTRUCTURE', desc: 'Distributed GPU/TPU compute optimised for LLM inference, fine-tuning, and large-scale agent orchestration.' },
  { icon: '🔗', name: 'Multi-Agent Orchestration',tag: 'ENTERPRISE',     desc: 'Coordinate fleets of specialised sub-agents. Hierarchical planning, delegation, and feedback loops baked in.' },
  { icon: '📊', name: 'RAG & Knowledge Engines',  tag: 'DATA AI',        desc: 'Retrieval-Augmented Generation pipelines connected to your data lakes for real-time grounded knowledge.' },
  { icon: '🛡️', name: 'AI Safety & Alignment',   tag: 'GOVERNANCE',     desc: 'Built-in guardrails, policy enforcement, and audit trails ensuring agents act within defined boundaries.' },
]

const steps = [
  { num: '01', title: 'Discovery & Cognitive Mapping', text: 'We audit your existing workflows, data sources, and bottlenecks — then map where autonomous agents deliver the highest ROI.' },
  { num: '02', title: 'Agent Design & Model Selection', text: 'Select and fine-tune optimal foundation models, design tool-use schemas, memory architecture, and define success metrics.' },
  { num: '03', title: 'Build, Train & Stress-Test',     text: 'Agents are built on our supercompute fabric, run through red-team adversarial scenarios, and benchmarked against agreed KPIs.' },
  { num: '04', title: 'Deploy, Monitor & Evolve',       text: 'One-click deployment to our SaaS platform. Real-time dashboards, automated feedback loops, and continuous model updates.' },
]

function FadeUp({ children, delay = 0 }: any) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay }}>
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactForm>({ resolver: zodResolver(ContactSchema) })

  const onSubmit = async (data: ContactForm) => {
    try {
      await api.post('/contact', data)
      setSubmitted(true)
    } catch { /* show error */ }
  }

  // Ticker
  const tickers = ['AI Agent Deployment','Cognitive Automation','Neural Infrastructure','SaaS Intelligence Layer','Supercompute Fabric','Multi-Agent Orchestration']

  return (
    <div className="min-h-screen bg-bg font-mono overflow-x-hidden">
      {/* Grid bg */}
      <div className="fixed inset-0 grid-bg opacity-60 pointer-events-none" />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4"
        style={{ background: 'rgba(2,4,8,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(14,165,233,0.18)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-blue-accent rounded flex items-center justify-center text-blue-bright text-xs font-bold"
            style={{ boxShadow: '0 0 12px rgba(14,165,233,0.35)' }}>
            ICIS
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-white">ICIS</p>
            <p className="text-xs text-blue-glow/40 tracking-widest" style={{ fontSize: 9 }}>INTELLIGENCE SYSTEM</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['about','services','process','contact'].map((s) => (
            <a key={s} href={`#${s}`} className="text-xs tracking-widest text-blue-glow/50 hover:text-blue-bright transition-colors">
              {s.toUpperCase()}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"    className="text-xs tracking-widest text-blue-glow/60 hover:text-blue-bright transition-colors">SIGN IN</Link>
          <Link to="/register" className="btn-primary text-xs">GET STARTED</Link>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div className="mt-[73px] overflow-hidden border-b" style={{ background: '#040c14', borderColor: 'rgba(14,165,233,0.18)', padding: '10px 0' }}>
        <div className="flex gap-16 whitespace-nowrap animate-marquee w-max">
          {[...tickers,...tickers].map((t, i) => (
            <span key={i} className="text-xs tracking-widest text-blue-glow/40">
              {t} <span className="text-blue-accent mx-4">//</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center px-12 overflow-hidden" id="home">
        {/* Glow orb */}
        <div className="absolute top-12 right-8 w-72 h-72 rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle at 35% 35%, rgba(56,189,248,0.3), transparent 70%)', border: '1px solid rgba(14,165,233,0.15)' }} />

        <div className="relative z-10 max-w-3xl">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }}>
            <div className="inline-flex items-center gap-2 border px-4 py-2 rounded-sm mb-8 text-xs tracking-widest text-blue-accent"
              style={{ borderColor: 'rgba(14,165,233,0.4)', background: 'rgba(14,165,233,0.06)' }}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 6px #06b6d4' }} />
              INDIA'S AGENTIC AI FRONTIER — EST. 2024
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15, duration:.6 }}
            className="text-6xl xl:text-7xl font-normal leading-tight mb-6" style={{ fontFamily: 'Syne Mono, monospace' }}>
            Indian<br/>
            <span className="text-blue-accent" style={{ textShadow: '0 0 30px rgba(14,165,233,0.5)' }}>Cognitive</span><br/>
            Intelligence<br/>
            System
          </motion.h1>

          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3, duration:.6 }}
            className="text-sm leading-loose text-blue-glow/60 max-w-lg mb-10 tracking-wide">
            We build autonomous AI agents and supercompute infrastructure that think, plan, and act — transforming enterprise workflows into self-optimising intelligent systems delivered as SaaS.
          </motion.p>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.45, duration:.6 }}
            className="flex flex-wrap gap-4 mb-12">
            <Link to="/register" className="btn-primary">START BUILDING FREE</Link>
            <a href="#services" className="btn-outline">EXPLORE PLATFORM</a>
          </motion.div>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.6, duration:.6 }}
            className="flex gap-10">
            {[['50+','AI AGENTS BUILT'],['∞','SCALABILITY'],['24/7','AUTONOMOUS OPS']].map(([n,l]) => (
              <div key={l}>
                <p className="text-3xl text-blue-bright" style={{ fontFamily:'Syne Mono,monospace', textShadow:'0 0 20px rgba(56,189,248,0.4)' }}>{n}</p>
                <p className="text-xs tracking-widest text-blue-glow/40 mt-1">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="border-t" style={{ borderColor: 'rgba(14,165,233,0.18)', background: '#040c14' }}>
        <div className="max-w-7xl mx-auto px-12 py-24">
          <FadeUp>
            <p className="tag mb-2">// PRODUCTS & SERVICES</p>
            <h2 className="section-title text-4xl mb-4">What we build</h2>
            <p className="text-sm text-blue-glow/50 max-w-xl mb-16 leading-loose">
              A full-stack AI SaaS platform spanning autonomous agents, enterprise integrations, and bare-metal supercompute — all API-first.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px border" style={{ borderColor: 'rgba(14,165,233,0.18)' }}>
            {services.map((s, i) => (
              <FadeUp key={s.name} delay={i * 0.08}>
                <div className="p-8 bg-bg-2 border-r border-b h-full group hover:bg-bg-3 transition-colors relative overflow-hidden"
                  style={{ borderColor: 'rgba(14,165,233,0.12)' }}>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-accent to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  <div className="text-2xl mb-4">{s.icon}</div>
                  <p className="text-white font-medium text-sm mb-2 tracking-wide">{s.name}</p>
                  <p className="text-xs text-blue-glow/50 leading-relaxed mb-4">{s.desc}</p>
                  <span className="text-xs border px-3 py-1 rounded-sm" style={{ borderColor:'rgba(14,165,233,0.3)', color:'#0ea5e9' }}>{s.tag}</span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="process">
        <div className="max-w-7xl mx-auto px-12 py-24">
          <FadeUp>
            <p className="tag mb-2">// HOW IT WORKS</p>
            <h2 className="section-title text-4xl mb-4">From idea to<br/>intelligent agent</h2>
            <p className="text-sm text-blue-glow/50 max-w-xl mb-16 leading-loose">
              Our four-phase delivery process ensures your AI system goes live fast, learns continuously, and scales without friction.
            </p>
          </FadeUp>
          <div className="border-t" style={{ borderColor: 'rgba(14,165,233,0.18)' }}>
            {steps.map((s, i) => (
              <FadeUp key={s.num} delay={i * 0.1}>
                <div className="grid grid-cols-12 gap-8 py-10 border-b" style={{ borderColor: 'rgba(14,165,233,0.18)' }}>
                  <p className="col-span-1 tag text-sm pt-1">{s.num} /</p>
                  <div className="col-span-11">
                    <h3 className="text-white font-medium text-lg mb-3 tracking-wide">{s.title}</h3>
                    <p className="text-sm text-blue-glow/50 leading-loose max-w-2xl">{s.text}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="border-t" style={{ borderColor: 'rgba(14,165,233,0.18)', background: '#040c14' }}>
        <div className="max-w-7xl mx-auto px-12 py-24">
          <div className="grid grid-cols-2 gap-20">
            <FadeUp>
              <p className="tag mb-2">// CONNECT WITH US</p>
              <h2 className="section-title text-4xl mb-6">Let's build<br/>intelligence together</h2>
              <p className="text-sm text-blue-glow/50 leading-loose mb-10">
                Whether you're a startup looking to add AI agents or an enterprise ready to automate at scale — our team is ready to architect the right solution.
              </p>
              <div className="space-y-5">
                {[
                  { icon: '📍', label: 'HEADQUARTERS', value: 'Dehradun, Uttarakhand, India' },
                  { icon: '📧', label: 'EMAIL',         value: 'hello@icis.ai' },
                  { icon: '📞', label: 'PHONE',         value: '+91 98765 43210' },
                  { icon: '🌐', label: 'WEBSITE',        value: 'www.icis.ai' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex gap-4 items-start">
                    <div className="w-9 h-9 flex-shrink-0 border rounded flex items-center justify-center text-lg"
                      style={{ borderColor: 'rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)' }}>{icon}</div>
                    <div>
                      <p className="tag mb-1">{label}</p>
                      <p className="text-xs text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="card">
                <p className="tag mb-6">// SEND A QUERY</p>
                {submitted ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-4">✓</p>
                    <p className="text-white font-medium mb-2">Query received.</p>
                    <p className="text-xs text-blue-glow/50">Our AI architects will reach out within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="tag block mb-2">FULL NAME *</label>
                        <input {...register('name')} placeholder="Your name" className="input-field" />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="tag block mb-2">EMAIL *</label>
                        <input {...register('email')} type="email" placeholder="you@company.com" className="input-field" />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="tag block mb-2">COMPANY</label>
                        <input {...register('company')} placeholder="Company name" className="input-field" />
                      </div>
                      <div>
                        <label className="tag block mb-2">PHONE</label>
                        <input {...register('phone')} placeholder="+91 XXXXX XXXXX" className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="tag block mb-2">INTEREST AREA *</label>
                      <select {...register('interest')} className="input-field">
                        <option value="">Select a service</option>
                        <option>Autonomous AI Agents</option>
                        <option>Cognitive SaaS Platform</option>
                        <option>AI Supercompute Infrastructure</option>
                        <option>Multi-Agent Orchestration</option>
                        <option>Partnership / Investment</option>
                      </select>
                    </div>
                    <div>
                      <label className="tag block mb-2">MESSAGE *</label>
                      <textarea {...register('message')} placeholder="Describe your use case..." className="input-field resize-none h-24" />
                      {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>}
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                      {isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT QUERY →'}
                    </button>
                  </form>
                )}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t px-12 py-12" style={{ borderColor: 'rgba(14,165,233,0.18)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-10 mb-10 pb-10 border-b" style={{ borderColor: 'rgba(14,165,233,0.18)' }}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 border border-blue-accent rounded flex items-center justify-center text-blue-bright text-xs font-bold"
                style={{ boxShadow: '0 0 10px rgba(14,165,233,0.3)' }}>ICIS</div>
              <div>
                <p className="text-xs font-bold tracking-widest">ICIS</p>
                <p className="tracking-widest text-blue-glow/40" style={{ fontSize: 9 }}>INTELLIGENCE SYSTEM</p>
              </div>
            </div>
            <p className="text-xs text-blue-glow/40 leading-relaxed">
              Indian Cognitive Intelligence System — building the autonomous AI infrastructure of tomorrow, in India, for the world.
            </p>
          </div>
          {[
            { title: 'PRODUCTS',  links: ['AI Agents','SaaS Platform','Supercompute','Orchestration','RAG Engine'] },
            { title: 'COMPANY',   links: ['About ICIS','Careers','Blog','Press Kit','Privacy Policy'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="tag mb-4">{title}</p>
              <div className="space-y-2">
                {links.map((l) => <a key={l} href="#" className="block text-xs text-blue-glow/50 hover:text-blue-bright transition-colors">{l}</a>)}
              </div>
            </div>
          ))}
          <div>
            <p className="tag mb-4">CONTACT</p>
            <div className="space-y-3 text-xs text-blue-glow/50">
              <p>📍 Dehradun, Uttarakhand, India — 248001</p>
              <p>📧 hello@icis.ai</p>
              <p>📧 support@icis.ai</p>
              <p>📞 +91 98765 43210</p>
              <p>🌐 www.icis.ai</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs text-blue-glow/30 tracking-wide">© 2024 INDIAN COGNITIVE INTELLIGENCE SYSTEM PVT. LTD.</p>
          <div className="flex gap-3">
            {['in','𝕏','gh','yt'].map((s) => (
              <a key={s} href="#" className="w-8 h-8 border rounded flex items-center justify-center text-xs text-blue-glow/40 hover:text-blue-bright hover:border-blue-accent transition-all"
                style={{ borderColor: 'rgba(14,165,233,0.2)' }}>{s}</a>
            ))}
          </div>
        </div>
      </footer>

{/* 🔥 AI CHAT WIDGET */}
<AiChat />

</div>
)