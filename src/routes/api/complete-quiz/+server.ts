import { json, type RequestHandler } from '@sveltejs/kit'
import { DatabaseQueries } from '$lib/database/queries.js'
import type { APIResponse } from '$lib/types/index.js'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()
    let {
      student_id,
      session_id,
      total_questions,
      correct_answers,
      wrong_answers,
      total_score,
      percentage,
      highest_level_reached,
      time_spent,
      status
    } = body

    // Jika student_id tidak ada, ambil dari session
    if (!student_id && session_id) {
      const session = await DatabaseQueries.getSessionById(Number(session_id))
      const sessionId = session?.id
      if (!session || !session.student_id) {
        return json({ success: false, error: 'Invalid session_id or student_id not found' } as APIResponse, { status: 400 })
      }
      student_id = session.student_id
      session_id = sessionId
    }

    // Validate required fields
    if (
      !student_id ||
      !session_id ||
      total_questions === undefined ||
      correct_answers === undefined ||
      wrong_answers === undefined ||
      total_score === undefined ||
      percentage === undefined ||
      highest_level_reached === undefined ||
      time_spent === undefined ||
      !status
    ) {
      return json({ success: false, error: 'Missing required fields' } as APIResponse, { status: 400 })
    }

    try {
      const result = await DatabaseQueries.createQuizResult({
        student_id: Number(student_id),
        session_id: Number(session_id),
        total_questions: Number(total_questions),
        correct_answers: Number(correct_answers),
        wrong_answers: Number(wrong_answers),
        total_score: Number(total_score),
        percentage: Number(percentage),
        highest_level_reached: Number(highest_level_reached),
        time_spent: Number(time_spent),
        status
      })

      return json({ success: true, data: result } as APIResponse, { status: 200 })
    } catch (error) {
      console.error('Error saving result summary:', error)
      return json({ success: false, error: (error as Error).message } as APIResponse, { status: 500 })
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return json({ success: false, error: (error as Error).message } as APIResponse, { status: 500 })
  }
} 
