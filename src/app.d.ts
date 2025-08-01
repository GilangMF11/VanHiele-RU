// ==========================================
// 4. src/app.d.ts - App Types Declaration
// ==========================================
import type { AdminUser } from '$lib/types/admin'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      adminUser?: AdminUser | null
      serverTime?: string
      initialStats?: any
    }
    // interface Platform {}
  }
}

export {}