// src/lib/utils/imageUtils.ts
export class ImageUtils {
    static readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    static readonly MAX_WIDTH = 1200
    static readonly MAX_HEIGHT = 800
  
    /**
     * Convert file to base64
     */
    static async fileToBase64(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
      })
    }
  
    /**
     * Validate image file
     */
    static validateImageFile(file: File): { valid: boolean; error?: string } {
      // Check file type
      if (!this.SUPPORTED_FORMATS.includes(file.type)) {
        return {
          valid: false,
          error: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.'
        }
      }
  
      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `Ukuran file terlalu besar. Maksimal ${this.MAX_FILE_SIZE / (1024 * 1024)}MB.`
        }
      }
  
      return { valid: true }
    }
  
    /**
     * Resize image if needed
     */
    static async resizeImage(file: File, maxWidth: number = this.MAX_WIDTH, maxHeight: number = this.MAX_HEIGHT): Promise<Blob> {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
  
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
  
          // Set canvas size and draw image
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
  
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to resize image'))
              }
            },
            file.type,
            0.8 // Quality for JPEG
          )
        }
  
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
      })
    }
  
    /**
     * Generate filename based on question ID
     */
    static generateFilename(questionId: string, originalFile: File): string {
      const extension = originalFile.name.split('.').pop()?.toLowerCase() || 'png'
      return `${questionId}.${extension}`
    }
  
    /**
     * Get image dimensions
     */
    static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
      })
    }
  
    /**
     * Convert base64 to blob
     */
    static base64ToBlob(base64: string): Blob {
      const byteCharacters = atob(base64.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const mimeType = base64.split(',')[0].split(':')[1].split(';')[0]
      
      return new Blob([byteArray], { type: mimeType })
    }
  
    /**
     * Check if image URL is accessible
     */
    static async checkImageUrl(url: string): Promise<boolean> {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
      } catch {
        return false
      }
    }
  
    /**
     * Get optimized image URL (with different sizes)
     */
    static getOptimizedImageUrl(basePath: string, size: 'thumb' | 'medium' | 'large' = 'medium'): string {
      const sizeSuffix = {
        thumb: '_thumb',
        medium: '_medium', 
        large: ''
      }
  
      const pathParts = basePath.split('.')
      const extension = pathParts.pop()
      const nameWithoutExt = pathParts.join('.')
      
      return `${nameWithoutExt}${sizeSuffix[size]}.${extension}`
    }
  }
  
  // Hook untuk image upload component
  export interface ImageUploadState {
    file: File | null
    preview: string | null
    uploading: boolean
    error: string | null
    progress: number
  }
  
  export function createImageUploadState(): ImageUploadState {
    return {
      file: null,
      preview: null,
      uploading: false,
      error: null,
      progress: 0
    }
  }