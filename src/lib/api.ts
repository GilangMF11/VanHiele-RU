// src/lib/api.ts - FIXED VERSION
import type { APIResponse, UserData, AnswerData, QuizData, ResultSummaryData, TokenData } from './types/index.js'

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

  static async completeQuiz(data: {
    student_id: number
    session_id: number
    total_questions: number
    correct_answers: number
    wrong_answers: number
    total_score: number
    percentage: number
    highest_level_reached: number
    time_spent: number
    status: string
  }): Promise<APIResponse> {
    try {
      const response = await fetch('/complete-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      console.error('Error completing quiz:', error)
      return { success: false, error: (error as Error).message }
    }
  }
  
  
  static async checkQuizStatus(sessionToken: string): Promise<APIResponse> {
    try {
      const response = await fetch(`/complete-quiz?session_token=${encodeURIComponent(sessionToken)}`)
      const result: APIResponse = await response.json()
      return result
    } catch (error) {
      console.error('Error checking quiz status:', error)
      return { success: false, error: (error as Error).message }
    }
  }
  
  static async getStudentResults(studentId: number): Promise<APIResponse> {
    try {
      const response = await fetch(`/student-results/${studentId}`)
      const result: APIResponse = await response.json()
      return result
    } catch (error) {
      console.error('Error getting student results:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // Create Token
  static async saveToken(tokenData: TokenData): Promise<APIResponse> {
    try {
      const response = await fetch('/api/admin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData),
        credentials: 'include'
      })
      const data: APIResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error creating token:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // Get Token
  static async getToken(tokenId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`/api/admin/token?token=${encodeURIComponent(tokenId)}`, { credentials: 'include' })
      const data: APIResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error getting token:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // Edit Token Patch
  static async editToken(token: string, tokenData: TokenData): Promise<APIResponse> {
    try {
      const response = await fetch(`/api/admin/token?token=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData),
        credentials: 'include'
      })
      const data: APIResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error editing token:', error)
      return { success: false, error: (error as Error).message }
    }
  }
  

  // Delete Token
  static async deleteToken(token: string): Promise<APIResponse> {
    try {
      const response = await fetch(`/api/admin/token?token=${encodeURIComponent(token)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data: APIResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error deleting token:', error)
      return { success: false, error: (error as Error).message }
    }
  }
  
}