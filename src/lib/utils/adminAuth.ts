// lib/utils/adminAuth.ts - Client-Only Functions (NO JWT verification here)

// Client-side loginAdmin function
export async function loginAdmin(username: string, password: string) {
  try {
    console.log('📡 Sending login request for:', username) // 🔍 Debug
    
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include' // ✅ Important for cookies
    })
    
    console.log('📡 Response status:', response.status) // 🔍 Debug
    console.log('📡 Response ok:', response.ok) // 🔍 Debug
    
    // Check content type
    const contentType = response.headers.get('content-type')
    console.log('📋 Content-Type:', contentType) // 🔍 Debug
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Response is not JSON!') // 🔍 Debug
      const responseText = await response.text()
      console.error('📄 Response text:', responseText.substring(0, 200)) // 🔍 Debug
      
      return {
        success: false,
        error: 'Server returned invalid response format'
      }
    }
    
    let result
    try {
      result = await response.json()
      console.log('📡 Login response data:', result) // 🔍 Debug
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError) // 🔍 Debug
      return {
        success: false,
        error: 'Failed to parse server response'
      }
    }
    
    if (response.ok && result.success) {
      console.log('✅ Login successful, JWT cookie should be set') // 🔍 Debug
      console.log('🍪 Checking cookies after login...') // 🔍 Debug
      console.log('🍪 Document cookies:', document.cookie) // 🔍 Debug
      
      // Verify JWT cookie was set
      const cookieSet = document.cookie.includes('admin_session=')
      console.log('🔍 Admin session cookie set:', cookieSet) // 🔍 Debug
      
      return {
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
          isAuthenticated: result.user.isAuthenticated || true,
          loginTime: result.user.loginTime || new Date().toISOString()
        }
      }
    } else {
      console.error('❌ Login failed:', result.error) // 🔍 Debug
      return {
        success: false,
        error: result.error || 'Login gagal'
      }
    }
  } catch (error) {
    console.error('💥 Login network/fetch error:', error) // 🔍 Debug
    return {
      success: false,
      error: 'Terjadi kesalahan jaringan'
    }
  }
}

export async function logoutAdmin() {
  try {
    console.log('🔄 Sending logout request...')
    
    const response = await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📡 Logout response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Logout successful:', result)
      return { success: true, message: result.message }
    } else {
      const errorText = await response.text()
      console.error('❌ Logout failed:', errorText)
      return { success: false, error: errorText || 'Logout failed' }
    }
  } catch (error) {
    console.error('💥 Logout network error:', error)
    return { success: false, error: 'Network error' }
  }
}

// Client-side function to check if session cookie exists
export function checkSessionCookie(): boolean {
  if (typeof document === 'undefined') return false
  
  const hasSessionCookie = document.cookie.includes('admin_session=')
  console.log('🍪 Session cookie check:', hasSessionCookie) // 🔍 Debug
  
  return hasSessionCookie
}

// Client-side function to test API with current session
export async function testDashboardAPI() {
  try {
    console.log('🧪 Testing dashboard API with current session...')
    
    const response = await fetch('/api/admin/dashboard', {
      credentials: 'include'
    })
    
    console.log('🧪 Dashboard API response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('🧪 Dashboard API response data:', result)
      return { success: true, data: result }
    } else {
      const errorText = await response.text()
      console.log('🧪 Dashboard API error:', errorText.substring(0, 200))
      return { success: false, error: errorText }
    }
  } catch (error) {
    console.error('🧪 Dashboard API test error:', error)
    return { success: false, error: error }
  }
}

// ❌ REMOVED: verifyAdminSession - This should ONLY be on server-side
// JWT verification is handled by server-side code only