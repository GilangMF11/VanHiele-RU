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

    // Validate input - Allow empty question_text if question has image
    if (!question_id || !selected_answer || !correct_answer || !user_data) {
      const errorResponse: APIResponse = { 
        success: false, 
        error: 'Data jawaban tidak lengkap' 
      }
      return json(errorResponse, { status: 400 })
    }

    // If question_text is empty, provide a default text
    const finalQuestionText = question_text || `Soal ${question_id} (berdasarkan gambar)`;

    console.log('📝 Processing answer:', {
      level,
      question_id,
      question_text: question_text || '(empty)',
      finalQuestionText,
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
      studentId: student.id,
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
      question_text: finalQuestionText,
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



// // src/routes/api/answers/+server.ts - DEBUGGED & FIXED VERSION
// import { json, type RequestHandler } from '@sveltejs/kit'
// import { DatabaseQueries } from '$lib/database/queries.js'
// import type { APIResponse, AnswerData, QuizAnswer } from '$lib/types/index.js'

// export const POST: RequestHandler = async ({ request, getClientAddress, url }) => {
//   try {
//     const answerData: AnswerData = await request.json()
//     const { 
//       level, 
//       question_id, 
//       question_text, 
//       selected_answer, 
//       correct_answer, 
//       is_correct, 
//       user_data 
//     } = answerData

//     // Validate input
//     if (!question_id || !question_text || !selected_answer || !correct_answer || !user_data) {
//       const errorResponse: APIResponse = { 
//         success: false, 
//         error: 'Data jawaban tidak lengkap' 
//       }
//       return json(errorResponse, { status: 400 })
//     }

//     console.log('📝 Processing answer:', {
//       level,
//       question_id,
//       selected_answer,
//       correct_answer,
//       is_correct,
//       user: user_data.name,
//       token: user_data.token
//     })

//     let student, session

    

//     // Get or create student and session
//     if (user_data.token) {
//       session = await DatabaseQueries.getSessionByToken(user_data.token)
      
//       if (session) {
//         student = await DatabaseQueries.getStudentById(session.student_id)
//         console.log('✅ Found existing session:', session.id, 'for student:', student?.id)
//       } else {
//         console.log('⚠️ Session not found with token, creating new student + session')
//         const result = await DatabaseQueries.getOrCreateStudentWithSession(
//           user_data.name,
//           user_data.class,
//           user_data.school,
//           user_data.token,
//           getClientAddress() || undefined,
//           request.headers.get('user-agent') || undefined
//         )
//         student = result.student
//         session = result.session
//       }
//     } else {
//       console.log('📝 No token provided, creating new student + session')
//       const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      
//       const result = await DatabaseQueries.getOrCreateStudentWithSession(
//         user_data.name,
//         user_data.class,
//         user_data.school,
//         sessionToken,
//         getClientAddress() || undefined,
//         request.headers.get('user-agent') || undefined
//       )
//       student = result.student
//       session = result.session
//     }

//     if (!student || !session) {
//       throw new Error('Failed to create or find student and session')
//     }

//     // Calculate new wrong count
//     const newWrongCount = is_correct ? session.wrong_count : session.wrong_count + 1
//     console.log(`📊 Wrong count: ${session.wrong_count} → ${newWrongCount}`)

//     // Update session progress
//     const updates: Partial<typeof session> = {
//       current_level: Math.max(session.current_level, level),
//       current_question: session.current_question + 1,
//       wrong_count: newWrongCount
//     }
    
//     session = await DatabaseQueries.updateQuizSession(session.id, updates)
//     console.log('🔄 Updated quiz session:', {
//       sessionId: session.id,
//       level: session.current_level,
//       question: session.current_question,
//       wrongCount: session.wrong_count
//     })

//     // Calculate points earned
//     const pointsEarned = is_correct ? (10 * (level + 1)) : 0

//     // Save the answer
//     const savedAnswer = await DatabaseQueries.createQuizAnswer({
//       student_id: student.id,
//       session_id: session.id,
//       level: level,
//       question_id: question_id,
//       question_text: question_text,
//       selected_answer: selected_answer,
//       correct_answer: correct_answer,
//       is_correct: is_correct,
//       points_earned: pointsEarned,
//       time_taken: undefined
//     })

//     console.log('✅ Answer saved successfully:', savedAnswer.id)

//     // ✅ ENHANCED: Check and create quiz summary with detailed logging
//     console.log('🎯 Checking quiz completion...')
//     //const summaryCreated = await checkAndCreateQuizSummary(session.id, student.id, session.wrong_count, level)
//     const summaryCreated = await checkAndCreateQuizSummary(session.id, student.id, newWrongCount, level)
//     if (summaryCreated) {
//       console.log('🎊 QUIZ SUMMARY CREATED! Session completed.')
//     } else {
//       console.log('📝 Quiz still in progress, no summary created yet')
//     }

    

//     const successResponse: APIResponse = { 
//       success: true,
//       data: {
//         answer_id: savedAnswer.id,
//         session_id: session.id,
//         session_token: session.session_token,
//         student_id: student.id,
//         points_earned: pointsEarned,
//         current_level: session.current_level,
//         current_question: session.current_question,
//         wrong_count: session.wrong_count,
//         quiz_completed: summaryCreated // ✅ NEW: Tell frontend if quiz is done
//       }
//     }
//     return json(successResponse)

//   } catch (error) {
//     console.error('❌ Database error in /api/answers:', error)
//     const errorResponse: APIResponse = { 
//       success: false, 
//       error: 'Gagal menyimpan jawaban: ' + (error as Error).message 
//     }
//     return json(errorResponse, { status: 500 })
//   }
// }

// // ✅ ENHANCED: More aggressive quiz completion detection
// // ✅ SIMPLIFIED checkAndCreateQuizSummary - ALWAYS CREATE SUMMARY
// async function checkAndCreateQuizSummary(
//   sessionId: number, 
//   studentId: number, 
//   currentWrongCount: number, 
//   currentLevel: number
// ): Promise<boolean> {
//   try {
//     console.log('🎯 FORCE CREATING quiz summary:', {
//       sessionId,
//       studentId,
//       currentWrongCount,
//       currentLevel
//     })

//     // Check if summary already exists - if exists, UPDATE it instead of creating new
//     const existingSummary = await DatabaseQueries.getQuizResultBySessionId(sessionId)
//     if (existingSummary) {
//       console.log('📊 Summary exists, UPDATING existing summary:', existingSummary.session_id)
//     } else {
//       console.log('📊 No existing summary, CREATING new one')
//     }

//     // Get all answers for statistics
//     const answers = await DatabaseQueries.getAnswersBySession(sessionId)
//     console.log('📝 Found answers for session:', answers.length)

//     if (answers.length === 0) {
//       console.log('⚠️ No answers found, cannot create summary')
//       return false
//     }

//     // Calculate statistics
//     const totalQuestions = answers.length
//     const correctAnswers = answers.filter(a => a.is_correct).length
//     const wrongAnswers = answers.filter(a => !a.is_correct).length
//     const totalScore = answers.reduce((sum, a) => sum + (a.points_earned || 0), 0)
//     const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
//     const highestLevelReached = currentLevel

//     // Determine status based on wrong count
//     let status: 'completed' | 'stopped_wrong' | 'timeout' = 'completed'
//     if (currentWrongCount >= 3) {
//       status = 'stopped_wrong'
//     }

//     console.log('📊 Quiz statistics to save:', {
//       totalQuestions,
//       correctAnswers,
//       wrongAnswers,
//       totalScore,
//       percentage,
//       highestLevelReached,
//       status,
//       currentWrongCount
//     })

//     let summary
    
//     if (existingSummary) {
//       // UPDATE existing summary
//       summary = await DatabaseQueries.updateQuizResult(existingSummary.session_id, {
//         total_questions: totalQuestions,
//         correct_answers: correctAnswers,
//         wrong_answers: wrongAnswers,
//         total_score: totalScore,
//         percentage: percentage,
//         highest_level_reached: highestLevelReached,
//         status: status
//       })
//       console.log('✅ Updated existing quiz summary:', existingSummary.session_id)
//     } else {
//       // CREATE new summary
//       summary = await DatabaseQueries.createQuizResult({
//         student_id: studentId,
//         session_id: sessionId,
//         total_questions: totalQuestions,
//         correct_answers: correctAnswers,
//         wrong_answers: wrongAnswers,
//         total_score: totalScore,
//         percentage: percentage,
//         highest_level_reached: highestLevelReached,
//         time_spent: 0,
//         status: status
//       })
//       console.log('✅ Created new quiz summary:', summary.session_id)
//     }

//     // Update session status
//     await DatabaseQueries.updateQuizSession(sessionId, {
//       status: status === 'completed' ? 'completed' : 'stopped'
//     })

//     console.log('🎊 QUIZ SUMMARY SAVED SUCCESSFULLY!', {
//       summaryId: summary.session_id,
//       sessionId: sessionId,
//       status: status,
//       score: percentage,
//       action: existingSummary ? 'UPDATED' : 'CREATED'
//     })

//     return true

//   } catch (error) {
//     console.error('❌ Error in checkAndCreateQuizSummary:', error)
//     console.error('❌ Full error details:', {
//       message: error,
//       stack: error,
//       sessionId,
//       studentId
//     })
//     return false
//   }
// }