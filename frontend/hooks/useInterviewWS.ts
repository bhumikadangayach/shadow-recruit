import { useState, useEffect, useRef, useCallback } from 'react'
import type { Report } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type WSStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'

interface Options {
  sessionId: string
  token: string
  onReport: (report: Report) => void
}

export function useInterviewWS({ sessionId, token, onReport }: Options) {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<WSStatus>('idle')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const wsBase = (import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000')
    const url = `${wsBase}/ws/interview/${sessionId}?token=${token}`
    setStatus('connecting')
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => setStatus('connected')

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') {
          setIsTyping(false)
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            role: data.role,
            content: data.content,
          }])
        } else if (data.type === 'typing') {
          setIsTyping(true)
        } else if (data.type === 'report') {
          setStatus('ended')
          setIsTyping(false)
          onReport(data.report)
        } else if (data.type === 'error') {
          setError(data.message)
        }
      } catch {
        // ignore parse errors
      }
    }

    socket.onerror = () => {
      setStatus('error')
      setError('Connection error. Please refresh.')
    }

    socket.onclose = () => {
      if (status !== 'ended') setStatus('ended')
    }

    return () => socket.close()
  }, [sessionId, token])

  const sendMessage = useCallback((content: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    }])
    ws.current.send(JSON.stringify({ type: 'message', content }))
    setIsTyping(true)
  }, [])

  const endInterview = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'end' }))
    }
    setStatus('ended')
  }, [])

  return { messages, status, isTyping, error, sendMessage, endInterview }
}