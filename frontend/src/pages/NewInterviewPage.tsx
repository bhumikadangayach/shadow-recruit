import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, Briefcase } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const TYPES = ['technical', 'behavioral', 'system_design', 'hr', 'mixed']
const PROVIDERS = ['groq', 'openai', 'anthropic', 'gemini']

interface JD {
  id: string
  title: string
  company?: string
}

export default function NewInterviewPage() {
  const navigate = useNavigate()
  const [type, setType] = useState('technical')
  const [provider, setProvider] = useState('groq')
  const [selectedJD, setSelectedJD] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: jds = [] } = useQuery<JD[]>({
    queryKey: ['jds'],
    queryFn: async () => (await api.get('/jobs')).data,
  })

  const handleStart = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/sessions', {
        interview_type: type,
        llm_provider: provider,
        job_description_id: selectedJD ?? undefined,
      })
      navigate(`/interview/${data.id}`)
    } catch {
      toast.error('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-6">New Interview</h1>

      <div className="space-y-6">
        {/* Interview Type */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
            Interview Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.97 }}
                onClick={() => setType(t)}
                className={`px-3 py-2 rounded-lg text-sm border transition-all capitalize ${
                  type === t
                    ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                    : 'border-white/[0.06] text-white/40 hover:text-white/60'
                }`}
              >
                {t.replace('_', ' ')}
              </motion.button>
            ))}
          </div>
        </div>

        {/* AI Provider */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
            AI Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <motion.button
                key={p}
                whileTap={{ scale: 0.97 }}
                onClick={() => setProvider(p)}
                className={`px-3 py-2 rounded-lg text-sm border transition-all capitalize ${
                  provider === p
                    ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                    : 'border-white/[0.06] text-white/40 hover:text-white/60'
                }`}
              >
                {p}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Job Description */}
        {jds.length > 0 && (
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
              Job Description <span className="text-white/20 normal-case">(optional)</span>
            </label>
            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedJD(null)}
                className={`w-full px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                  selectedJD === null
                    ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                    : 'border-white/[0.06] text-white/40 hover:text-white/60'
                }`}
              >
                None (general interview)
              </motion.button>
              {jds.map((jd) => (
                <motion.button
                  key={jd.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedJD(jd.id)}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm border transition-all text-left flex items-center gap-2 ${
                    selectedJD === jd.id
                      ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                      : 'border-white/[0.06] text-white/40 hover:text-white/60'
                  }`}
                >
                  <Briefcase size={13} className="shrink-0" />
                  <span>
                    {jd.title}
                    {jd.company && <span className="opacity-60"> · {jd.company}</span>}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Start Interview
        </button>
      </div>
    </div>
  )
}