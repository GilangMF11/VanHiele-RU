import { verifyJWT } from "$lib/utils/jwtUtils" // ✅ Use server-only JWT utils
import { db } from '$lib/database/connection'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ cookies }) => {
  const adminSession = cookies.get('admin_session')
  
  if (!adminSession) {
    return new Response('Unauthorized', { status: 401 })
  }

  const adminUser = await verifyJWT(adminSession)
  if (!adminUser) {
    return new Response('Invalid session', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ 
        type: 'connected', 
        timestamp: Date.now(),
        message: 'Real-time connection established' 
      })}\n\n`)

      // Set up interval for periodic updates
      const interval = setInterval(async () => {
        try {
          const [stats, activities] = await Promise.all([
            getDashboardStats(),
            getRecentActivity()
          ])
          
          const data = {
            type: 'dashboard_update',
            timestamp: Date.now(),
            stats,
            recentActivity: activities
          }

          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
        } catch (error) {
          console.error('SSE update error:', error)
          controller.enqueue(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Update failed',
            timestamp: Date.now()
          })}\n\n`)
        }
      }, 30000) // Update every 30 seconds

      // Heartbeat every 10 seconds
      const heartbeat = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ 
          type: 'heartbeat', 
          timestamp: Date.now() 
        })}\n\n`)
      }, 10000)

      // Cleanup on close
      return () => {
        clearInterval(interval)
        clearInterval(heartbeat)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

async function getDashboardStats() {
  try {
    const [
      totalStudents,
      activeSessions,
      completedQuizzes,
      averageScore,
      totalQuestions,
      activeTokens
    ] = await Promise.all([
      db.query('SELECT COUNT(DISTINCT token) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'),
      db.query('SELECT COUNT(DISTINCT session_token) as count FROM quiz_answers WHERE DATE(created_at) = CURDATE()'),
      db.query('SELECT COUNT(DISTINCT session_token) as count FROM quiz_answers WHERE level >= 3'),
      db.query(`
        SELECT AVG(score) as avg_score FROM (
          SELECT session_token, (SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as score 
          FROM quiz_answers 
          GROUP BY session_token
        ) as scores
      `),
      db.query('SELECT COUNT(*) as count FROM quiz_answers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'),
      db.query('SELECT COUNT(*) as count FROM tokens WHERE is_active = 1')
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
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      total_students: 0,
      active_sessions: 0,
      completed_quizzes: 0,
      average_score: 0,
      total_questions_answered: 0,
      active_tokens: 0
    }
  }
}

async function getRecentActivity() {
  try {
    const activities = await db.query(`
      SELECT 
        'quiz_completed' as type,
        u.name as student_name,
        u.class as student_class,
        a.level,
        a.is_correct,
        a.created_at,
        null as token
      FROM quiz_answers a
      JOIN users u ON a.session_token = u.token
      WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
      
      UNION ALL
      
      SELECT 
        'user_registered' as type,
        u.name as student_name,
        u.class as student_class,
        null as level,
        null as is_correct,
        u.created_at,
        u.token
      FROM users u
      WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
      
      ORDER BY created_at DESC
      LIMIT 10
    `)

    return activities || []
  } catch (error) {
    console.error('Error getting recent activity:', error)
    return []
  }
}



