export interface User {
  id: string
  email: string
  full_name: string
}

export interface Session {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  interview_type: string
  llm_provider: string
  created_at: string
  duration_seconds?: number
}

export interface QuestionEvaluation {
  question: string
  answer: string
  score: number
  feedback: string
}

export interface Report {
  overall_score: number
  technical_score: number
  communication_score: number
  problem_solving_score: number
  culture_fit_score: number
  summary: string
  strengths: string[]
  improvements: string[]
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire'
  question_evaluations: QuestionEvaluation[]
  created_at: string
}