// routes/admin/+layout.server.ts - Corrected
import { redirect } from '@sveltejs/kit'
import { verifyJWT } from '$lib/utils/jwtUtils' // ✅ Use server-only JWT utils
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ url, cookies }) => {
  const adminSession = cookies.get('admin_session')
  const pathname = url.pathname
  
  console.log('🔍 Server layout check:', { pathname, hasSession: !!adminSession }) // 🔍 Debug
  
  // Allow access to login page without session
  if (pathname === '/admin/login') {
    // If already logged in, redirect to dashboard
    if (adminSession) {
      console.log('🔍 Found session on login page, verifying...') // 🔍 Debug
      
      // ✅ Use server-only JWT verification (no await needed for sync function)
      const adminUser = verifyJWT(adminSession)
      
      if (adminUser) {
        console.log('✅ Already authenticated, redirecting to dashboard') // 🔍 Debug
        throw redirect(302, '/admin/dashboard')
      } else {
        console.log('❌ Invalid session on login page, clearing cookie') // 🔍 Debug
        cookies.delete('admin_session', { path: '/' })
      }
    }
    return { adminUser: null }
  }
  
  // For all other admin routes, check authentication
  if (!adminSession) {
    console.log('❌ No session, redirecting to login:', pathname) // 🔍 Debug
    throw redirect(302, '/admin/login')
  }
  
  console.log('🔍 Verifying JWT for protected route:', pathname) // 🔍 Debug
  console.log('🔍 Session token (first 20 chars):', adminSession.substring(0, 20)) // 🔍 Debug
  
  // ✅ Use server-only JWT verification (no await needed for sync function)
  const adminUser = verifyJWT(adminSession)
  
  if (!adminUser) {
    console.log('❌ JWT verification failed, clearing cookie and redirecting') // 🔍 Debug
    // Invalid session, clear cookie and redirect
    cookies.delete('admin_session', { path: '/' })
    throw redirect(302, '/admin/login')
  }
  
  console.log('✅ JWT authentication successful for user:', adminUser.username) // 🔍 Debug
  console.log('✅ User details:', { id: adminUser.id, role: adminUser.role }) // 🔍 Debug
  
  // Return properly typed adminUser object
  return {
    adminUser: {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    }
  }
}