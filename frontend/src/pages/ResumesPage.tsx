import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Resume {
  id: string
  filename: string
  user_id: string
}

export default function ResumesPage() {
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: resume, isLoading } = useQuery<Resume | null>({
  queryKey: ['resume'],
  queryFn: async () => {
    try {
      const { data } = await api.get('/resumes')  // Changed from '/resumes/' to '/resumes'
      return data
    } catch {
      return null
    }
  },
})

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/resumes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      toast.success('Resume uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['resume'] })
    },
    onError: () => {
      toast.error('Upload failed. Please try again.')
    },
  })

 const deleteMutation = useMutation({
  mutationFn: async () => {
    await api.delete('/resumes')  // Changed from '/resumes/' to '/resumes'
  },
  onSuccess: () => {
    toast.success('Resume deleted.')
    queryClient.invalidateQueries({ queryKey: ['resume'] })
  },
})

  const handleFile = (file: File) => {
    if (!['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast.error('Only PDF, TXT, or DOCX files are supported.')
      return
    }
    uploadMutation.mutate(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-1">Resume</h1>
      <p className="text-sm text-white/40 mb-8">
        Upload your resume so the AI interviewer can ask relevant questions based on your experience.
      </p>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="card p-10 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white/30" />
          </div>
        ) : resume ? (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{resume.filename}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle size={11} className="text-emerald-400" />
                <p className="text-xs text-emerald-400">Uploaded & indexed</p>
              </div>
            </div>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              {deleteMutation.isPending
                ? <Loader2 size={15} className="animate-spin" />
                : <Trash2 size={15} />
              }
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4
                cursor-pointer transition-all text-center
                ${dragging
                  ? 'border-brand-500/60 bg-brand-600/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }
              `}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 size={28} className="text-brand-400 animate-spin" />
                  <p className="text-sm text-white/50">Uploading & indexing your resume…</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center">
                    <Upload size={20} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      Drop your resume here or <span className="text-brand-400">browse</span>
                    </p>
                    <p className="text-xs text-white/30 mt-1">PDF, DOCX, or TXT · Max 10MB</p>
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />

            <div className="mt-4 flex items-start gap-2 px-1">
              <AlertCircle size={13} className="text-white/20 shrink-0 mt-0.5" />
              <p className="text-xs text-white/30">
                Your resume is used only to personalize interview questions. It is stored securely and never shared.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}