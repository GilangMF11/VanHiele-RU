// lib/stores/admin.ts
import { writable } from 'svelte/store'
import type { AdminUser, AdminDashboardStats, AdminNotification, AnalyticsData } from '$lib/types/admin'

// Admin user store
export const adminUser = writable<AdminUser | null>(null)

// Dashboard stats store
export const dashboardStats = writable<AdminDashboardStats>({
  total_students: 0,
  active_sessions: 0,
  completed_quizzes: 0,
  average_score: 0,
  total_questions_answered: 0,
  active_tokens: 0
})

// Loading states
export const adminLoading = writable<boolean>(false)


// Analytics data store
export const analyticsData = writable<AnalyticsData>({
  daily: [],
  weekly: [],
  performance: []
})

// Notifications store
export const notifications = writable<AdminNotification[]>([])

// Loading states
export const isLoading = writable<boolean>(false)
export const isDashboardLoading = writable<boolean>(false)

// Error state
export const errorMessage = writable<string>('')

// Notification helpers
export function addNotification(type: AdminNotification['type'], message: string, autoHide = true) {
  const notification: AdminNotification = {
    id: generateId(),
    type,
    message,
    timestamp: new Date(),
    autoHide
  }

  notifications.update(current => [...current, notification])

  // Auto remove after 5 seconds if autoHide is true
  if (autoHide) {
    setTimeout(() => {
      removeNotification(notification.id)
    }, 5000)
  }

  return notification.id
}

export function removeNotification(id: string) {
  notifications.update(current => current.filter(n => n.id !== id))
}

export function clearAllNotifications() {
  notifications.set([])
}

// Helper function to generate unique IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Admin session helpers
export function setAdminUser(user: AdminUser) {
  adminUser.set(user)
}

export function clearAdminUser() {
  adminUser.set(null)
}

// Dashboard helpers
export function updateDashboardStats(stats: Partial<AdminDashboardStats>) {
  dashboardStats.update(current => ({
    ...current,
    ...stats
  }))
}

export function updateAnalyticsData(data: Partial<AnalyticsData>) {
  analyticsData.update(current => ({
    ...current,
    ...data
  }))
}

// Loading helpers
export function setLoading(loading: boolean) {
  isLoading.set(loading)
}

export function setDashboardLoading(loading: boolean) {
  isDashboardLoading.set(loading)
}

// Error helpers
export function setError(message: string) {
  errorMessage.set(message)
  if (message) {
    addNotification('error', message)
  }
}

export function clearError() {
  errorMessage.set('')
}

// Admin actions logger (for debugging in development)
export function logAdminAction(action: string, details?: any) {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log(`🔧 Admin Action: ${action}`, details)
  }
}

// ===== ADDITIONAL STORES AND HELPERS =====

// Sidebar state for mobile navigation
export const sidebarOpen = writable<boolean>(false)

// Current page tracking
export const currentPage = writable<string>('')

// Real-time data refresh interval
export const refreshInterval = writable<NodeJS.Timeout | number | null>(null)
// Selected items for bulk operations
export const selectedItems = writable<string[]>([])

// Search and filter state
export const searchQuery = writable<string>('')
export const activeFilters = writable<Record<string, any>>({})

// Theme and UI preferences
export const uiPreferences = writable({
  theme: 'light',
  sidebarCollapsed: false,
  tableRowsPerPage: 25,
  autoRefresh: true,
  autoRefreshInterval: 30000
})

// Connection status
export const connectionStatus = writable<'online' | 'offline' | 'reconnecting'>('online')

// Cache for frequently accessed data
export const dataCache = writable<Record<string, any>>({})

// Additional notification helpers
export function addSuccessNotification(message: string, autoHide = true) {
  return addNotification('success', message, autoHide)
}

export function addErrorNotification(message: string, autoHide = true) {
  return addNotification('error', message, autoHide)
}

export function addWarningNotification(message: string, autoHide = true) {
  return addNotification('warning', message, autoHide)
}

export function addInfoNotification(message: string, autoHide = true) {
  return addNotification('info', message, autoHide)
}

// Sidebar helpers
export function toggleSidebar() {
  sidebarOpen.update(open => !open)
}

export function closeSidebar() {
  sidebarOpen.set(false)
}

export function openSidebar() {
  sidebarOpen.set(true)
}

// Page tracking helpers
export function setCurrentPage(page: string) {
  currentPage.set(page)
  logAdminAction('page_visit', { page })
}

// Bulk operation helpers
export function selectItem(id: string) {
  selectedItems.update(items => {
    if (items.includes(id)) {
      return items.filter(item => item !== id)
    } else {
      return [...items, id]
    }
  })
}

export function selectAllItems(ids: string[]) {
  selectedItems.set(ids)
}

export function clearSelection() {
  selectedItems.set([])
}

export function isItemSelected(id: string): boolean {
  let selected = false
  selectedItems.subscribe(items => {
    selected = items.includes(id)
  })()
  return selected
}

// Search and filter helpers
export function updateSearchQuery(query: string) {
  searchQuery.set(query)
}

export function updateFilter(key: string, value: any) {
  activeFilters.update(filters => ({
    ...filters,
    [key]: value
  }))
}

export function removeFilter(key: string) {
  activeFilters.update(filters => {
    const newFilters = { ...filters }
    delete newFilters[key]
    return newFilters
  })
}

export function clearAllFilters() {
  activeFilters.set({})
  searchQuery.set('')
}

// UI preferences helpers
export function updateUIPreference(key: string, value: any) {
  uiPreferences.update(prefs => ({
    ...prefs,
    [key]: value
  }))
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    const updatedPrefs = { ...uiPreferences, [key]: value }
    localStorage.setItem('admin_ui_preferences', JSON.stringify(updatedPrefs))
  }
}

