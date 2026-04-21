import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import api from '@/lib/api'
import type { Session } from '@/types'
import { cn, formatDate, formatDuration, statusConfig, interviewTypeLabel, providerLabel } from '@/lib/utils'

export default function SessionsPage() {
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sessions', 'all'],
    queryFn: async () => (await api.get('/sessions?limit=100')).data,
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">All Sessions</h1>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <History size={28} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No sessions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session, i) => {
            const st = statusConfig(session.status)
            const href = session.status === 'completed'
              ? `/sessions/${session.id}/report`
              : `/interview/${session.id}`
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={href}>
                  <div className="card px-4 py-3 flex items-center gap-4 hover:border-white/10 transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{interviewTypeLabel(session.interview_type)} Interview</span>
                        <span className={cn('badge border', st.color)}>{st.label}</span>
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">
                        {providerLabel(session.llm_provider)} · {formatDate(session.created_at)}
                        {session.duration_seconds ? ` · ${formatDuration(session.duration_seconds)}` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}