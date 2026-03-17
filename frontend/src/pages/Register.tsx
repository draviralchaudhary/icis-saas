import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/auth'

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  company:  z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const register_ = useAuthStore((s) => s.register)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      await register_({ name: data.name, email: data.email, password: data.password, company: data.company })
      navigate('/dashboard')
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg grid-bg flex items-center justify-center px-4 py-12">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(14,165,233,0.1) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 border border-blue-accent rounded flex items-center justify-center text-blue-bright text-xs font-bold"
            style={{ boxShadow: '0 0 12px rgba(14,165,233,0.35)' }}>
            ICIS
          </div>
          <span className="text-xs font-bold tracking-widest">INDIAN COGNITIVE INTELLIGENCE SYSTEM</span>
        </Link>

        <div className="card">
          <div className="mb-8">
            <p className="tag mb-2">// INITIALIZE ACCOUNT</p>
            <h1 className="section-title text-2xl">Create your account</h1>
            <p className="text-xs text-blue-glow/50 mt-2 tracking-wide">Start building intelligent agents in minutes</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="tag block mb-2">FULL NAME *</label>
                <input {...register('name')} placeholder="Arjun Singh" className="input-field" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="tag block mb-2">COMPANY</label>
                <input {...register('company')} placeholder="Your company" className="input-field" />
              </div>
            </div>

            <div>
              <label className="tag block mb-2">EMAIL ADDRESS *</label>
              <input {...register('email')} type="email" placeholder="you@company.com" className="input-field" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="tag block mb-2">PASSWORD *</label>
              <input {...register('password')} type="password" placeholder="Min. 8 characters" className="input-field" />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="tag block mb-2">CONFIRM PASSWORD *</label>
              <input {...register('confirm')} type="password" placeholder="Repeat password" className="input-field" />
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
            </div>

            {serverError && (
              <div className="border border-red-500/30 bg-red-500/10 rounded p-3 text-red-400 text-xs">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-center">
              {isSubmitting ? 'CREATING ACCOUNT...' : 'INITIALIZE ACCOUNT →'}
            </button>

            <p className="text-center text-xs text-blue-glow/30 tracking-wide">
              By registering you agree to our{' '}
              <Link to="/terms" className="text-blue-accent hover:text-blue-bright">Terms of Service</Link>
            </p>
          </form>

          <p className="text-center text-xs text-blue-glow/50 mt-6 tracking-wide">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-accent hover:text-blue-bright transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
