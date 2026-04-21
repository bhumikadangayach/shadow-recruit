import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  status: 'idle' | 'recording' | 'transcribing' | 'speaking' | 'error'
  volume?: number
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export default function VoiceButton({ status, volume = 0, onClick, disabled, size = 'md' }: Props) {
  const isRecording = status === 'recording'
  const isTranscribing = status === 'transcribing'
  const scale = isRecording ? 1 + (volume / 100) * 0.3 : 1

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      animate={{ scale }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all shrink-0',
        size === 'sm' ? 'w-10 h-10' : 'w-12 h-12',
        isRecording
          ? 'bg-red-500/20 border-2 border-red-500/60 text-red-400'
          : isTranscribing
          ? 'bg-brand-600/20 border-2 border-brand-500/40 text-brand-400'
          : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.08]',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {/* Pulse ring when recording */}
      <AnimatePresence>
        {isRecording && (
          <motion.span
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-red-500/30"
          />
        )}
      </AnimatePresence>

      {isTranscribing
        ? <Loader2 size={size === 'sm' ? 16 : 18} className="animate-spin" />
        : isRecording
        ? <MicOff size={size === 'sm' ? 16 : 18} />
        : <Mic size={size === 'sm' ? 16 : 18} />
      }
    </motion.button>
  )
}