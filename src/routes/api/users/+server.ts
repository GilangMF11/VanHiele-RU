// src/routes/api/users/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit'
import { DatabaseQueries } from '$lib/database/queries.js'
import type { APIResponse } from '$lib/types/index.js'

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    const userData = await request.json()
    const { name, class: studentClass, school, token } = userData

    // Validasi data input
    if (!name?.trim() || !studentClass?.trim() || !school?.trim()) {
      const errorResponse: APIResponse = {
        success: false,
        error: 'Data tidak lengkap. Harap isi semua kolom.'
      }
      return json(errorResponse, { status: 400 })
    }

    console.log('📝 Saving user data & creating session:', {
      name: name.trim(),
      class: studentClass.trim(),
      school: school.trim(),
      token: token || '(no token)'
    })

    // Buat atau ambil student + session
    const result = await DatabaseQueries.getOrCreateStudentWithSession(
      name.trim(),
      studentClass.trim(),
      school.trim(),
      token || undefined,
      getClientAddress() || undefined,
      request.headers.get('user-agent') || undefined
    )

    const { student, session, isNewStudent } = result

    console.log('✅ Student:', student.id, '| Session:', session.session_token)

    const successResponse: APIResponse = {
      success: true,
      data: {
        student_id: student.id,
        name: student.full_name,
        class: student.class,
        school: student.school,
        session_id: session.id,
        session_token: session.session_token,
        is_new_student: isNewStudent
      }
    }

    return json(successResponse)

  } catch (error) {
    console.error('❌ Error in /api/users:', error)
    const errorResponse: APIResponse = {
      success: false,
      error: 'Gagal menyimpan ke database: ' + (error as Error).message
    }
    return json(errorResponse, { status: 500 })
  }
}
