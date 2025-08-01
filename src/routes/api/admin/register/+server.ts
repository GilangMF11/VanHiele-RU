import { json, type RequestHandler } from '@sveltejs/kit'
import { db } from '$lib/database/connection'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || '66d55d81150fa152424d541234343140'

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { username, password, email, full_name, role = 'admin' } = await request.json()

    // Validasi input
    if (!username || !password || !email || !full_name) {
      return json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    // Cek apakah username sudah ada
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return json({ error: 'Username sudah digunakan' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Simpan user baru ke database
    const insertResult = await db.query(
      `INSERT INTO users (username, password_hash, email, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, role`,
      [username, passwordHash, email, full_name, role]
    )

    const newUser = insertResult.rows[0]

    // Buat token JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
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

    return json({
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        isAuthenticated: true,
        loginTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Admin register error:', error)
    return json({ error: 'Server error' }, { status: 500 })
  }
}
