// routes/api/admin/analytics/+server.ts - Corrected
import { db } from "$lib/database/connection"
import { verifyJWT } from "$lib/utils/jwtUtils" // ✅ Use server-only JWT utils
import type { RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = async ({ cookies }) => {
    try {
      console.log('📈 Analytics API called') // 🔍 Debug
      
      const adminSession = cookies.get('admin_session')
      if (!adminSession) {
        console.log('❌ No admin session cookie') // 🔍 Debug
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
  
      // ✅ Use server-only JWT verification
      const adminUser = verifyJWT(adminSession)
      if (!adminUser) {
        console.log('❌ Invalid JWT token') // 🔍 Debug
        return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })
      }
  
      console.log('✅ Admin authorized for analytics:', adminUser.username) // 🔍 Debug
  
      // Get analytics data
      const [dailyStats, weeklyStats, performanceStats] = await Promise.all([
        getDailyStats(),
        getWeeklyStats(),
        getPerformanceStats()
      ])
  
      console.log('📈 Returning analytics data') // 🔍 Debug
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          daily: dailyStats,
          weekly: weeklyStats,
          performance: performanceStats
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
  
    } catch (error) {
      console.error('💥 Analytics API error:', error) // 🔍 Debug
      return new Response(JSON.stringify({ 
        error: 'Server error',
        success: false 
      }), { status: 500 })
    }
  }
  
  async function getDailyStats() {
    try {
      const daily = await db.query(`
        SELECT 
          DATE(answered_at) as date,
          COUNT(DISTINCT session_id) as sessions,
          COUNT(*) as total_answers,
          AVG(CASE WHEN is_correct = true THEN 100 ELSE 0 END) as avg_score
        FROM quiz_answers  
        WHERE answered_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(answered_at)
        ORDER BY date ASC
      `);      

      const stats = daily.rows
  
      return stats.map(stat => ({
        date: stat.date,
        sessions: stat.sessions,
        answers: stat.total_answers,
        avgScore: Math.round(stat.avg_score)
      }))
    } catch (error) {
      console.error('Error getting daily stats:', error)
      return []
    }
  }
  
  async function getWeeklyStats() {
    try {
      const weekly = await db.query(`
        SELECT 
          TO_CHAR(qs.created_at, 'IYYY-IW') as week,
          COUNT(DISTINCT qs.session_token) as sessions,
          COUNT(*) as total_answers
        FROM quiz_answers qa
        JOIN quiz_sessions qs ON qa.session_id = qs.id
        WHERE qa.created_at >= CURRENT_DATE - INTERVAL '4 weeks'
        GROUP BY TO_CHAR(qs.created_at, 'IYYY-IW')
        ORDER BY week ASC
      `)
  
      const stats = weekly.rows
  
      return stats.map(stat => ({
        week: stat.week,
        sessions: stat.sessions,
        answers: stat.total_answers
      }))
    } catch (error) {
      console.error('Error getting weekly stats:', error)
      return []
    }
  }
  
  
  async function getPerformanceStats() {
    try {
      const performance = await db.query(`
        SELECT 
          level,
          COUNT(*) as total_questions,
          SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct_answers,
          AVG(CASE WHEN is_correct = true THEN 100 ELSE 0 END) as avg_score
        FROM quiz_answers 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY level
        ORDER BY level ASC
      `)
      

      const stats = performance.rows
  
      return stats.map(stat => ({
        level: `Level ${stat.level}`,
        totalQuestions: stat.total_questions,
        correctAnswers: stat.correct_answers,
        avgScore: Math.round(stat.avg_score),
        accuracy: Math.round((stat.correct_answers / stat.total_questions) * 100)
      }))
    } catch (error) {
      console.error('Error getting performance stats:', error)
      return []
    }
  }