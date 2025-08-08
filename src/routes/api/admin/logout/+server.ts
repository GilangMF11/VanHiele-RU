import { json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    console.log('🚪 Admin logout requested')

    // Clear the admin session cookie
    cookies.delete('admin_session', { 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    console.log('✅ Admin session cookie cleared')

    return json({ 
      success: true, 
      message: 'Logout successful' 
    })

  } catch (error) {
    console.error('❌ Logout error:', error)
    return json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500 })
  }
}
