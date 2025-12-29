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
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	
	namespace NodeJS {
		interface ProcessEnv {
			DATABASE_URL: string;
			DB_USER: string;
			DB_PASSWORD: string;
			DB_HOST: string;
			DB_PORT: string;
			DB_NAME: string;
			JWT_SECRET: string;
		}
	}
}

export {};