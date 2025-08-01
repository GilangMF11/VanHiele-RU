import { json, type RequestHandler } from '@sveltejs/kit'
import { db } from '$lib/database/connection'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || '66d55d81150fa152424d541234343140'

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    )

    if (result.rows.length === 0) {
      return json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const adminUser = result.rows[0]
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash)

    if (!isValidPassword) {
      return json({ error: 'Password Salah!' }, { status: 401 })
    }

    const token = jwt.sign(
      {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60
    })

    const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    null

    await db.query(
    `INSERT INTO admin_logs (user_id, action, description, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)`,
    [
        adminUser.id,
        'login',
        'Admin login successful',
        ip,
        request.headers.get('user-agent') || null
    ]
    )


    const user = {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      token: token
    }

    return json({
  success: true,
  user
})  
  } catch (error) {
    console.error('Admin login error:', error)
    return json({ error: 'Server error' }, { status: 500 })
  }
}
