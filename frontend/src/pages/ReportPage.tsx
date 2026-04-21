import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ChevronLeft, TrendingUp, MessageSquare, Brain,
  Users, Star, ThumbsUp, AlertTriangle, BarChart2, Download
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, Tooltip
} from 'recharts'
import api from '@/lib/api'
import type { Report, Session } from '@/types'
import {
  cn, formatDate, formatDuration,
  scoreColor, scoreRingColor, recommendationConfig, interviewTypeLabel
} from '@/lib/utils'
 
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size / 2) - 8
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 10) * circumference
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={scoreRingColor(score)} strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
      />
    </svg>
  )
}
 
function MetricCard({ label, score, icon: Icon, delay = 0 }: {
  label: string; score: number; icon: any; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-4 flex items-center gap-4"
    >
      <div className="relative flex items-center justify-center">
        <ScoreRing score={score} size={56} />
        <span className={cn('absolute text-sm font-bold rotate-90', scoreColor(score))}>
          {score.toFixed(1)}
        </span>
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-white/50 mb-0.5">
          <Icon size={12} />
          <span className="text-xs">{label}</span>
        </div>
        <div className={cn('text-lg font-semibold', scoreColor(score))}>
          {score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : score >= 4 ? 'Fair' : 'Needs Work'}
        </div>
      </div>
    </motion.div>
  )
}
 
function QuestionCard({ q, a, score, feedback, index }: {
  q: string; a: string; score: number; feedback: string; index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-white/80">{q}</p>
        <span className={cn('shrink-0 text-sm font-bold tabular-nums', scoreColor(score))}>
          {score.toFixed(1)}/10
        </span>
      </div>
      <div className="bg-surface-200/50 rounded-lg px-3 py-2">
        <p className="text-xs text-white/40 mb-1">Your answer</p>
        <p className="text-sm text-white/70 line-clamp-3">{a}</p>
      </div>
      <div className="flex gap-2 text-xs text-white/40">
        <MessageSquare size={12} className="shrink-0 mt-0.5" />
        <p>{feedback}</p>
      </div>
    </motion.div>
  )
}
 
export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
 
  const { data: report, isLoading: loadingReport } = useQuery<Report>({
    queryKey: ['report', sessionId],
    queryFn: async () => (await api.get(`/sessions/${sessionId}/report`)).data,
  })
 
  const { data: session } = useQuery<Session>({
    queryKey: ['session', sessionId],
    queryFn: async () => (await api.get(`/sessions/${sessionId}`)).data,
    enabled: !!sessionId,
  })
 
  const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')
    const element = document.getElementById('report-content')
    if (!element) return
    const canvas = await html2canvas(element, {
      backgroundColor: '#0f0f17',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    let heightLeft = pdfHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pdf.internal.pageSize.getHeight()
    while (heightLeft > 0) {
      position -= pdf.internal.pageSize.getHeight()
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
    }
    pdf.save(`interview-report-${sessionId}-${new Date().toISOString().split('T')[0]}.pdf`)
  }
 
  if (loadingReport) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-3">
          {[1,2,3,4].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      </div>
    )
  }
 
  if (!report) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <p className="text-white/40">Report not found.</p>
        <Link to="/dashboard" className="text-brand-400 text-sm mt-2 block">← Back to dashboard</Link>
      </div>
    )
  }
 
  const rec = recommendationConfig(report.recommendation)
  const radarData = [
    { subject: 'Technical',       score: report.technical_score },
    { subject: 'Communication',   score: report.communication_score },
    { subject: 'Problem Solving', score: report.problem_solving_score },
    { subject: 'Culture Fit',     score: report.culture_fit_score },
  ]
 
  return (
    <div className="p-6 max-w-3xl mx-auto">
 
      {/* ── PDF-captured section ── */}
      <div id="report-content">
 
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost p-1.5 -ml-1">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Interview Report</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {session ? `${interviewTypeLabel(session.interview_type)} · ` : ''}
              {report.created_at ? formatDate(report.created_at) : ''}
              {session?.duration_seconds ? ` · ${formatDuration(session.duration_seconds)}` : ''}
            </p>
          </div>
          <span className={cn('badge border text-sm px-3 py-1', rec.color)}>
            {rec.label}
          </span>
        </div>
 
        {/* Overall score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-6 mb-4 flex items-center gap-6"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)' }}
        >
          <div className="relative flex items-center justify-center">
            <ScoreRing score={report.overall_score} size={96} />
            <div className="absolute flex flex-col items-center rotate-90">
              <span className={cn('text-2xl font-bold tabular-nums', scoreColor(report.overall_score))}>
                {report.overall_score.toFixed(1)}
              </span>
              <span className="text-xs text-white/30 -mt-0.5">/ 10</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white/50 text-xs mb-1">Overall Score</p>
            <p className="text-lg font-semibold text-white leading-snug">{report.summary}</p>
          </div>
        </motion.div>
 
        {/* Dimension scores */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Technical"       score={report.technical_score}       icon={Brain}         delay={0.1} />
          <MetricCard label="Communication"   score={report.communication_score}   icon={MessageSquare} delay={0.15} />
          <MetricCard label="Problem Solving" score={report.problem_solving_score} icon={TrendingUp}    delay={0.2} />
          <MetricCard label="Culture Fit"     score={report.culture_fit_score}     icon={Users}         delay={0.25} />
        </div>
 
        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="card p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3 text-white/50">
            <BarChart2 size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Skill Radar</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={1.5} />
              <Tooltip
                contentStyle={{ background: '#22222d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [v.toFixed(1) + '/10', 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
 
        {/* Strengths + Improvements */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {report.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUp size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Strengths</span>
              </div>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-white/70 flex gap-2">
                    <Star size={11} className="text-emerald-400 shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          {report.improvements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">To Improve</span>
              </div>
              <ul className="space-y-2">
                {report.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-white/70 flex gap-2">
                    <span className="text-amber-400 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
 
        {/* Q&A */}
        {report.question_evaluations.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
              Question-by-Question
            </h2>
            <div className="space-y-3">
              {report.question_evaluations.map((qe, i) => (
                <QuestionCard key={i} index={i} q={qe.question} a={qe.answer} score={qe.score} feedback={qe.feedback} />
              ))}
            </div>
          </motion.div>
        )}
 
      </div>
      {/* ── End PDF-captured section ── */}
 
      {/* CTA — outside PDF capture */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-8 flex gap-3"
      >
        <Link to="/interview/new" className="flex-1">
          <button className="btn-primary w-full">Practice Again</button>
        </Link>
        <button
          onClick={handleDownloadPDF}
          className="btn-ghost px-4 flex items-center gap-2"
        >
          <Download size={15} />
          Export PDF
        </button>
        <Link to="/dashboard">
          <button className="btn-ghost px-6">Dashboard</button>
        </Link>
      </motion.div>
 
    </div>
  )
}