// src/routes/api/validate-token/+server.ts - DATABASE VERSION
import { json, type RequestHandler } from '@sveltejs/kit'
import { DatabaseQueries } from '$lib/database/queries.js'
import type { APIResponse } from '$lib/types/index.js'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const token = url.searchParams.get('token')

    console.log('🔐 Token validation request:', token)

    // Jika tidak ada token, izinkan (untuk development/open access)
    if (!token || token.trim() === '') {
      console.log('ℹ️ No token provided - allowing access')
      const response: APIResponse = { 
        success: true, 
        data: { message: 'No token required' } 
      }
      return json(response)
    }

    const tokenCode = token.trim().toUpperCase()
    console.log('🔍 Validating token:', tokenCode)

    // Validasi format token (harus 6 karakter)
    if (tokenCode.length !== 6) {
      console.log('❌ Invalid token format:', tokenCode)
      const errorResponse: APIResponse = { 
        success: false, 
        error: 'Token harus 6 karakter alfanumerik' 
      }
      return json(errorResponse, { status: 400 })
    }

    // Cek token di database
    const validToken = await DatabaseQueries.validateToken(tokenCode)
    
    if (!validToken) {
      console.log('❌ Token not found or invalid:', tokenCode)
      const errorResponse: APIResponse = { 
        success: false, 
        error: 'Token tidak valid, sudah expired, atau sudah habis masa berlaku' 
      }
      return json(errorResponse, { status: 400 })
    }

    console.log('✅ Token found:', {
      token_code: validToken.token_code,
      token_name: validToken.token_name,
      usage_count: validToken.usage_count,
      max_usage: validToken.max_usage,
      expires_at: validToken.expires_at
    })

    // Cek apakah token masih bisa digunakan
    if (validToken.usage_count >= validToken.max_usage) {
      console.log('❌ Token usage limit exceeded:', {
        current: validToken.usage_count,
        max: validToken.max_usage
      })
      const errorResponse: APIResponse = { 
        success: false, 
        error: `Token sudah mencapai batas penggunaan (${validToken.max_usage}x)` 
      }
      return json(errorResponse, { status: 400 })
    }

    // Cek apakah token sudah expired
    if (validToken.expires_at && new Date(validToken.expires_at) < new Date()) {
      console.log('❌ Token expired:', validToken.expires_at)
      const errorResponse: APIResponse = { 
        success: false, 
        error: 'Token sudah expired' 
      }
      return json(errorResponse, { status: 400 })
    }

    // Token valid, gunakan token (increment usage count)
    const tokenUsed = await DatabaseQueries.useToken(tokenCode)
    
    if (!tokenUsed) {
      console.log('❌ Failed to use token (possible race condition)')
      const errorResponse: APIResponse = { 
        success: false, 
        error: 'Gagal menggunakan token. Silakan coba lagi.' 
      }
      return json(errorResponse, { status: 500 })
    }

    const remainingUses = validToken.max_usage - (validToken.usage_count + 1)
    
    console.log('✅ Token validated and used successfully:', {
      token_code: validToken.token_code,
      new_usage_count: validToken.usage_count + 1,
      remaining_uses: remainingUses
    })

    const successResponse: APIResponse = { 
      success: true,
      data: {
        token_code: validToken.token_code,
        token_name: validToken.token_name || 'Token Quiz',
        remaining_uses: remainingUses,
        expires_at: validToken.expires_at,
        message: remainingUses > 0 
          ? `Token berhasil divalidasi. Sisa penggunaan: ${remainingUses}x`
          : 'Token berhasil divalidasi. Ini adalah penggunaan terakhir.'
      }
    }
    return json(successResponse)

  } catch (error) {
    console.error('❌ Database error in /api/validate-token:', error)
    const errorResponse: APIResponse = { 
      success: false, 
      error: 'Gagal memvalidasi token: ' + (error as Error).message 
    }
    return json(errorResponse, { status: 500 })
  }
}