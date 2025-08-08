// src/lib/types/index.ts - UPDATED TYPES FOR 5 OPTIONS


export interface Student {
  id: number
  full_name: string
  class: string
  school: string
  student_number?: string
  phone?: string
  email?: string
  created_at: string
  updated_at: string
}

  
  export interface StudentResult {
    id: string
    student_name: string
    student_class: string
    student_school: string
    level: number
    total_questions: number
    correct_answers: number
    wrong_answers: number
    score_percentage: number
    time_taken: number
    completion_date: string
    session_token: string
    answers: StudentAnswer[]
  }
  
  export interface StudentAnswer {
    question_id: string
    question_text: string
    selected_answer: string
    correct_answer: string
    is_correct: boolean
    level: number
    timestamp: string
  }
  
  export interface DashboardStats {
    total_students: number
    active_sessions: number
    completed_quizzes: number
    average_score: number
    total_questions_answered: number
    active_tokens: number
  }
  
  export interface TokenData {
    id: string
    token: string
    description: string
    is_active: boolean
    created_date: string
    usage_count: number
    max_usage?: number
  }

export interface QuizSession {
  id: number
  student_id: number
  session_token: string
  current_level: number
  current_question: number
  wrong_count: number
  status: 'active' | 'completed' | 'stopped' | 'timeout'
  token_used?: string
  started_at: string
  completed_at?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  updated_at: string
}

export interface QuizAnswer {
  id: number
  student_id: number
  session_id: number
  level: number
  question_id: string
  question_text: string
  selected_answer: 'a' | 'b' | 'c' | 'd' | 'e'  // UPDATED: Added 'e'
  correct_answer: 'a' | 'b' | 'c' | 'd' | 'e'   // UPDATED: Added 'e'
  is_correct: boolean
  points_earned: number
  time_taken?: number
  answered_at: string
  created_at: string
}

export interface Token {
  id: number
  token_code: string
  token_name?: string
  is_active: boolean
  usage_count: number
  max_usage: number
  expires_at?: string
  created_by?: number
  created_at: string
  updated_at: string
}

export interface AdminLog {
  id: number
  user_id: number
  action: string
  description?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface QuizResultSummary {
  student_id: number
  session_id: number
  total_questions: number
  correct_answers: number
  wrong_answers: number
  total_score: number
  percentage: number
  highest_level_reached: number
  time_spent: number
  status: 'completed' | 'stopped_wrong' | 'timeout'
  completed_at: string
  created_at: string
  // ✅ TAMBAHAN: Field untuk tracking completion
  total_available_questions?: number
  questions_answered?: number
  completion_rate?: number
}

export interface ResultSummaryData {
  total_questions: number
  correct_answers: number
  wrong_answers: number
  total_score: number
  percentage: number
  highest_level_reached: number
  time_spent: number
  status: 'completed' | 'stopped_wrong' | 'timeout'
  user_data: UserDataWithSession
}

// Frontend types - UPDATED FOR 5 OPTIONS
export interface Question {
  id: string
  question: string
  image?: string | null
  image_alt?: string | null
  image_caption?: string | null
  options: {
    a: string
    b: string
    c: string
    d: string
    e: string  // UPDATED: Added option 'e'
  }
  correct_answer: 'a' | 'b' | 'c' | 'd' | 'e'  // UPDATED: Added 'e'
  explanation: string
}

export interface QuizLevel {
  level_name: string
  description: string
  questions: Question[]
}

export interface QuizData {
  quiz_config: {
    title: string
    description: string
    total_levels: number
    max_mistakes_per_level: number
    image_base_url?: string
  }
  levels: Record<string, QuizLevel>
}

export interface UserData {
  name: string
  class: string
  school: string
  token: string
}

export interface AnswerData {
  level: number
  question_id: string
  question_text: string
  selected_answer: 'a' | 'b' | 'c' | 'd' | 'e'  // UPDATED: Added 'e'
  correct_answer: 'a' | 'b' | 'c' | 'd' | 'e'   // UPDATED: Added 'e'
  is_correct: boolean
  user_data: UserData
  time_taken?: number
  session_token?: string
}

export interface UserDataWithSession extends UserData {
  session_id?: number
  student_id?: number
}


export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export type GameState = 'welcome' | 'dataEntry' | 'tokenInput' | 'quiz' | 'thankYou'

// Admin Dashboard Types
export interface DashboardStats {
  total_participants: number
  completed_sessions: number
  stopped_sessions: number
  timeout_sessions: number
  average_score: number
  average_level: number
  active_tokens: number
}

export interface StudentPerformance {
  student_id: number
  full_name: string
  class: string
  school: string
  started_at: string
  completed_at?: string
  status: string
  total_questions: number
  correct_answers: number
  percentage: number
  highest_level_reached: number
  time_spent: number
  token_used?: string
}