// src/routes/api/upload-image/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { APIResponse } from '$lib/types/index.js'

const UPLOAD_DIR = 'static/images/quiz'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const questionId = formData.get('questionId') as string
    const level = formData.get('level') as string

    // Validation
    if (!file || !questionId || !level) {
      return json({ 
        success: false, 
        error: 'Missing required fields: image, questionId, level' 
      } as APIResponse, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      } as APIResponse, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return json({ 
        success: false, 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      } as APIResponse, { status: 400 })
    }

    // Create directory if it doesn't exist
    const levelDir = path.join(UPLOAD_DIR, `level${level}`)
    if (!existsSync(levelDir)) {
      await mkdir(levelDir, { recursive: true })
    }

    // Generate filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${questionId}.${extension}`
    const filepath = path.join(levelDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return relative path for frontend
    const relativePath = `level${level}/${filename}`

    console.log('✅ Image uploaded successfully:', {
      questionId,
      level,
      filename,
      size: file.size,
      type: file.type
    })

    return json({ 
      success: true, 
      data: {
        filename,
        path: relativePath,
        url: `/images/quiz/${relativePath}`,
        size: file.size,
        type: file.type
      }
    } as APIResponse)

  } catch (error) {
    console.error('❌ Error uploading image:', error)
    return json({ 
      success: false, 
      error: 'Failed to upload image: ' + (error as Error).message 
    } as APIResponse, { status: 500 })
  }
}

export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const imagePath = url.searchParams.get('path')
    
    if (!imagePath) {
      return json({ 
        success: false, 
        error: 'Missing image path' 
      } as APIResponse, { status: 400 })
    }

    const fullPath = path.join(UPLOAD_DIR, imagePath)
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      return json({ 
        success: false, 
        error: 'Image not found' 
      } as APIResponse, { status: 404 })
    }

    // Delete file
    const { unlink } = await import('fs/promises')
    await unlink(fullPath)

    console.log('✅ Image deleted successfully:', imagePath)

    return json({ 
      success: true, 
      data: { message: 'Image deleted successfully' }
    } as APIResponse)

  } catch (error) {
    console.error('❌ Error deleting image:', error)
    return json({ 
      success: false, 
      error: 'Failed to delete image: ' + (error as Error).message 
    } as APIResponse, { status: 500 })
  }
}