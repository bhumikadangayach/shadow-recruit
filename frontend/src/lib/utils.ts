import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDuration(seconds: number) {
  if (!seconds) return '0m'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function statusConfig(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending:     { label: 'Pending',     color: 'text-amber-400 border-amber-500/30' },
    in_progress: { label: 'In Progress', color: 'text-blue-400 border-blue-500/30' },
    completed:   { label: 'Completed',   color: 'text-emerald-400 border-emerald-500/30' },
    failed:      { label: 'Failed',      color: 'text-red-400 border-red-500/30' },
  }
  return map[status] ?? { label: status, color: 'text-white/40 border-white/10' }
}

export function interviewTypeLabel(type: string) {
  const map: Record<string, string> = {
    technical:   'Technical',
    behavioral:  'Behavioral',
    system_design: 'System Design',
    hr:          'HR',
    mixed:       'Mixed',
  }
  return map[type] ?? type
}

export function providerLabel(provider: string) {
  const map: Record<string, string> = {
    openai:    'OpenAI',
    anthropic: 'Anthropic',
    gemini:    'Gemini',
    groq:      'Groq',
  }
  return map[provider] ?? provider
}

export function scoreColor(score: number) {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 6) return 'text-blue-400'
  if (score >= 4) return 'text-amber-400'
  return 'text-red-400'
}

export function scoreRingColor(score: number) {
  if (score >= 8) return '#34d399'
  if (score >= 6) return '#60a5fa'
  if (score >= 4) return '#fbbf24'
  return '#f87171'
}

export function recommendationConfig(rec: string) {
  const map: Record<string, { label: string; color: string }> = {
    strong_hire: { label: 'Strong Hire',  color: 'text-emerald-400 border-emerald-500/30' },
    hire:        { label: 'Hire',         color: 'text-blue-400 border-blue-500/30' },
    maybe:       { label: 'Maybe',        color: 'text-amber-400 border-amber-500/30' },
    no_hire:     { label: 'No Hire',      color: 'text-red-400 border-red-500/30' },
  }
  return map[rec] ?? { label: rec, color: 'text-white/40 border-white/10' }
}