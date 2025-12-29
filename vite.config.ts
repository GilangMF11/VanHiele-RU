import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	// Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
	const env = loadEnv(mode, process.cwd(), '');
	
	return {
		plugins: [sveltekit()],
		define: {
			'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
			'process.env.DB_USER': JSON.stringify(env.DB_USER),
			'process.env.DB_PASSWORD': JSON.stringify(env.DB_PASSWORD),
			'process.env.DB_HOST': JSON.stringify(env.DB_HOST),
			'process.env.DB_PORT': JSON.stringify(env.DB_PORT),
			'process.env.DB_NAME': JSON.stringify(env.DB_NAME),
			'process.env.JWT_SECRET': JSON.stringify(env.JWT_SECRET)
		}
	};
});
