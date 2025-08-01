// routes/api/admin/dashboard/+server.ts - Corrected
import { verifyJWT } from '$lib/utils/jwtUtils' // ✅ Use server-only JWT utils
import { json, type RequestHandler } from '@sveltejs/kit'
// import { db } from '$lib/database/connection' // Uncomment when ready to use real DB

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    console.log('📊 Dashboard API called') // 🔍 Debug
    
    const adminSession = cookies.get('admin_session')
    console.log('🔍 Session cookie exists:', !!adminSession) // 🔍 Debug
    console.log('🔍 Session token (first 20 chars):', adminSession?.substring(0, 20)) // 🔍 Debug
    
    if (!adminSession) {
      console.log('❌ No admin session cookie') // 🔍 Debug
      return json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    // ✅ Use server-only JWT verification
    const adminUser = verifyJWT(adminSession)
    console.log('🔍 JWT verification result:', adminUser ? 'Valid' : 'Invalid') // 🔍 Debug
    
    if (!adminUser) {
      console.log('❌ Invalid JWT token') // 🔍 Debug
      return json({ error: 'Invalid session - Please login again' }, { status: 401 })
    }

    console.log('✅ Admin authorized:', adminUser.username) // 🔍 Debug
    console.log('✅ Admin details:', { id: adminUser.id, role: adminUser.role }) // 🔍 Debug

    // For now, return mock data. Replace with actual database queries when ready.
    const stats = {
      total_students: 150,
      active_sessions: 23,
      completed_quizzes: 87,
      average_score: 78,
      total_questions_answered: 1250,
      active_tokens: 5
    }

    console.log('📊 Returning dashboard stats for user:', adminUser.username) // 🔍 Debug
    return json({ stats })
    
    /* 
    // TODO: Replace mock data with actual database queries
    const [
      totalStudents,
      activeSessions,
      completedQuizzes,
      averageScore,
      totalQuestions,
      activeTokens
    ] = await Promise.all([
      db.query('SELECT COUNT(DISTINCT token) as count FROM users'),
      db.query(`
        SELECT COUNT(DISTINCT session_token) as count
        FROM answers
        WHERE DATE(created_at) = CURRENT_DATE
      `),
      db.query(`
        SELECT COUNT(DISTINCT session_token) as count
        FROM answers
        WHERE level >= 3
      `),
      db.query(`
        SELECT AVG(score) as avg_score FROM (
          SELECT session_token,
                 (SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END)::float * 100 / COUNT(*)) as score
          FROM answers
          GROUP BY session_token
        ) as scores
      `),
      db.query('SELECT COUNT(*) as count FROM answers'),
      db.query('SELECT COUNT(*) as count FROM tokens WHERE is_active = true')
    ])

    const stats = {
      total_students: totalStudents.rows[0]?.count ?? 0,
      active_sessions: activeSessions.rows[0]?.count ?? 0,
      completed_quizzes: completedQuizzes.rows[0]?.count ?? 0,
      average_score: Math.round(averageScore.rows[0]?.avg_score ?? 0),
      total_questions_answered: totalQuestions.rows[0]?.count ?? 0,
      active_tokens: activeTokens.rows[0]?.count ?? 0
    }

    return json({ stats })
    */
  } catch (error) {
    console.error('💥 Dashboard API error:', error) // 🔍 Debug
    return json({ error: 'Server error' }, { status: 500 })
  }
}