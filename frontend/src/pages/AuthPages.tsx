import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

function AuthShell({ title, sub, children }: {
  title: string; sub: string; children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center">
            <Zap size={16} className="text-brand-400" />
          </div>
          <span className="font-semibold text-sm">ShadowRecruit</span>
        </div>
        <h1 className="text-xl font-semibold text-center mb-1">{title}</h1>
        <p className="text-sm text-white/40 text-center mb-6">{sub}</p>
        {children}
      </motion.div>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const params = new URLSearchParams({ username: email, password })
      const { data } = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const me = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      setAuth(me.data, data.access_token)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email" required placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="input w-full"
        />
        <input
          type="password" required placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="input w-full"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Sign in
        </button>
      </form>
      <p className="text-center text-xs text-white/30 mt-4">
        No account?{' '}
        <Link to="/register" className="text-brand-400 hover:underline">Register</Link>
      </p>
    </AuthShell>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', { full_name: name, email, password })
      const params = new URLSearchParams({ username: email, password })
      const { data } = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const me = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      setAuth(me.data, data.access_token)
      navigate('/dashboard')
    } catch {
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create account" sub="Start practising interviews today">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text" required placeholder="Full name"
          value={name} onChange={(e) => setName(e.target.value)}
          className="input w-full"
        />
        <input
          type="email" required placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="input w-full"
        />
        <input
          type="password" required placeholder="Password" minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="input w-full"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Create account
        </button>
      </form>
      <p className="text-center text-xs text-white/30 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}