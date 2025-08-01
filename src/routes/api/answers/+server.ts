// src/routes/api/answers/+server.ts - FIXED WITH AUTO SESSION CREATION
import { json, type RequestHandler } from '@sveltejs/kit'
import { DatabaseQueries } from '$lib/database/queries.js'
import type { APIResponse, AnswerData, QuizAnswer } from '$lib/types/index.js'

export const POST: RequestHandler = async ({ request, getClientAddress, url }) => {
  try {
    const answerData: AnswerData = await request.json()
    const { 
      level, 
      question_id, 
      question_text, 
      selected_answer, 
      correct_answer, 
      is_correct, 
      user_data 
    } = answerData

    // Validate input
    if (!question_id || !question_text || !selected_answer || !correct_answer || !user_data) {
      const errorResponse: APIResponse = { 
        success: false, 
        error: 'Data jawaban tidak lengkap' 
      }
      return json(errorResponse, { status: 400 })
    }

    console.log('📝 Processing answer:', {
      level,
      question_id,
      selected_answer,
      correct_answer,
      is_correct,
      user: user_data.name,
      token: user_data.token
    })

    let student, session

    // ===== FIXED: Gunakan method baru yang otomatis create session =====
    if (user_data.token) {
      // Jika ada session token, cari session yang sudah ada
      session = await DatabaseQueries.getSessionByToken(user_data.token)
      
      if (session) {
        // Session ditemukan, ambil student data
        student = await DatabaseQueries.getStudentById(session.student_id)
        console.log('✅ Found existing session:', session.id, 'for student:', student?.id)
      } else {
        // Session tidak ditemukan dengan token tersebut, create new student + session
        console.log('⚠️ Session not found with token, creating new student + session')
        const result = await DatabaseQueries.getOrCreateStudentWithSession(
          user_data.name,
          user_data.class,
          user_data.school,
          user_data.token,
          getClientAddress() || undefined,
          request.headers.get('user-agent') || undefined
        )
        student = result.student
        session = result.session
        console.log('✅ Created new student + session:', {
          studentId: student.id,
          sessionId: session.id,
          isNewStudent: result.isNewStudent
        })
      }
    } else {
      // Tidak ada token, create student + session baru
      console.log('📝 No token provided, creating new student + session')
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      
      const result = await DatabaseQueries.getOrCreateStudentWithSession(
        user_data.name,
        user_data.class,
        user_data.school,
        sessionToken,
        getClientAddress() || undefined,
        request.headers.get('user-agent') || undefined
      )
      student = result.student
      session = result.session
      console.log('✅ Created student + session without token:', {
        studentId: student.id,
        sessionId: session.id,
        sessionToken: session.session_token
      })
    }

    // Pastikan student dan session exist
    if (!student || !session) {
      throw new Error('Failed to create or find student and session')
    }

    // ===== Update session progress =====
    const currentWrongCount = is_correct ? session.wrong_count : session.wrong_count + 1
    const updates: Partial<typeof session> = {
      current_level: Math.max(session.current_level, level),
      current_question: session.current_question + 1,
      wrong_count: currentWrongCount
    }
    
    session = await DatabaseQueries.updateQuizSession(session.id, updates)
    console.log('🔄 Updated quiz session:', {
      sessionId: session.id,
      level: session.current_level,
      question: session.current_question,
      wrongCount: session.wrong_count
    })

    // ===== Calculate points earned =====
    const pointsEarned = is_correct ? (10 * level) : 0

    // ===== Save the answer =====
    const savedAnswer = await DatabaseQueries.createQuizAnswer({
      student_id: student.id,
      session_id: session.id,
      level: level,
      question_id: question_id,
      question_text: question_text,
      selected_answer: selected_answer,
      correct_answer: correct_answer,
      is_correct: is_correct,
      points_earned: pointsEarned,
      time_taken: undefined // Could be added from frontend if needed
    })

    console.log('✅ Answer saved successfully:', {
      answer_id: savedAnswer.id,
      student_id: student.id,
      session_id: session.id,
      is_correct: is_correct,
      points: pointsEarned,
      session_token: session.session_token
    })

    const successResponse: APIResponse = { 
      success: true,
      data: {
        answer_id: savedAnswer.id,
        session_id: session.id,
        session_token: session.session_token, // Return session token for frontend
        student_id: student.id,
        points_earned: pointsEarned,
        current_level: session.current_level,
        current_question: session.current_question,
        wrong_count: session.wrong_count
      }
    }
    return json(successResponse)

  } catch (error) {
    console.error('❌ Database error in /api/answers:', error)
    const errorResponse: APIResponse = { 
      success: false, 
      error: 'Gagal menyimpan jawaban: ' + (error as Error).message 
    }
    return json(errorResponse, { status: 500 })
  }
}