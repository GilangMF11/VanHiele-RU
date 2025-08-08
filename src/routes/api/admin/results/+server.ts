import { db } from "$lib/database/connection"
import { verifyJWT } from "$lib/utils/jwtUtils"
import { json, type RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    console.log('📥 GET /api/admin/results called')

    const adminSession = cookies.get('admin_session')
    if (!adminSession) return json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = verifyJWT(adminSession)
    if (!adminUser) return json({ error: 'Invalid session' }, { status: 401 })

    const level = url.searchParams.get('level')
    const school = url.searchParams.get('school')
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')

    const TOTAL_QUESTIONS = 27

    let query = `
      SELECT 
        s.id AS student_id,
        s.full_name AS student_name,
        s.class AS student_class,
        s.school AS student_school,
        MAX(a.level) AS level,
        COUNT(CASE WHEN a.selected_answer IS NOT NULL THEN 1 END) AS total_answered,
        COUNT(CASE WHEN a.selected_answer = a.correct_answer THEN 1 END) AS correct_answers,
        COUNT(CASE WHEN a.selected_answer IS NOT NULL AND a.selected_answer != a.correct_answer THEN 1 END) AS wrong_answers,
        COALESCE(MAX(a.answered_at), NOW()) AS completion_date
      FROM students s
      LEFT JOIN quiz_answers a ON a.student_id = s.id
      WHERE 1=1
    `

    const params: any[] = []

    if (level && level !== 'all') {
      query += ` AND a.level = $${params.length + 1}`
      params.push(parseInt(level))
    }

    if (school && school !== 'all') {
      query += ` AND s.school ILIKE $${params.length + 1}`
      params.push(`%${school}%`)
    }

    if (dateFrom) {
      query += ` AND DATE(a.answered_at) >= $${params.length + 1}`
      params.push(dateFrom)
    }

    if (dateTo) {
      query += ` AND DATE(a.answered_at) <= $${params.length + 1}`
      params.push(dateTo)
    }

    query += `
      GROUP BY s.id, s.full_name, s.class, s.school
      ORDER BY completion_date DESC NULLS LAST
    `

    const result = await db.query(query, params)

    const formattedResults = result.rows.map(row => {
      const correct = parseInt(row.correct_answers) || 0
      const wrong = parseInt(row.wrong_answers) || 0
      const totalAnswered = parseInt(row.total_answered) || 0
      const score = correct > 0
        ? parseFloat(((correct / TOTAL_QUESTIONS) * 100).toFixed(2))
        : 0

      let status: 'not_started' | 'in_progress' | 'completed'
      if (totalAnswered === 0) {
        status = 'not_started'
      } else if (totalAnswered < TOTAL_QUESTIONS) {
        status = 'in_progress'
      } else {
        status = 'completed'
      }

      return {
        student_id: row.student_id,
        student_name: row.student_name,
        student_class: row.student_class,
        student_school: row.student_school,
        level: parseInt(row.level) || 0,
        total_questions: TOTAL_QUESTIONS,
        total_answered: totalAnswered,
        correct_answers: correct,
        wrong_answers: wrong,
        score_percentage: score,
        completion_date: row.completion_date,
        status
      }
    })

    return json({
      success: true,
      count: formattedResults.length,
      results: formattedResults
    })

  } catch (error) {
    console.error('❌ Error in /api/admin/results:', error)
    return json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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