export function loadUIPreferences() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('admin_ui_preferences')
    if (saved) {
      try {
        const preferences = JSON.parse(saved)
        uiPreferences.set(preferences)
      } catch (error) {
        console.warn('Failed to load UI preferences:', error)
      }
    }
  }
}

// Connection status helpers
export function setConnectionStatus(status: 'online' | 'offline' | 'reconnecting') {
  connectionStatus.set(status)
  
  if (status === 'offline') {
    addWarningNotification('Koneksi terputus. Beberapa fitur mungkin tidak tersedia.', false)
  } else if (status === 'online') {
    addSuccessNotification('Koneksi pulih kembali.')
  }
}

// Cache helpers
export function setCacheData(key: string, data: any, ttl = 300000) { // 5 minutes default TTL
  dataCache.update(cache => ({
    ...cache,
    [key]: {
      data,
      timestamp: Date.now(),
      ttl
    }
  }))
}

export function getCacheData(key: string): any | null {
  let cached = null
  dataCache.subscribe(cache => {
    const item = cache[key]
    if (item && (Date.now() - item.timestamp) < item.ttl) {
      cached = item.data
    }
  })()
  return cached
}

export function clearCache(key?: string) {
  if (key) {
    dataCache.update(cache => {
      const newCache = { ...cache }
      delete newCache[key]
      return newCache
    })
  } else {
    dataCache.set({})
  }
}

// Auto refresh helpers
export function startAutoRefresh(callback: () => void, interval = 30000) {
  // Clear existing interval
  refreshInterval.subscribe(id => {
    if (id) clearInterval(id)
  })()
  
  // Start new interval
  const id = setInterval(callback, interval)
  refreshInterval.set(id)
}

export function stopAutoRefresh() {
  refreshInterval.subscribe(id => {
    if (id) {
      clearInterval(id)
      refreshInterval.set(null)
    }
  })()
}

// Authentication helpers with error handling
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    setConnectionStatus('online')
    const response = await fetch(url, defaultOptions)
    
    // Handle unauthorized responses
    if (response.status === 401) {
      clearAdminUser()
      addErrorNotification('Sesi admin telah berakhir, silakan login kembali')
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
      throw new Error('Unauthorized')
    }

    return response
  } catch (error) {
    setConnectionStatus('offline')
    console.error('Fetch error:', error)
    throw error
  }
}

// Retry mechanism for failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>, 
  maxRetries = 3, 
  delay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      setConnectionStatus('reconnecting')
      const result = await operation()
      setConnectionStatus('online')
      return result
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries - 1) {
        addInfoNotification(`Mencoba ulang... (${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }
  
  setConnectionStatus('offline')
  throw lastError!
}

// Batch operations helper
export async function batchOperation<T>(
  items: T[],
  operation: (item: T) => Promise<any>,
  batchSize = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<any[]> {
  const results: any[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchPromises = batch.map(operation)
    
    try {
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults)
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length)
      }
    } catch (error) {
      console.error('Batch operation error:', error)
      throw error
    }
  }
  
  return results
}

// Reset all stores to initial state
export function resetAllStores() {
  adminUser.set(null)
  dashboardStats.set({
    total_students: 0,
    active_sessions: 0,
    completed_quizzes: 0,
    average_score: 0,
    total_questions_answered: 0,
    active_tokens: 0
  })
  analyticsData.set({
    daily: [],
    weekly: [],
    performance: []
  })
  clearAllNotifications()
  isLoading.set(false)
  isDashboardLoading.set(false)
  errorMessage.set('')
  sidebarOpen.set(false)
  currentPage.set('')
  clearSelection()
  clearAllFilters()
  stopAutoRefresh()
  clearCache()
  setConnectionStatus('online')
}

// Initialize stores on app start
export function initializeStores() {
  loadUIPreferences()
  
  // Setup connection monitoring
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setConnectionStatus('online'))
    window.addEventListener('offline', () => setConnectionStatus('offline'))
  }
  
  // Setup visibility change handling
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check connection
        setConnectionStatus(navigator.onLine ? 'online' : 'offline')
      }
    })
  }
}

// Export convenience functions
export const adminStores = {
  // Core stores
  adminUser,
  dashboardStats,
  analyticsData,
  notifications,
  isLoading,
  isDashboardLoading,
  errorMessage,
  
  // Additional stores
  sidebarOpen,
  currentPage,
  selectedItems,
  searchQuery,
  activeFilters,
  uiPreferences,
  connectionStatus,
  dataCache,
  
  // Helper functions
  addNotification,
  removeNotification,
  clearAllNotifications,
  setAdminUser,
  clearAdminUser,
  updateDashboardStats,
  updateAnalyticsData,
  setLoading,
  setDashboardLoading,
  setError,
  clearError,
  logAdminAction,
  
  // Additional helpers
  addSuccessNotification,
  addErrorNotification,
  addWarningNotification,
  addInfoNotification,
  toggleSidebar,
  closeSidebar,
  openSidebar,
  setCurrentPage,
  selectItem,
  selectAllItems,
  clearSelection,
  isItemSelected,
  updateSearchQuery,
  updateFilter,
  removeFilter,
  clearAllFilters,
  updateUIPreference,
  loadUIPreferences,
  setConnectionStatus,
  setCacheData,
  getCacheData,
  clearCache,
  startAutoRefresh,
  stopAutoRefresh,
  fetchWithAuth,
  retryOperation,
  batchOperation,
  resetAllStores,
  initializeStores
}