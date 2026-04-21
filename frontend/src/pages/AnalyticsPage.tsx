import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus, Brain,
  MessageSquare, Users, Zap, BarChart2, Award
} from 'lucide-react'
import api from '@/lib/api'
import { cn, scoreColor, interviewTypeLabel } from '@/lib/utils'

interface Analytics {
  total_sessions: number
  completed_sessions: number
  avg_overall_score: number
  avg_technical_score: number
  avg_communication_score: number
  avg_problem_solving_score: number
  avg_culture_fit_score: number
  score_trend: Array<{
    date: string
    overall: number
    technical: number
    communication: number
    problem_solving: number
    culture_fit: number
    interview_type: string
  }>
  type_breakdown: Record<string, number>
  improvement: number
}

const TOOLTIP_STYLE = {
  background: '#1c1c28',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  fontSize: 12,
  color: '#fff',
}

function StatCard({ label, value, icon: Icon, sub, color }: {
  label: string; value: string | number; icon: any; sub?: string; color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-white/40">{label}</p>
        <div className={cn('p-1.5 rounded-lg', color ?? 'bg-brand-600/15')}>
          <Icon size={14} className="text-brand-400" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get('/sessions/analytics/summary')).data,
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-3">
        {[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse" />)}
      </div>
    )
  }

  if (!data || data.completed_sessions === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">Analytics</h1>
        <div className="card p-12 text-center">
          <BarChart2 size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Complete at least one interview to see analytics.</p>
        </div>
      </div>
    )
  }

  const radarData = [
    { subject: 'Technical',       score: data.avg_technical_score },
    { subject: 'Communication',   score: data.avg_communication_score },
    { subject: 'Problem Solving', score: data.avg_problem_solving_score },
    { subject: 'Culture Fit',     score: data.avg_culture_fit_score },
  ]

  const typeData = Object.entries(data.type_breakdown).map(([type, count]) => ({
    name: interviewTypeLabel(type),
    count,
  }))

  const ImprovementIcon = data.improvement > 0
    ? TrendingUp : data.improvement < 0 ? TrendingDown : Minus
  const improvementColor = data.improvement > 0
    ? 'text-emerald-400' : data.improvement < 0 ? 'text-red-400' : 'text-white/40'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={20} className="text-brand-400" />
        <h1 className="text-xl font-semibold">Analytics</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Sessions"
          value={data.total_sessions}
          icon={Zap}
          sub={`${data.completed_sessions} completed`}
        />
        <StatCard
          label="Avg Overall Score"
          value={`${data.avg_overall_score}/10`}
          icon={Award}
          sub="across all interviews"
          color="bg-emerald-500/15"
        />
        <StatCard
          label="Improvement"
          value={data.improvement > 0 ? `+${data.improvement}` : data.improvement}
          icon={ImprovementIcon}
          sub="first vs latest score"
          color={data.improvement >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}
        />
        <StatCard
          label="Interview Types"
          value={Object.keys(data.type_breakdown).length}
          icon={Brain}
          sub="categories practiced"
          color="bg-purple-500/15"
        />
      </div>

      {/* Score trend */}
      {data.score_trend.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-brand-400" />
            <span className="text-sm font-medium">Score Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.score_trend}>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Overall" />
              <Line type="monotone" dataKey="technical" stroke="#34d399" strokeWidth={1.5} dot={false} name="Technical" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="communication" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Communication" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            {[
              { color: '#6366f1', label: 'Overall' },
              { color: '#34d399', label: 'Technical' },
              { color: '#60a5fa', label: 'Communication' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                <span className="text-xs text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Radar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-brand-400" />
            <span className="text-sm font-medium">Skill Averages</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={1.5} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v.toFixed(1) + '/10', 'Avg Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Type breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-brand-400" />
            <span className="text-sm font-medium">Sessions by Type</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Sessions">
                {typeData.map((_, i) => (
                  <Cell key={i} fill={['#6366f1','#34d399','#60a5fa','#f59e0b','#ec4899'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Dimension scores */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users size={14} className="text-brand-400" />
          <span className="text-sm font-medium">Average Dimension Scores</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Technical',       score: data.avg_technical_score },
            { label: 'Communication',   score: data.avg_communication_score },
            { label: 'Problem Solving', score: data.avg_problem_solving_score },
            { label: 'Culture Fit',     score: data.avg_culture_fit_score },
          ].map(({ label, score }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/50">{label}</span>
                <span className={cn('text-xs font-semibold', scoreColor(score))}>{score}/10</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(score / 10) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className={cn('h-full rounded-full', score >= 8 ? 'bg-emerald-400' : score >= 6 ? 'bg-blue-400' : score >= 4 ? 'bg-amber-400' : 'bg-red-400')}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}