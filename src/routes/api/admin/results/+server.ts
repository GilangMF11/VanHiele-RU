import { verifyJWT } from "$lib/utils/jwtUtils"
import { json, type RequestHandler } from "@sveltejs/kit"
import { DatabaseQueries } from "$lib/database/queries.js"
import { db } from "$lib/database/connection.js"

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    console.log('📥 GET /api/admin/results called')

    const adminSession = cookies.get('admin_session')
    if (!adminSession) return json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = verifyJWT(adminSession)
    if (!adminUser) return json({ error: 'Invalid session' }, { status: 401 })

    // Filters
    const level = url.searchParams.get('level')
    const school = url.searchParams.get('school')
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')
    const detailed = url.searchParams.get('detailed') === '1' || url.searchParams.get('detailed') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const filters: any = {}
    if (level && level !== 'all') filters.level = parseInt(level)
    if (school && school !== 'all') filters.school = school
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    filters.limit = limit
    filters.offset = offset

    // Read from quiz_results_summary
    const rows = await DatabaseQueries.getQuizResultsWithFilters(filters)
    
    // Map to frontend structure
    const baseResults = rows.map((row: any) => ({
      id: String(row.session_id),
      student_name: row.student_name,
      student_class: row.student_class,
      student_school: row.student_school,
      // Sesuaikan dengan tampilan ThankYouScreen (0-3), asumsi DB menyimpan 0-3
      level: Number(row.highest_level_reached ?? 0),
      total_questions: row.total_questions,
      correct_answers: row.correct_answers,
      wrong_answers: row.wrong_answers,
      score_percentage: row.percentage,
      time_taken: row.time_spent || 0,
      completion_date: row.completed_at,
      session_token: row.session_token,
      answers: [] as any[]
    }))

    if (!detailed) {
      return json({ success: true, results: baseResults })
    }

    // If detailed requested, attach answers per session
    const detailedResults = await Promise.all(
      baseResults.map(async (res) => {
        const sessionId = parseInt(res.id, 10)
        const answers = await DatabaseQueries.getAnswersBySession(sessionId)
        const mapped = answers.map(a => ({
          question_id: a.question_id,
          question_text: a.question_text,
          selected_answer: a.selected_answer,
          correct_answer: a.correct_answer,
          is_correct: a.is_correct,
          level: a.level,
          timestamp: a.answered_at
        }))
        return { ...res, answers: mapped }
      })
    )

    return json({ success: true, results: detailedResults })

  } catch (error) {
    console.error('❌ Error in /api/admin/results:', error)
    return json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Hapus Result

// export async function deleteResultsByStudentId(studentId: string): Promise<void> {
//   try {
//     console.log(`🗑️ Deleting quiz results for student_id: ${studentId}`);

//     // Delete all quiz answers for the given student_id
//     const query = `
//       DELETE FROM quiz_answers
//       WHERE student_id = $1
//     `;
//     const params = [studentId];

//     const result = await db.query(query, params);

//     console.log(`✅ Deleted ${result.rowCount} quiz answers for student_id: ${studentId}`);
//   } catch (error) {
//     console.error(`❌ Error deleting quiz results for student_id: ${studentId}`, error);
//     throw new Error(`Failed to delete quiz results: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// }

// src/routes/api/admin/results/+server.ts - FIXED TO USE quiz_results_summary
// import { DatabaseQueries } from "$lib/database/queries.js"
// import { verifyJWT } from "$lib/utils/jwtUtils"
// import { json, type RequestHandler } from "@sveltejs/kit"

// export const GET: RequestHandler = async ({ url, cookies }) => {
//   try {
//     console.log('📥 GET /api/admin/results called')

//     const adminSession = cookies.get('admin_session')
//     if (!adminSession) return json({ error: 'Unauthorized' }, { status: 401 })

//     const adminUser = verifyJWT(adminSession)
//     if (!adminUser) return json({ error: 'Invalid session' }, { status: 401 })

//     // Get filters from URL params
//     const level = url.searchParams.get('level')
//     const school = url.searchParams.get('school')
//     const dateFrom = url.searchParams.get('date_from')
//     const dateTo = url.searchParams.get('date_to')
//     const limit = parseInt(url.searchParams.get('limit') || '100')
//     const offset = parseInt(url.searchParams.get('offset') || '0')

//     console.log('🔍 Filters applied:', { level, school, dateFrom, dateTo, limit, offset })

//     // ✅ Use DatabaseQueries.getQuizResultsWithFilters instead of manual query
//     const filters: any = {}
    
//     if (level && level !== 'all') {
//       filters.level = parseInt(level)
//     }
    
//     if (school && school !== 'all') {
//       filters.school = school
//     }
    
//     if (dateFrom) {
//       filters.dateFrom = dateFrom
//     }
    
//     if (dateTo) {
//       filters.dateTo = dateTo
//     }
    
//     filters.limit = limit
//     filters.offset = offset

//     // Get results from quiz_results_summary table
//     const results = await DatabaseQueries.getQuizResultsWithFilters(filters)

//     console.log('📊 Retrieved results:', results.length)

//     // Format results for frontend
//     const formattedResults = results.map(row => ({
//       student_id: row.student_id,
//       student_name: row.student_name,
//       student_class: row.student_class,
//       student_school: row.student_school,
//       level: row.highest_level_reached,
//       total_questions: row.total_questions,
//       total_answered: row.total_questions, // Already completed if in summary
//       correct_answers: row.correct_answers,
//       wrong_answers: row.wrong_answers,
//       score_percentage: row.percentage,
//       total_score: row.total_score,
//       completion_date: row.completed_at,
//       session_token: row.session_token,
//       status: row.status,
//       time_spent: row.time_spent || 0
//     }))

//     return json({
//       success: true,
//       count: formattedResults.length,
//       results: formattedResults
//     })

//   } catch (error) {
//     console.error('❌ Error in /api/admin/results:', error)
//     return json({
//       success: false,
//       error: 'Internal server error',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 })
//   }
// }

export const DELETE: RequestHandler = async ({ request, cookies }) => {
  try {
    console.log('🗑️ DELETE /api/admin/results called')

    const adminSession = cookies.get('admin_session')
    if (!adminSession) return json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = verifyJWT(adminSession)
    if (!adminUser) return json({ error: 'Invalid session' }, { status: 401 })

    const { resultId } = await request.json()
    
    if (!resultId) {
      return json({ success: false, error: 'resultId is required' }, { status: 400 })
    }

    console.log('🗑️ Deleting result with session_id:', resultId)

    // Delete from quiz_results_summary first
    const deleteSummaryQuery = `
      DELETE FROM quiz_results_summary 
      WHERE session_id = $1
    `
    await db.query(deleteSummaryQuery, [resultId])

    // Delete from quiz_answers
    const deleteAnswersQuery = `
      DELETE FROM quiz_answers 
      WHERE session_id = $1
    `
    await db.query(deleteAnswersQuery, [resultId])

    // Delete from quiz_sessions
    const deleteSessionQuery = `
      DELETE FROM quiz_sessions 
      WHERE id = $1
    `
    await db.query(deleteSessionQuery, [resultId])

    console.log('✅ Successfully deleted result:', resultId)

    return json({ 
      success: true, 
      message: 'Result deleted successfully' 
    })

  } catch (error) {
    console.error('❌ Error deleting result:', error)
    return json({ 
      success: false, 
      error: 'Failed to delete result',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}