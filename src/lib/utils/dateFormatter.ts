// ==========================================
// 5. lib/utils/dateFormatter.ts - Date & Time Utilities
// ==========================================
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '-'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return '-'
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }
    
    return dateObj.toLocaleDateString('id-ID', defaultOptions)
  }
  
  export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return '-'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return '-'
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }
    
    return dateObj.toLocaleString('id-ID', defaultOptions)
  }
  
  export function formatTime(seconds: number): string {
    if (!seconds || seconds < 0) return '0:00'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }
  
  export function timeAgo(date: string | Date): string {
    if (!date) return '-'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return '-'
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Baru saja'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} menit yang lalu`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} jam yang lalu`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} hari yang lalu`
    } else {
      return formatDate(dateObj)
    }
  }
  
  export function isToday(date: string | Date): boolean {
    if (!date) return false
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    
    return dateObj.toDateString() === today.toDateString()
  }
  
  export function isThisWeek(date: string | Date): boolean {
    if (!date) return false
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return dateObj >= weekAgo && dateObj <= today
  }