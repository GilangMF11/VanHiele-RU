// lib/utils/jwtUtils.ts - Server-Only JWT Utilities
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || '66d55d81150fa152424d541234343140'

export interface JWTPayload {
  id: string
  username: string
  role: string
  iat?: number
  exp?: number
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    console.log('🔍 Server-side JWT verification...') // 🔍 Debug
    console.log('📋 Token type:', typeof token) // 🔍 Debug
    console.log('📋 Token length:', token?.length) // 🔍 Debug
    console.log('📋 Token starts with eyJ (JWT)?', token.startsWith('eyJ')) // 🔍 Debug
    
    if (!token) {
      console.log('❌ No token provided') // 🔍 Debug
      return null
    }
    
    console.log('🔑 Using JWT_SECRET for verification...') // 🔍 Debug
    
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    console.log('✅ JWT verified successfully!') // 🔍 Debug
    console.log('📋 Decoded payload:', {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      exp: decoded.exp,
      iat: decoded.iat
    }) // 🔍 Debug
    
    return decoded
  } catch (error) {
    console.error('❌ JWT verification failed:', error) // 🔍 Debug
    console.error('❌ Error name:', error) // 🔍 Debug
    
    // if (error.name === 'TokenExpiredError') {
    //   console.log('⏰ Token has expired') // 🔍 Debug
    // } else if (error.name === 'JsonWebTokenError') {
    //   console.log('🔒 Invalid token format or signature') // 🔍 Debug
    // } else if (error.name === 'NotBeforeError') {
    //   console.log('🚫 Token not active yet') // 🔍 Debug
    // }
    
    return null
  }
}

export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    console.log('🎫 Generating JWT for user:', payload.username) // 🔍 Debug
    
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '8h',
      issuer: 'quiz-admin-system',
      audience: 'admin-panel'
    })
    
    console.log('✅ JWT generated successfully') // 🔍 Debug
    return token
  } catch (error) {
    console.error('❌ JWT generation failed:', error)
    throw error
  }
}

export function refreshJWT(token: string): string | null {
  try {
    const decoded = verifyJWT(token)
    if (!decoded) return null
    
    // Generate new token with same payload but fresh expiration
    const newToken = generateJWT({
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    })
    
    console.log('🔄 JWT refreshed for user:', decoded.username) // 🔍 Debug
    return newToken
  } catch (error) {
    console.error('❌ JWT refresh failed:', error)
    return null
  }
}

// Helper to extract admin user info from JWT
export function getAdminFromJWT(token: string) {
  const decoded = verifyJWT(token)
  if (!decoded) return null
  
  return {
    id: decoded.id,
    username: decoded.username,
    role: decoded.role,
    isAuthenticated: true
  }
}