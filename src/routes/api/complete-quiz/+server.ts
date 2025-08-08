import { json, type RequestHandler } from '@sveltejs/kit'
import { DatabaseQueries } from '$lib/database/queries.js'
import { db } from '$lib/database/connection'
import type { APIResponse } from '$lib/types/index.js'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()
    const {
      session_token,
      status: providedStatus,
      session_id: providedSessionId
    } = body

    // 1) Resolve session
    let session = null
    if (session_token) {
      session = await DatabaseQueries.getSessionByToken(String(session_token))
    } else if (providedSessionId) {
      session = await DatabaseQueries.getSessionById(Number(providedSessionId))
    }

    if (!session) {
      return json({ success: false, error: 'Session not found. Provide valid session_token or session_id' } as APIResponse, { status: 400 })
    }

    const sessionId = Number(session.id)
    const studentId = Number(session.student_id)

    // 2) Ensure only one summary per session
    const existing = await DatabaseQueries.getQuizResultBySessionId(sessionId)
    if (existing) {
      return json({ success: true, duplicate: true, summary: existing } as APIResponse, { status: 200 })
    }

    // 3) Compute aggregates from quiz_answers for this session
    const aggQuery = `
      SELECT 
        COUNT(*)::int AS total_questions,
        SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END)::int AS correct_answers,
        SUM(CASE WHEN is_correct = false THEN 1 ELSE 0 END)::int AS wrong_answers,
        COALESCE(SUM(points_earned), 0)::int AS total_score,
        ROUND(
          (SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
        )::float AS percentage,
        MAX(level)::int AS max_level_answered,
        COALESCE(SUM(time_taken), 0)::int AS time_spent_sum,
        EXTRACT(EPOCH FROM (MAX(answered_at) - MIN(answered_at)))::int AS time_span
      FROM quiz_answers
      WHERE session_id = $1
    `
    const aggRes = await db.query(aggQuery, [sessionId])
    const agg = aggRes.rows[0] || {}

    const total_questions = Number(agg.total_questions || 0)
    const correct_answers = Number(agg.correct_answers || 0)
    const wrong_answers = Number(agg.wrong_answers || 0)
    const total_score = Number(agg.total_score || correct_answers)
    const percentage = Number(agg.percentage || 0)
    // Normalisasi level agar konsisten dengan frontend (0-based di UI)
    const highest_level_reached = (
      agg.max_level_answered !== null && agg.max_level_answered !== undefined
        ? Number(agg.max_level_answered)
        : Math.max((Number(session.current_level || 1) - 1), 0)
    )
    const time_spent = Number((agg.time_spent_sum && agg.time_spent_sum > 0 ? agg.time_spent_sum : agg.time_span) || 0)
    const status = providedStatus || (session.status === 'completed' ? 'completed' : 'completed')

    // 4) Insert summary
    const summary = await DatabaseQueries.createQuizResult({
      student_id: studentId,
      session_id: sessionId,
      total_questions,
      correct_answers,
      wrong_answers,
      total_score,
      percentage,
      highest_level_reached,
      time_spent,
      status
    })

    // 5) Mark session completed if not already
    try {
      await DatabaseQueries.updateQuizSession(sessionId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      } as any)
    } catch (e) {
      // non-blocking
    }

    return json({ success: true, summary } as APIResponse, { status: 200 })
  } catch (error) {
    console.error('Error processing request:', error)
    return json({ success: false, error: (error as Error).message } as APIResponse, { status: 500 })
  }
} 
