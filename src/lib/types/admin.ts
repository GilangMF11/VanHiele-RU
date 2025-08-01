// lib/types/admin.ts

// ===== EXISTING INTERFACES (PRESERVED) =====

export interface AdminUser {
  id: string
  username: string
  email?: string
  role: 'admin' | 'super_admin'
  isAuthenticated: boolean
  loginTime?: string
  lastLogin?: string
}

export interface DashboardStats {
  total_students: number
  active_sessions: number
  completed_quizzes: number
  average_score: number
  total_questions_answered: number
  active_tokens: number
  recent_activity?: RecentActivity[]
}

export interface RecentActivity {
  student_name: string
  student_class: string
  level: number
  is_correct: boolean
  created_at: string
}

export interface StudentResult {
  id: string
  student_name: string
  student_class: string
  student_school: string
  level: number
  total_questions: number
  correct_answers: number
  wrong_answers: number
  score_percentage: number
  time_taken: number // in seconds
  completion_date: string | null
  session_token: string
  answers: StudentAnswer[]
}

export interface StudentAnswer {
  question_id: string
  question_text: string
  selected_answer: string
  correct_answer: string
  is_correct: boolean
  level: number
  timestamp: string
}

export interface TokenData {
  id: string
  token: string
  description: string
  is_active: boolean
  created_date: string
  updated_at?: string
  expires_at?: string
  usage_count: number
  current_usage: number
  max_usage?: number
  created_by?: string
  created_by_name?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Layout types
export interface LayoutData {
  adminUser: AdminUser | null
  serverTime?: string
  initialStats?: DashboardStats | null
}

// ===== ADDITIONAL INTERFACES (NEW) =====

// Enhanced admin interfaces
export interface AdminDashboardStats extends DashboardStats {
  // This extends the existing DashboardStats with additional properties
  growth_rate?: number
  last_updated?: string
  performance_trend?: 'up' | 'down' | 'stable'
  weekly_summary?: WeeklySummary
}

export interface WeeklySummary {
  sessions_this_week: number
  sessions_last_week: number
  new_students_this_week: number
  completion_rate_this_week: number
  average_score_this_week: number
}

// Analytics interfaces
export interface AnalyticsData {
  daily: DailyAnalytics[]
  weekly: WeeklyAnalytics[]
  performance: PerformanceAnalytics[]
}

export interface DailyAnalytics {
  date: string
  sessions: number | string
  answers: number | string
  avgScore: number
}

export interface WeeklyAnalytics {
  week: string
  sessions: number | string
  answers: number | string
}

export interface PerformanceAnalytics {
  level: string
  totalQuestions: number | string
  correctAnswers: number | string
  avgScore: number
  accuracy: number
}

// Notification system
export interface AdminNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
  autoHide?: boolean
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// Extended student interfaces
export interface StudentAnswerDetailed extends StudentAnswer {
  id: string
  points_earned: number
  time_taken?: number
  answered_at: string
  session_id: string
  student_id: string
}

export interface StudentSession {
  id: string
  student_id: string
  session_token: string
  current_level: number
  current_question: number
  wrong_count: number
  status: 'active' | 'completed' | 'stopped' | 'timeout'
  started_at: string
  completed_at?: string
  ip_address?: string
  user_agent?: string
}

export interface StudentProfile {
  id: string
  full_name: string
  class: string
  school: string
  student_number?: string
  phone?: string
  email?: string
  total_sessions: number
  highest_level: number
  best_score: number
  average_score: number
  total_time: number
  last_activity: string
  created_at: string
}

// Enhanced token interfaces
export interface TokenDataExtended extends TokenData {
  // Extends existing TokenData
  token_code: string
  token_name?: string
  is_active: boolean
  usage_statistics?: TokenUsageStats
  permissions?: TokenPermissions
  metadata?: Record<string, any>
}

export interface TokenUsageStats {
  total_sessions: number
  unique_students: number
  success_rate: number
  last_used_at?: string
  most_active_day?: string
  geographic_distribution?: Array<{
    region: string
    count: number
  }>
}

export interface TokenPermissions {
  allowed_levels: number[]
  time_restrictions?: {
    start_time?: string
    end_time?: string
    days_of_week?: number[]
  }
  ip_whitelist?: string[]
  concurrent_sessions_limit?: number
}

// API response interfaces
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ResultsAPIResponse extends PaginatedResponse<StudentResult> {
  filters_applied?: Record<string, any>
  sort_config?: SortConfig
}

export interface FilterParams {
  level?: string | number
  school?: string
  student_class?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  status?: 'completed' | 'in_progress' | 'all'
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// UI and form interfaces
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox'
  value: any
  placeholder?: string
  required?: boolean
  validation?: ValidationRule[]
  options?: Array<{ value: any; label: string }>
  disabled?: boolean
  help_text?: string
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min_length' | 'max_length' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  touched: Record<string, boolean>
}

// Navigation and layout
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: string
  badge?: string | number
  children?: NavigationItem[]
  permission?: string
  external?: boolean
  target?: '_blank' | '_self'
}

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: string
  current?: boolean
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto'
  sidebarCollapsed: boolean
  tableRowsPerPage: number
  autoRefresh: boolean
  autoRefreshInterval: number
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
}

