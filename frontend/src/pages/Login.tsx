import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/auth'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg grid-bg flex items-center justify-center px-4">
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(14,165,233,0.1) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 border border-blue-accent rounded flex items-center justify-center text-blue-bright text-xs font-bold"
            style={{ boxShadow: '0 0 12px rgba(14,165,233,0.35)' }}>
            ICIS
          </div>
          <span className="text-xs font-bold tracking-widest">INDIAN COGNITIVE INTELLIGENCE SYSTEM</span>
        </Link>

        <div className="card">
          <div className="mb-8">
            <p className="tag mb-2">// ACCESS TERMINAL</p>
            <h1 className="section-title text-2xl">Sign in to ICIS</h1>
            <p className="text-xs text-blue-glow/50 mt-2 tracking-wide">Enter your credentials to access the platform</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="tag block mb-2">EMAIL ADDRESS</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="tag block mb-2">PASSWORD</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="border border-red-500/30 bg-red-500/10 rounded p-3 text-red-400 text-xs">
                {serverError}
              </div>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-accent hover:text-blue-bright transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-center">
              {isSubmitting ? 'AUTHENTICATING...' : 'ACCESS PLATFORM →'}
            </button>
          </form>

          <p className="text-center text-xs text-blue-glow/50 mt-6 tracking-wide">
            No account?{' '}
            <Link to="/register" className="text-blue-accent hover:text-blue-bright transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
