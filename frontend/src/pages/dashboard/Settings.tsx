import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth'
import api from '../../lib/api'

export default function SettingsPage() {
  const { user, refreshUser } = useAuthStore()

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: user?.name || '', company: user?.company || '' },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/me', data),
    onSuccess: () => refreshUser(),
  })

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="tag mb-1">// ACCOUNT CONFIGURATION</p>
        <h1 className="section-title text-2xl">Settings</h1>
      </div>

      {/* Profile */}
      <div className="card mb-6">
        <p className="tag mb-4">// PROFILE</p>
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tag block mb-2">FULL NAME</label>
              <input {...register('name')} className="input-field" />
            </div>
            <div>
              <label className="tag block mb-2">COMPANY</label>
              <input {...register('company')} className="input-field" />
            </div>
          </div>
          <div>
            <label className="tag block mb-2">EMAIL (READ-ONLY)</label>
            <input value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>

      {/* Security */}
      <div className="card mb-6">
        <p className="tag mb-4">// SECURITY</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-blue-mid rounded">
            <div>
              <p className="text-xs text-white">Password</p>
              <p className="text-xs text-blue-glow/40">Last changed: unknown</p>
            </div>
            <button className="btn-outline text-xs py-2 px-4">CHANGE</button>
          </div>
          <div className="flex items-center justify-between p-3 border border-blue-mid rounded">
            <div>
              <p className="text-xs text-white">Two-Factor Authentication</p>
              <p className="text-xs text-blue-glow/40">Adds an extra layer of security</p>
            </div>
            <button className="btn-outline text-xs py-2 px-4">ENABLE</button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-500/20">
        <p className="text-xs text-red-400 tracking-widest mb-4">// DANGER ZONE</p>
        <div className="flex items-center justify-between p-3 border border-red-500/20 rounded bg-red-500/5">
          <div>
            <p className="text-xs text-white">Delete Account</p>
            <p className="text-xs text-blue-glow/40">Permanently delete your account and all data</p>
          </div>
          <button className="text-xs border border-red-500/40 text-red-400 px-4 py-2 rounded hover:bg-red-500/10 transition-colors">
            DELETE
          </button>
        </div>
      </div>
    </div>
  )
}
