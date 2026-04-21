import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Square, Loader2, User, Bot,
  AlertCircle, Clock, Volume2, VolumeX
} from 'lucide-react'
import api from '@/lib/api'
import { useInterviewWS } from '@/hooks/useInterviewWS'
import { useVoice } from '@/hooks/useVoice'
import VoiceButton from '@/components/interview/VoiceButton'
import type { Session, Report } from '@/types'
import { cn, formatDuration, interviewTypeLabel, providerLabel } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-2">
      <div className="w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
        <Bot size={13} className="text-white/60" />
      </div>
      <div className="bg-surface-100 border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 typing-dot"
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ role, content, isNew, onSpeak }: {
  role: 'user' | 'assistant'; content: string; isNew?: boolean; onSpeak?: (t: string) => void
}) {
  const isUser = role === 'user'
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex items-end gap-2 px-4 py-1.5 group', isUser && 'flex-row-reverse')}
    >
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5',
        isUser ? 'bg-brand-600/30' : 'bg-surface-200'
      )}>
        {isUser ? <User size={13} className="text-brand-300" /> : <Bot size={13} className="text-white/60" />}
      </div>
      <div className={cn(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative',
        isUser
          ? 'bg-brand-600 text-white rounded-br-sm'
          : 'bg-surface-100 border border-white/[0.06] text-white/85 rounded-bl-sm'
      )}>
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {!isUser && onSpeak && (
          <button
            onClick={() => onSpeak(content)}
            className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity
              p-1.5 rounded-lg bg-surface-200 text-white/40 hover:text-white/70"
          >
            <Volume2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const token = localStorage.getItem('access_token') ?? ''

  const { data: session } = useQuery<Session>({
    queryKey: ['session', sessionId],
    queryFn: async () => (await api.get(`/sessions/${sessionId}`)).data,
    enabled: !!sessionId,
  })

  const { messages, status, isTyping, error, sendMessage, endInterview } = useInterviewWS({
    sessionId: sessionId!,
    token,
    onReport: (_r: Report) => {
      setTimeout(() => navigate(`/sessions/${sessionId}/report`), 1500)
    },
  })

  const voice = useVoice({
    onTranscript: useCallback((text: string) => {
      setInput(text)
      inputRef.current?.focus()
    }, []),
  })

  const lastMsgRef = useRef<string>('')
  useEffect(() => {
    if (!ttsEnabled) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant' && lastMsg.content !== lastMsgRef.current) {
      lastMsgRef.current = lastMsg.content
      voice.speak(lastMsg.content)
    }
  }, [messages, ttsEnabled, voice])

  useEffect(() => {
    if (status !== 'connected') return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (status === 'connected') inputRef.current?.focus()
  }, [status])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isTyping || status !== 'connected') return
    sendMessage(text)
    setInput('')
    voice.clearTranscript()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleEnd = () => { setShowEndConfirm(false); endInterview() }

  const statusBar = {
    idle:       { dot: 'bg-white/20',    label: 'Connecting…' },
    connecting: { dot: 'bg-amber-500',   label: 'Connecting…' },
    connected:  { dot: 'bg-emerald-500', label: 'Live' },
    ended:      { dot: 'bg-brand-500',   label: 'Ended' },
    error:      { dot: 'bg-red-500',     label: 'Disconnected' },
  }[status]

  return (
    <div className="flex flex-col h-screen bg-surface">
      <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 bg-surface-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', statusBar.dot)} />
            <span className="text-xs text-white/50">{statusBar.label}</span>
          </div>
          {session && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/40">
                {interviewTypeLabel(session.interview_type)} · {providerLabel(session.llm_provider)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'connected' && (
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <Clock size={11} /><span>{formatDuration(elapsed)}</span>
            </div>
          )}
          <button
            onClick={() => { setTtsEnabled(v => !v); if (ttsEnabled) voice.stopCurrentAudio() }}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              ttsEnabled ? 'bg-brand-600/20 text-brand-400' : 'text-white/25 hover:text-white/50 hover:bg-white/5'
            )}
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          {(status === 'connected' || status === 'ended') && messages.length > 0 && (
            <button
              onClick={() => setShowEndConfirm(true)}
              disabled={status === 'ended' || isTyping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Square size={11} fill="currentColor" /> End Interview
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && status === 'connecting' && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={24} className="text-brand-400 animate-spin mb-3" />
            <p className="text-sm text-white/40">Starting your interview…</p>
          </div>
        )}
        {messages.length === 0 && status === 'connected' && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/20 flex items-center justify-center mb-4">
              <Bot size={22} className="text-brand-400" />
            </div>
            <p className="text-white/60 text-sm">Your AI interviewer is ready.</p>
            <p className="text-white/30 text-xs mt-1">Say hello to begin.</p>
          </div>
        )}
        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertCircle size={13} />{error}
          </div>
        )}
        {voice.error && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <AlertCircle size={13} />{voice.error}
            <button onClick={voice.clearError} className="ml-auto text-white/30 hover:text-white/60">✕</button>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isNew={i === messages.length - 1}
            onSpeak={msg.role === 'assistant' ? voice.speak : undefined}
          />
        ))}
        {isTyping && <TypingIndicator />}
        {status === 'ended' && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/15 text-brand-400 text-xs border border-brand-500/20">
              <Loader2 size={12} className="animate-spin" />Generating your report…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/[0.06] bg-surface-50 p-3 shrink-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <VoiceButton
            status={voice.status}
            volume={voice.volume}
            onClick={voice.toggleRecording}
            disabled={status !== 'connected' || isTyping}
            size="sm"
          />
          <div className="flex-1 bg-surface-100 border border-white/10 rounded-xl px-3 py-2
            focus-within:border-brand-500/40 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                voice.isRecording ? '🎙 Recording… click mic to stop' :
                status === 'connected' ? 'Type or use voice… (Enter to send)' :
                status === 'ended' ? 'Interview ended' : 'Connecting…'
              }
              disabled={status !== 'connected' || isTyping || voice.isRecording}
              className="input-field w-full min-h-[24px] max-h-32 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || status !== 'connected' || isTyping || voice.isRecording}
            className="btn-primary p-2.5 shrink-0 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-center text-xs text-white/20 mt-1.5">
          {voice.isRecording ? 'Speak clearly — click mic to stop' : 'Shift+Enter for new line · Enter to send · 🎙 for voice'}
        </p>
      </div>

      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card p-6 max-w-sm w-full"
            >
              <h3 className="font-semibold mb-2">End interview?</h3>
              <p className="text-sm text-white/50 mb-5">
                The AI will evaluate your answers and generate a full scorecard report.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowEndConfirm(false)} className="btn-ghost flex-1 text-sm">
                  Keep going
                </button>
                <button
                  onClick={handleEnd}
                  className="flex-1 text-sm py-2 rounded-lg bg-red-500/15 text-red-400
                    hover:bg-red-500/25 transition-all font-medium border border-red-500/20"
                >
                  End &amp; get report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}