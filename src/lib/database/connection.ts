// src/lib/database/connection.ts - FIXED VERSION
import { Pool, type PoolConfig, type QueryResult } from 'pg'
import { dev } from '$app/environment'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Fallback configuration jika DATABASE_URL tidak ada
const config: PoolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: dev ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'ump_quiz',
      password: process.env.DB_PASSWORD || '123456',
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

console.log('🔧 Database config:', {
  host: config.host || 'from connection string',
  database: config.database || 'from connection string',
  user: config.user || 'from connection string'
})

export const pool = new Pool(config)

export const db = {
  query: (text: string, params?: any[]): Promise<QueryResult<any>> => pool.query(text, params),
  getClient: () => pool.connect()
}

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully')
})

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err)
})

// Test connection saat startup
pool.query('SELECT NOW() as current_time')
  .then(result => {
    console.log('✅ Database connection test successful:', result.rows[0].current_time)
  })
  .catch(err => {
    console.error('❌ Database connection test failed:', err.message)
  })