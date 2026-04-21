import { useCallback, useEffect, useRef, useState } from 'react'

type VoiceStatus = 'idle' | 'recording' | 'transcribing' | 'speaking' | 'error'

interface UseVoiceOptions {
  onTranscript?: (text: string) => void
}

export function useVoice({ onTranscript }: UseVoiceOptions = {}) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>()

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null

  const supported = !!SpeechRecognition

  // Volume analyser
  const startVolumeAnalysis = (stream: MediaStream) => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      setVolume(Math.round(avg))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const stopVolumeAnalysis = () => {
    cancelAnimationFrame(animFrameRef.current!)
    audioCtxRef.current?.close().catch(() => {})
    setVolume(0)
  }

  const startRecording = useCallback(async () => {
    setError(null)
    if (!supported) {
      setError('Speech recognition not supported in this browser. Try Chrome.')
      setStatus('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startVolumeAnalysis(stream)

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognitionRef.current = recognition

      recognition.onresult = (e: any) => {
        const text = e.results[0]?.[0]?.transcript ?? ''
        setTranscript(text)
        if (text) onTranscript?.(text)
      }

      recognition.onerror = (e: any) => {
        setError(e.error === 'not-allowed'
          ? 'Microphone access denied.'
          : `Recognition error: ${e.error}`)
        setStatus('error')
        stopVolumeAnalysis()
        stream.getTracks().forEach(t => t.stop())
      }

      recognition.onend = () => {
        stopVolumeAnalysis()
        stream.getTracks().forEach(t => t.stop())
        setStatus('idle')
      }

      recognition.start()
      setStatus('recording')
    } catch (err: any) {
      setError(err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone in browser settings.'
        : 'Could not start recording')
      setStatus('error')
    }
  }, [onTranscript, supported])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    stopVolumeAnalysis()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStatus('idle')
  }, [])

  const toggleRecording = useCallback(() => {
    if (status === 'recording') stopRecording()
    else if (status === 'idle') startRecording()
  }, [status, startRecording, stopRecording])

  // Browser TTS
  const speak = useCallback((text: string) => {
    if (!text.trim() || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.0
    utter.pitch = 1.0
    utter.onstart = () => setStatus('speaking')
    utter.onend = () => setStatus('idle')
    utter.onerror = () => setStatus('idle')
    synthRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [])

  const stopCurrentAudio = useCallback(() => {
    window.speechSynthesis?.cancel()
    if (status === 'speaking') setStatus('idle')
  }, [status])

  useEffect(() => {
    return () => {
      stopVolumeAnalysis()
      streamRef.current?.getTracks().forEach(t => t.stop())
      window.speechSynthesis?.cancel()
    }
  }, [])

  return {
    status,
    transcript,
    error,
    volume,
    isRecording: status === 'recording',
    isTranscribing: status === 'transcribing',
    isSpeaking: status === 'speaking',
    supported,
    startRecording,
    stopRecording,
    toggleRecording,
    speak,
    stopCurrentAudio,
    clearTranscript: () => setTranscript(''),
    clearError: () => setError(null),
  }
}