// src/stores/quiz.js - UPDATED FOR LEVEL 0 START
import { writable } from 'svelte/store'
import type { GameState, UserData, AnswerData } from '../types/index.js'

// Game state: 'welcome' | 'dataEntry' | 'tokenInput' | 'quiz' | 'thankYou'
export const gameState = writable<GameState>('welcome')

// Quiz progress - UPDATED: Start from level 0
export const currentLevel = writable<number>(0)  // Changed from 1 to 0
export const currentQuestionIndex = writable<number>(0)
export const wrongCount = writable<number>(0)

// User data
export const userData = writable<UserData>({
  name: '',
  class: '',
  school: '',
  token: ''
})

// Answers collected during quiz
export const answers = writable<AnswerData[]>([])

// Reset function untuk memulai quiz dari awal
export function resetQuiz(): void {
  gameState.set('welcome')
  currentLevel.set(0)        // Reset to level 0
  currentQuestionIndex.set(0)
  wrongCount.set(0)
  userData.set({
    name: '',
    class: '',
    school: '',
    token: ''
  })
  answers.set([])
}

// Function untuk reset level (tapi keep user data)
export function resetToLevel(level: number): void {
  currentLevel.set(level)
  currentQuestionIndex.set(0)
  wrongCount.set(0)
  answers.update(arr => arr.filter(answer => answer.level < level))
}

// Get quiz progress summary
export function getQuizSummary() {
  let summary = {
    currentLevel: 0,
    currentQuestion: 0,
    totalWrong: 0,
    totalAnswers: 0,
    correctAnswers: 0
  }
  
  currentLevel.subscribe(level => summary.currentLevel = level)()
  currentQuestionIndex.subscribe(index => summary.currentQuestion = index)()
  wrongCount.subscribe(count => summary.totalWrong = count)()
  answers.subscribe(arr => {
    summary.totalAnswers = arr.length
    summary.correctAnswers = arr.filter(a => a.is_correct).length
  })()
  
  return summary
}