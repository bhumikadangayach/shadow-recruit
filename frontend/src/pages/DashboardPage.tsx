import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Zap, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Session } from '@/types'
import {
  cn, formatDate, formatDuration,
  statusConfig, interviewTypeLabel, providerLabel
} from '@/lib/utils'

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 mb-1">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon size={16} />
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await api.get('/sessions?limit=20')
      return data
    },
  })

  const completed = sessions.filter((s) => s.status === 'completed')
  const inProgress = sessions.filter((s) => s.status === 'in_progress')
  const avgDuration = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / completed.length)
    : 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">
            Good day, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Ready for your next mock interview?</p>
        </div>
        <Link to="/interview/new">
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            New Interview
          </motion.button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Sessions" value={sessions.length} icon={Zap} color="bg-brand-600/15 text-brand-400" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard label="In Progress" value={inProgress.length} icon={TrendingUp} color="bg-amber-500/15 text-amber-400" />
        <StatCard label="Avg Duration" value={formatDuration(avgDuration)} icon={Clock} color="bg-purple-500/15 text-purple-400" />
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-sm font-medium text-white/60 mb-3">Recent Sessions</h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="card h-16 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="card p-10 text-center">
            <Zap size={28} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No sessions yet.</p>
            <Link to="/interview/new">
              <button className="btn-primary mt-4 text-sm">Start your first interview</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 8).map((session, i) => {
              const st = statusConfig(session.status)
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={
                      session.status === 'completed'
                        ? `/sessions/${session.id}/report`
                        : session.status === 'in_progress'
                        ? `/interview/${session.id}`
                        : `/interview/${session.id}`
                    }
                  >
                    <div className="card px-4 py-3 flex items-center gap-4 hover:border-white/10 hover:bg-surface-100/50 transition-all cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {interviewTypeLabel(session.interview_type)} Interview
                          </span>
                          <span className={cn('badge border', st.color)}>{st.label}</span>
                        </div>
                        <p className="text-xs text-white/30 mt-0.5">
                          {providerLabel(session.llm_provider)} · {formatDate(session.created_at)}
                          {session.duration_seconds ? ` · ${formatDuration(session.duration_seconds)}` : ''}
                        </p>
                      </div>
                      {session.status === 'pending' && (
                        <span className="text-xs text-brand-400 font-medium">Continue →</span>
                      )}
                      {session.status === 'completed' && (
                        <span className="text-xs text-white/30">View report →</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
