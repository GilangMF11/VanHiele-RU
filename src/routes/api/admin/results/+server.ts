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
