// src/routes/api/admin/token/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit'
import { DatabaseQueries } from '$lib/database/queries.js'
import type { APIResponse, TokenData } from '$lib/types/index.js'

// CREATE token
export const POST: RequestHandler = async ({ request }) => {
  try {
    const tokenData = await request.json()

    if (!tokenData.max_usage || !tokenData.created_by) {
      return json({ success: false, error: 'Field max_usage dan created_by wajib diisi.' }, { status: 400 })
    }

    const createdToken = await DatabaseQueries.createToken({
      token_name: tokenData.token_name || '',
      max_usage: tokenData.max_usage,
      expires_at: tokenData.expires_at || null,
      created_by: tokenData.created_by
    })

    return json({ success: true, data: createdToken })
  } catch (error) {
    console.error('❌ Error creating token:', error)
    return json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// READ token
// GET /api/admin/token or /api/admin/token?token=XYZ
export const GET: RequestHandler = async ({ url }) => {
    const token = url.searchParams.get('token')
  
    try {
      const allTokens = await DatabaseQueries.getAllTokens()
  
      if (token) {
        const result = allTokens.find(t => t.token_code === token.toUpperCase())
        if (!result) {
          return json({ success: false, error: 'Token tidak ditemukan.' }, { status: 404 })
        }
        return json({ success: true, data: result })
      }
  
      // Jika tidak ada query token, kembalikan semua
      return json({ success: true, data: allTokens })
    } catch (error) {
      console.error('❌ Error fetching token(s):', error)
      return json({ success: false, error: (error as Error).message }, { status: 500 })
    }
  }
  

// UPDATE token
// export const PATCH: RequestHandler = async ({ request, url }) => {
//   const token = url.searchParams.get('token')
//   if (!token) {
//     return json({ success: false, error: 'Parameter token diperlukan untuk update.' }, { status: 400 })
//   }

//   try {
//     const tokenData: Partial<TokenData> = await request.json()

//     // Pastikan kamu punya method updateTokenByValue di queries
//     const updatedToken = await DatabaseQueries.updateTokenByValue(token.toUpperCase(), tokenData)
//     return json({ success: true, data: updatedToken })
//   } catch (error) {
//     console.error('❌ Error updating token:', error)
//     return json({ success: false, error: (error as Error).message }, { status: 500 })
//   }
// }

// DELETE token
export const DELETE: RequestHandler = async ({ url }) => {
  const token = url.searchParams.get('token')
  if (!token) {
    return json({ success: false, error: 'Parameter token diperlukan untuk menghapus.' }, { status: 400 })
  }

  try {
    await DatabaseQueries.deleteTokenByValue(token.toUpperCase())
    return json({ success: true, data: { message: 'Token berhasil dihapus.' } })
  } catch (error) {
    console.error('❌ Error deleting token:', error)
    return json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
