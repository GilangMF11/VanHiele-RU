// ==========================================
// 7. lib/utils/constants.ts - App Constants
// ==========================================
export const APP_CONFIG = {
    name: 'Quiz Management System',
    version: '1.0.0',
    description: 'Sistem manajemen quiz untuk ujian masuk perguruan tinggi'
  }
  
  export const ROUTES = {
    ADMIN: {
      LOGIN: '/admin/login',
      DASHBOARD: '/admin/dashboard',
      RESULTS: '/admin/results',
      TOKENS: '/admin/tokens',
      LOGOUT: '/admin/logout'
    },
    API: {
      ADMIN_AUTH: '/api/admin/auth',
      ADMIN_DASHBOARD: '/api/admin/dashboard',
      ADMIN_RESULTS: '/api/admin/results',
      ADMIN_TOKENS: '/api/admin/tokens',
      REALTIME: '/api/admin/realtime'
    }
  }
  
  export const QUIZ_CONFIG = {
    MAX_WRONG_ANSWERS: 3,
    LEVELS: {
      MIN: 0,
      MAX: 3
    },
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
    AUTO_SAVE_INTERVAL: 30 * 1000 // 30 seconds
  }
  
  export const UI_CONFIG = {
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 10,
      PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
    },
    NOTIFICATIONS: {
      AUTO_DISMISS_DELAY: 5000,
      MAX_NOTIFICATIONS: 5
    },
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200
  }
  
  export const VALIDATION_PATTERNS = {
    USERNAME: /^[a-zA-Z0-9_-]+$/,
    TOKEN: /^[A-Z0-9]+$/,
    PHONE: /^(\+62|0)[0-9]{9,12}$/,
    PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
  }
  
  export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
    UNAUTHORIZED: 'Anda tidak memiliki akses. Silakan login kembali.',
    FORBIDDEN: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
    NOT_FOUND: 'Data yang dicari tidak ditemukan.',
    SERVER_ERROR: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
    VALIDATION_ERROR: 'Data yang dimasukkan tidak valid.',
    RATE_LIMIT: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.'
  }
  
  export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login berhasil! Selamat datang.',
    LOGOUT_SUCCESS: 'Logout berhasil. Sampai jumpa!',
    CREATE_SUCCESS: 'Data berhasil dibuat.',
    UPDATE_SUCCESS: 'Data berhasil diperbarui.',
    DELETE_SUCCESS: 'Data berhasil dihapus.',
    EXPORT_SUCCESS: 'Data berhasil diekspor.'
  }