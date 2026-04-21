import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface JD {
  id: string
  title: string
  company?: string
  description: string
  user_id: string
}

function JDCard({ jd, onDelete }: { jd: JD; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-600/15 border border-brand-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Briefcase size={15} className="text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{jd.title}</p>
            {jd.company && <p className="text-xs text-white/40 mt-0.5">{jd.company}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onDelete(jd.id)}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/50 whitespace-pre-wrap leading-relaxed">
                {jd.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function JobDescriptionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  const { data: jds = [], isLoading } = useQuery<JD[]>({
    queryKey: ['jds'],
    queryFn: async () => (await api.get('/jobs')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/jobs', { title, company, description })
      return data
    },
    onSuccess: () => {
      toast.success('Job description saved & indexed!')
      queryClient.invalidateQueries({ queryKey: ['jds'] })
      setTitle(''); setCompany(''); setDescription(''); setShowForm(false)
    },
    onError: () => toast.error('Failed to save job description.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/jobs/${id}`) },
    onSuccess: () => {
      toast.success('Deleted.')
      queryClient.invalidateQueries({ queryKey: ['jds'] })
    },
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold">Job Descriptions</h1>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} />
          Add JD
        </motion.button>
      </div>
      <p className="text-sm text-white/40 mb-6">
        Add job descriptions so the AI tailors interview questions to the role.
      </p>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card p-5 mb-4 space-y-3"
          >
            <h2 className="text-sm font-medium">New Job Description</h2>
            <input
              placeholder="Job title (e.g. Frontend Engineer)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
            />
            <input
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input w-full"
            />
            <textarea
              placeholder="Paste the full job description here…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="input w-full resize-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!title || !description || createMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Save & Index
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map((i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : jds.length === 0 ? (
        <div className="card p-10 text-center">
          <Briefcase size={28} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No job descriptions yet.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
            Add your first JD
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {jds.map((jd) => (
            <JDCard key={jd.id} jd={jd} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  )
}