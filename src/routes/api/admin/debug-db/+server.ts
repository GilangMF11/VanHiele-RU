// routes/api/admin/debug-db/+server.ts
import { db } from "$lib/database/connection"
import { verifyJWT } from "$lib/utils/jwtUtils"
import { json, type RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Verifikasi session admin
    const adminSession = cookies.get('admin_session')
    if (!adminSession) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = verifyJWT(adminSession)
    if (!adminUser) {
      return json({ error: 'Invalid session' }, { status: 401 })
    }

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      adminUser: adminUser.username
    }

    // Check available tables
    try {
      const tablesResult = await db.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
      debugInfo.tables = tablesResult.rows
    } catch (e) {
      debugInfo.tablesError = e instanceof Error ? e.message : 'Unknown error'
    }

    // Check students table
    try {
      const studentsCount = await db.query('SELECT COUNT(*) as count FROM students')
      const studentsSample = await db.query('SELECT * FROM students LIMIT 3')
      debugInfo.students = {
        count: studentsCount.rows[0].count,
        sample: studentsSample.rows
      }
    } catch (e) {
      debugInfo.studentsError = e instanceof Error ? e.message : 'Unknown error'
    }

    // Check quiz_sessions table
    try {
      const sessionsCount = await db.query('SELECT COUNT(*) as count FROM quiz_sessions')
      const sessionsSample = await db.query('SELECT * FROM quiz_sessions LIMIT 3')
      debugInfo.quiz_sessions = {
        count: sessionsCount.rows[0].count,
        sample: sessionsSample.rows
      }
    } catch (e) {
      debugInfo.quiz_sessionsError = e instanceof Error ? e.message : 'Unknown error'
    }

    // Check quiz_answers table
    try {
      const answersCount = await db.query('SELECT COUNT(*) as count FROM quiz_answers')
      const answersSample = await db.query('SELECT * FROM quiz_answers LIMIT 3')
      debugInfo.quiz_answers = {
        count: answersCount.rows[0].count,
        sample: answersSample.rows
      }
    } catch (e) {
      debugInfo.quiz_answersError = e instanceof Error ? e.message : 'Unknown error'
    }

    // Test the join query
    try {
      const joinTest = await db.query(`
        SELECT COUNT(*) as count
        FROM quiz_sessions qs
        JOIN students s ON qs.student_id = s.id
        LEFT JOIN quiz_answers a ON a.session_id = qs.id
      `)
      debugInfo.joinQuery = {
        count: joinTest.rows[0].count
      }
    } catch (e) {
      debugInfo.joinQueryError = e instanceof Error ? e.message : 'Unknown error'
    }

    // Check for any data that matches the expected structure
    try {
      const dataCheck = await db.query(`
        SELECT 
          s.full_name,
          s.class,
          s.school,
          qs.session_token,
          qs.current_level,
          COUNT(a.id) as answer_count
        FROM students s
        JOIN quiz_sessions qs ON qs.student_id = s.id
        LEFT JOIN quiz_answers a ON a.session_id = qs.id
        GROUP BY s.id, qs.id
        LIMIT 5
      `)
      debugInfo.sampleData = dataCheck.rows
    } catch (e) {
      debugInfo.sampleDataError = e instanceof Error ? e.message : 'Unknown error'
    }

    return json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    console.error('Debug DB error:', error)
    return json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}