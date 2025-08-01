// src/lib/api.ts - FIXED VERSION
import type { APIResponse, UserData, AnswerData, QuizData } from './types/index.js'

export class QuizAPI {
  static async saveUserData(userData: UserData): Promise<APIResponse> {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const data: APIResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error saving user data:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  static async saveAnswer(answerData: AnswerData): Promise<APIResponse> {
    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answerData)
      })
      const data: APIResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error saving answer:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  static async validateToken(token: string): Promise<APIResponse> {
    if (!token || token.trim() === '') {
      return { success: true, data: { message: 'No token required' } }
    }
    
    try {
      const response = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}`)
      const data: APIResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error validating token:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  static async loadQuizData(): Promise<APIResponse<QuizData>> {
    try {
      const response = await fetch('/quiz-data.json')
      const data: QuizData = await response.json()
      const result: APIResponse<QuizData> = { success: true, data }
      return result
    } catch (error) {
      console.error('Error loading quiz data:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}