// Export and import
export interface ExportOptions {
  format: 'excel' | 'csv' | 'json' | 'pdf'
  filename?: string
  includeHeaders: boolean
  includeMetadata: boolean
  dateRange?: {
    from: string
    to: string
  }
  filters?: FilterParams
  columns?: string[]
  maxRecords?: number
}

export interface ImportOptions {
  format: 'excel' | 'csv' | 'json'
  hasHeaders: boolean
  mapping?: Record<string, string>
  validation?: {
    strict: boolean
    skipErrors: boolean
    maxErrors: number
  }
  preview?: boolean
}

export interface ExportResult {
  id: string
  filename: string
  format: string
  downloadUrl?: string
  size: number
  recordCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  error?: string
  createdAt: string
  expiresAt?: string
}

// Statistics and analytics
export interface QuizStatistics {
  overview: {
    total_questions: number
    total_answers: number
    unique_students: number
    completion_rate: number
    average_time_per_question: number
  }
  performance: {
    accuracy_by_level: Array<{
      level: number
      accuracy: number
      question_count: number
    }>
    difficulty_analysis: Array<{
      question_id: string
      level: number
      difficulty_score: number
      error_rate: number
    }>
    time_analysis: {
      fastest_completion: number
      slowest_completion: number
      average_completion: number
      median_completion: number
    }
  }
  trends: {
    daily_activity: Array<{
      date: string
      sessions: number
      completion_rate: number
    }>
    weekly_patterns: Array<{
      day_of_week: number
      peak_hours: number[]
      activity_level: 'low' | 'medium' | 'high'
    }>
  }
}

export interface SchoolStatistics {
  school_name: string
  total_students: number
  active_students: number
  average_score: number
  completion_rate: number
  class_breakdown: Array<{
    class_name: string
    student_count: number
    average_score: number
    top_performers: number
  }>
  level_progress: Array<{
    level: number
    students_attempted: number
    students_completed: number
    average_score: number
  }>
}

// Real-time and websocket
export interface WebSocketMessage {
  type: 'notification' | 'data_update' | 'user_activity' | 'system_status'
  payload: any
  timestamp: string
  sender?: string
}

export interface RealTimeUpdate {
  type: 'student_result' | 'dashboard_stats' | 'new_session' | 'token_usage'
  data: any
  affected_pages?: string[]
  priority: 'low' | 'medium' | 'high'
}

// Audit and logging
export interface AdminLog {
  id: string
  user_id: string
  username: string
  action: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  session_id?: string
  success: boolean
  error_message?: string
  duration_ms?: number
  created_at: string
}

export interface AuditTrail {
  entity_type: string
  entity_id: string
  changes: Array<{
    field: string
    old_value: any
    new_value: any
    changed_by: string
    changed_at: string
  }>
}

// System and configuration
export interface SystemConfig {
  app_name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  features: {
    real_time_updates: boolean
    export_functionality: boolean
    advanced_analytics: boolean
    audit_logging: boolean
    api_rate_limiting: boolean
  }
  limits: {
    max_file_size: number
    max_export_records: number
    session_timeout: number
    api_rate_limit: number
  }
  integrations: {
    email_service: boolean
    storage_service: boolean
    analytics_service: boolean
  }
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: Array<{
    name: string
    status: 'up' | 'down' | 'degraded'
    response_time?: number
    error?: string
  }>
  metrics: {
    memory_usage: number
    cpu_usage: number
    disk_usage: number
    active_connections: number
  }
}

// Error handling
export interface AdminError {
  code: string
  message: string
  details?: any
  timestamp: string
  request_id?: string
  user_id?: string
  stack_trace?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
  retryCount: number
  lastRetry?: string
}

// Utility types
export type AdminRole = 'admin' | 'super_admin'
export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export type SortDirection = 'asc' | 'desc'
export type ExportFormat = 'excel' | 'csv' | 'json' | 'pdf'
export type Theme = 'light' | 'dark' | 'auto'
export type ConnectionStatus = 'online' | 'offline' | 'reconnecting'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Bulk operations
export interface BulkOperation {
  id: string
  type: 'delete' | 'update' | 'export' | 'import'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  total_items: number
  processed_items: number
  failed_items: number
  progress: number
  started_at: string
  completed_at?: string
  error_details?: Array<{
    item_id: string
    error: string
  }>
  result_summary?: Record<string, any>
}

// Cache and performance
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags?: string[]
}

export interface PerformanceMetrics {
  page_load_time: number
  api_response_times: Record<string, number>
  render_time: number
  memory_usage: number
  cache_hit_rate: number
  error_rate: number
}

// Search and filtering
export interface SearchResult<T = any> {
  items: T[]
  total: number
  query: string
  took: number
  suggestions?: string[]
  facets?: Record<string, Array<{
    value: string
    count: number
  }>>
}

export interface AdvancedFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'starts_with' | 'ends_with'
  value: any
  type: 'string' | 'number' | 'date' | 'boolean' | 'array'
}

// Integration interfaces
export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret?: string
  active: boolean
  retry_policy: {
    max_retries: number
    retry_delay: number
    backoff_factor: number
  }
  headers?: Record<string, string>
}

export interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  rate_limit?: number
  expires_at?: string
  last_used_at?: string
  created_by: string
  created_at: string
}
