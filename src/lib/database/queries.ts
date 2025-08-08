// src/lib/database/queries.ts - COMPLETE FIXED VERSION WITH AUTO SESSION CREATION
import { db } from './connection.js'
import type { Student, QuizSession, QuizAnswer, Token, QuizResultSummary, AdminLog } from '$lib/types/index.js'
import type { AdminUser } from '$lib/types/admin.js'

export class DatabaseQueries {
  // ===== ADMIN USER OPERATIONS =====
  static async getAdminByUsername(username: string): Promise<AdminUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE username = $1 AND is_active = true
    `
    const result = await db.query(query, [username])
    return result.rows[0] as AdminUser || null
  }

  // Add this method to DatabaseQueries class jika belum ada:

static async getSessionById(sessionId: number): Promise<QuizSession | null> {
  const query = `SELECT * FROM quiz_sessions WHERE id = $1`
  const result = await db.query(query, [sessionId])
  return result.rows[0] as QuizSession || null
}

// Also add this helper method if not exists:
static async getAnswersBySession(sessionId: number): Promise<QuizAnswer[]> {
  const query = `
    SELECT * FROM quiz_answers 
    WHERE session_id = $1 
    ORDER BY answered_at ASC
  `
  const result = await db.query(query, [sessionId])
  return result.rows as QuizAnswer[]
}



  static async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 AND is_active = true
    `
    const result = await db.query(query, [email])
    return result.rows[0] as AdminUser || null
  }

  static async updateAdminLastLogin(userId: number): Promise<void> {
    const query = `
      UPDATE users 
      SET last_login = NOW(), updated_at = NOW() 
      WHERE id = $1
    `
    await db.query(query, [userId])
  }

  // ===== STUDENT OPERATIONS =====
  static async createStudent(studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    console.log('👤 Creating student:', studentData.full_name)
    const query = `
      INSERT INTO students (full_name, class, school, student_number, phone, email) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `
    const result = await db.query(query, [
      studentData.full_name,
      studentData.class,
      studentData.school,
      studentData.student_number || null,
      studentData.phone || null,
      studentData.email || null
    ])
    const student = result.rows[0] as Student
    console.log('✅ Student created with ID:', student.id)
    return student
  }

  static async getStudentByDetails(fullName: string, studentClass: string, school: string): Promise<Student | null> {
    const query = `
      SELECT * FROM students 
      WHERE full_name = $1 AND class = $2 AND school = $3 
      ORDER BY created_at DESC 
      LIMIT 1
    `
    const result = await db.query(query, [fullName, studentClass, school])
    return result.rows[0] as Student || null
  }

  static async getStudentById(studentId: number): Promise<Student | null> {
    const query = `SELECT * FROM students WHERE id = $1`
    const result = await db.query(query, [studentId])
    return result.rows[0] as Student || null
  }

  // ===== NEW: STUDENT WITH QUIZ SESSION CREATION =====
  /**
   * MAIN METHOD: Get atau create student + quiz session
   * Jika student sudah ada, buat session baru
   * Jika student belum ada, buat student + session
   */
  static async getOrCreateStudentWithSession(
    fullName: string,
    studentClass: string,
    school: string,
    tokenUsed?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ student: Student; session: QuizSession; isNewStudent: boolean }> {
    console.log('🔍 Looking for student:', fullName, studentClass, school)
    
    // Check if student already exists
    let student = await this.getStudentByDetails(fullName, studentClass, school)
    let isNewStudent = false

    if (!student) {
      console.log('👤 Student not found, creating new student...')
      // Create new student
      student = await this.createStudent({
        full_name: fullName,
        class: studentClass,
        school: school
      })
      isNewStudent = true
      console.log('✅ New student created with ID:', student.id)
    } else {
      console.log('✅ Existing student found with ID:', student.id)
    }

    // Create new quiz session for this student
    console.log('🎯 Creating quiz session for student ID:', student.id)
    const sessionToken = tokenUsed || this.generateSessionToken()
    
    const session = await this.createQuizSession({
      student_id: student.id,
      session_token: sessionToken,
      current_level: 1,
      current_question: 0,
      wrong_count: 0,
      status: 'active',
      token_used: tokenUsed?.toString(),
      ip_address: ipAddress?.toString(),
      user_agent: userAgent?.toString()
    })

    console.log('✅ Quiz session created with ID:', session.id)

    return { student, session, isNewStudent }
  }

  /**
   * Create student dan quiz session dalam 1 transaction
   */
  static async createStudentWithQuizSession(
    studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>,
    tokenUsed?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ student: Student; session: QuizSession }> {
    const client = await db.getClient()
    
    try {
      await client.query('BEGIN')

      // 1. Create student
      const studentQuery = `
        INSERT INTO students (full_name, class, school, student_number, phone, email) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `
      const studentResult = await client.query(studentQuery, [
        studentData.full_name,
        studentData.class,
        studentData.school,
        studentData.student_number || null,
        studentData.phone || null,
        studentData.email || null
      ])
      const student = studentResult.rows[0] as Student

      console.log('✅ Student created with ID:', student.id)

      // 2. Generate unique session token
      const sessionToken = tokenUsed || this.generateSessionToken()

      // 3. Create quiz session
      const sessionQuery = `
        INSERT INTO quiz_sessions (
          student_id, session_token, current_level, current_question, 
          wrong_count, status, token_used, ip_address, user_agent
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *
      `
      const sessionResult = await client.query(sessionQuery, [
        student.id,
        sessionToken,
        1, // start from level 1
        0, // start from question 0
        0, // no wrong answers yet
        'active',
        tokenUsed || null,
        ipAddress || null,
        userAgent || null
      ])
      const session = sessionResult.rows[0] as QuizSession

      console.log('✅ Quiz session created with ID:', session.id, 'for student:', student.id)

      await client.query('COMMIT')
      
      return { student, session }
    } catch (error) {
      console.error('❌ Error creating student with session:', error)
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  

  // Helper method to generate unique session token
  private static generateSessionToken(): string {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${randomStr}`.toUpperCase()
  }

  // ===== QUIZ SESSION OPERATIONS =====
  static async createQuizSession(sessionData: Omit<QuizSession, 'id' | 'created_at' | 'updated_at' | 'started_at' | 'completed_at'>): Promise<QuizSession> {
    console.log('📝 Creating quiz session for student ID:', sessionData.student_id)
    
    const query = `
      INSERT INTO quiz_sessions (
        student_id, session_token, current_level, current_question, 
        wrong_count, status, token_used, ip_address, user_agent
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `
    const result = await db.query(query, [
      sessionData.student_id,
      sessionData.session_token,
      sessionData.current_level,
      sessionData.current_question,
      sessionData.wrong_count,
      sessionData.status,
      sessionData.token_used || null,
      sessionData.ip_address || null,
      sessionData.user_agent || null
    ])
    
    const session = result.rows[0] as QuizSession
    console.log('✅ Quiz session created successfully:', session.id)
    
    return session
  }

  static async getSessionByToken(sessionToken: string): Promise<QuizSession | null> {
    const query = `SELECT * FROM quiz_sessions WHERE session_token = $1`
    const result = await db.query(query, [sessionToken])
    return result.rows[0] as QuizSession || null
  }

  static async updateQuizSession(sessionId: number, updates: Partial<QuizSession>): Promise<QuizSession> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const query = `
      UPDATE quiz_sessions 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `
    const values = [sessionId, ...Object.values(updates)]
    const result = await db.query(query, values)
    return result.rows[0] as QuizSession
  }

  // ===== QUIZ ANSWER OPERATIONS =====
  static async createQuizAnswer(answerData: Omit<QuizAnswer, 'id' | 'answered_at' | 'created_at'>): Promise<QuizAnswer> {
    const query = `
      INSERT INTO quiz_answers (
        student_id, session_id, level, question_id, question_text, 
        selected_answer, correct_answer, is_correct, points_earned, time_taken
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `
    const result = await db.query(query, [
      answerData.student_id,
      answerData.session_id,
      answerData.level,
      answerData.question_id,
      answerData.question_text,
      answerData.selected_answer,
      answerData.correct_answer,
      answerData.is_correct,
      answerData.points_earned,
      answerData.time_taken || null
    ])
    return result.rows[0] as QuizAnswer
  }

  // static async getAnswersBySession(sessionId: number): Promise<QuizAnswer[]> {
  //   const query = `
  //     SELECT * FROM quiz_answers 
  //     WHERE session_id = $1 
  //     ORDER BY answered_at ASC
  //   `
  //   const result = await db.query(query, [sessionId])
  //   return result.rows as QuizAnswer[]
  // }

  // ===== TOKEN OPERATIONS - FIXED =====
  static async validateToken(tokenCode: string): Promise<Token | null> {
    const query = `
      SELECT t.* FROM tokens t
      WHERE t.token_code = $1 
      AND t.is_active = true 
      AND (t.expires_at IS NULL OR t.expires_at > NOW())
      AND t.usage_count < t.max_usage
    `
    const result = await db.query(query, [tokenCode.toUpperCase()])
    return result.rows[0] as Token || null
  }

  static async useToken(tokenCode: string): Promise<boolean> {
    try {
      const query = `
        UPDATE tokens 
        SET usage_count = usage_count + 1, updated_at = NOW()
        WHERE token_code = $1 
        AND is_active = true 
        AND usage_count < max_usage
        AND (expires_at IS NULL OR expires_at > NOW())
        RETURNING id
      `
      const result = await db.query(query, [tokenCode.toUpperCase()])
      return result.rows.length > 0
    } catch (error) {
      console.error('Error using token:', error)
      return false
    }
  }

  static async createToken(tokenData: {
    token_name?: string
    max_usage: number
    expires_at?: string
    created_by: number
  }): Promise<Token> {
    let tokenCode: string
    let isUnique = false
    
    while (!isUnique) {
      tokenCode = this.generateTokenCode(6)
      const checkQuery = `SELECT id FROM tokens WHERE token_code = $1`
      const checkResult = await db.query(checkQuery, [tokenCode])
      isUnique = checkResult.rows.length === 0
    }

    const query = `
      INSERT INTO tokens (token_code, token_name, max_usage, expires_at, created_by) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `
    const result = await db.query(query, [
      tokenCode!,
      tokenData.token_name || null,
      tokenData.max_usage,
      tokenData.expires_at || null,
      tokenData.created_by
    ])
    return result.rows[0] as Token
  }

  private static generateTokenCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static async getAllTokens(): Promise<Token[]> {
    const query = `
      SELECT t.*, u.full_name as created_by_name
      FROM tokens t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `
    const result = await db.query(query)
    return result.rows as Token[]
  }

  static async updateTokenByValue(tokenCode: string, updates: Partial<Token>): Promise<Token> {
    const allowedFields = ['token_name', 'max_usage', 'expires_at', 'is_active']
    const filteredEntries = Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  
    if (filteredEntries.length === 0) {
      throw new Error('Tidak ada field yang valid untuk diperbarui.')
    }
  
    const setClause = filteredEntries
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ')
  
    const values = [tokenCode.toUpperCase(), ...filteredEntries.map(([_, value]) => value)]
  
    const query = `
      UPDATE tokens 
      SET ${setClause}, updated_at = NOW() 
      WHERE token_code = $1 
      RETURNING *
    `
  
    const result = await db.query(query, values) // ✅ Hanya 2 argumen
    if (result.rows.length === 0) {
      throw new Error(`Token ${tokenCode} tidak ditemukan.`)
    }
  
    return result.rows[0] as Token
  }
  
  
  static async deleteTokenByValue(tokenCode: string): Promise<void> {
    const query = `DELETE FROM tokens WHERE token_code = $1`
    await db.query(query, [tokenCode.toUpperCase()])
  }
  

  

  // ===== ADMIN DASHBOARD QUERIES =====
  static async getDashboardStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT s.id) as total_participants,
        COUNT(CASE WHEN qs.status = 'completed' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN qs.status = 'stopped' THEN 1 END) as stopped_sessions,
        COUNT(CASE WHEN qs.status = 'timeout' THEN 1 END) as timeout_sessions,
        COALESCE(AVG(qrs.percentage), 0) as average_score,
        COALESCE(AVG(qrs.highest_level_reached), 0) as average_level,
        (SELECT COUNT(*) FROM tokens WHERE is_active = true) as active_tokens
      FROM students s
      LEFT JOIN quiz_sessions qs ON s.id = qs.student_id
      LEFT JOIN quiz_results_summary qrs ON qs.id = qrs.session_id
      WHERE qs.started_at >= CURRENT_DATE - INTERVAL '30 days'
    `
    const result = await db.query(query)
    return result.rows[0]
  }

  static async getStudentPerformanceList(limit: number = 100, offset: number = 0): Promise<any[]> {
    const query = `
      SELECT * FROM student_performance_summary
      LIMIT $1 OFFSET $2
    `
    const result = await db.query(query, [limit, offset])
    return result.rows
  }

  static async getQuizStatsByDate(days: number = 7): Promise<any[]> {
    const query = `
      SELECT * FROM daily_quiz_stats
      WHERE quiz_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY quiz_date DESC
    `
    const result = await db.query(query)
    return result.rows
  }

  // ===== ADMIN LOG OPERATIONS =====
  static async logAdminAction(logData: Omit<AdminLog, 'id' | 'created_at'>): Promise<void> {
    const query = `
      INSERT INTO admin_logs (user_id, action, description, ip_address, user_agent) 
      VALUES ($1, $2, $3, $4, $5)
    `
    await db.query(query, [
      logData.user_id,
      logData.action,
      logData.description || null,
      logData.ip_address || null,
      logData.user_agent || null
    ])
  }

  // ===== TESTING & DEBUG METHODS =====
  /**
   * Method untuk testing - membuat student dan session secara terpisah dengan logging
   */
  static async testCreateStudentWithSession(
    fullName: string,
    studentClass: string,
    school: string,
    tokenUsed?: string
  ): Promise<{ student: Student; session: QuizSession }> {
    try {
      console.log('🧪 TEST: Starting student creation process...')
      
      // Step 1: Create student
      console.log('📝 Creating student:', { fullName, studentClass, school })
      const student = await this.createStudent({
        full_name: fullName,
        class: studentClass,
        school: school
      })
      console.log('✅ Student created:', student)

      // Step 2: Create session
      console.log('🎯 Creating quiz session for student ID:', student.id)
      const sessionToken = tokenUsed || this.generateSessionToken()
      console.log('🔑 Generated session token:', sessionToken)

      const session = await this.createQuizSession({
        student_id: student.id,
        session_token: sessionToken,
        current_level: 1,
        current_question: 0,
        wrong_count: 0,
        status: 'active',
        token_used: tokenUsed,
        ip_address: '',
        user_agent: ''
      })
      console.log('✅ Quiz session created:', session)

      // Step 3: Verify data exists
      const verifyStudent = await this.getStudentById(student.id)
      const verifySession = await this.getSessionByToken(sessionToken)
      
      console.log('🔍 Verification - Student exists:', !!verifyStudent)
      console.log('🔍 Verification - Session exists:', !!verifySession)

      return { student, session }
    } catch (error) {
      console.error('❌ TEST ERROR:', error)
      throw error
    }
  }

  

  // ===== RESULTS QUERY METHODS =====
  static async getQuizResults(filters: {
    level?: string
    school?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  } = {}): Promise<any[]> {
    let query = `
      SELECT DISTINCT
        s.id as student_id,
        s.full_name AS student_name,
        s.class AS student_class,
        s.school AS student_school,
        qs.session_token,
        qs.current_level AS level,
        COUNT(a.id) AS total_questions,
        SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) AS correct_answers,
        SUM(CASE WHEN a.is_correct = FALSE THEN 1 ELSE 0 END) AS wrong_answers,
        ROUND(
          (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 2
        ) AS score_percentage,
        COALESCE(MAX(a.answered_at), qs.created_at) AS completion_date,
        qs.id as session_id
      FROM students s
      INNER JOIN quiz_sessions qs ON s.id = qs.student_id
      LEFT JOIN quiz_answers a ON a.session_id = qs.id
      WHERE 1=1
    `
  
    const params: any[] = []
  
    if (filters.level && filters.level !== 'all') {
      query += ' AND qs.current_level = $' + (params.length + 1)
      params.push(parseInt(filters.level))
    }
  
    if (filters.school && filters.school !== 'all') {
      query += ' AND s.school ILIKE $' + (params.length + 1)
      params.push(`%${filters.school}%`)
    }
  
    if (filters.dateFrom) {
      query += ' AND DATE(COALESCE(a.answered_at, qs.created_at)) >= $' + (params.length + 1)
      params.push(filters.dateFrom)
    }
  
    if (filters.dateTo) {
      query += ' AND DATE(COALESCE(a.answered_at, qs.created_at)) <= $' + (params.length + 1)
      params.push(filters.dateTo)
    }
  
    query += `
      GROUP BY s.id, s.full_name, s.class, s.school, qs.id, qs.session_token, qs.current_level, qs.created_at
      ORDER BY completion_date DESC NULLS LAST
    `
  
    if (filters.limit) {
      query += ' LIMIT $' + (params.length + 1)
      params.push(filters.limit)
    }
  
    if (filters.offset) {
      query += ' OFFSET $' + (params.length + 1)
      params.push(filters.offset)
    }
  
    const result = await db.query(query, params)
    return result.rows
  }



  static async createQuizResult(
    resultData: Omit<QuizResultSummary, 'id' | 'completed_at' | 'created_at'>
  ): Promise<QuizResultSummary> {
    const query = `
      INSERT INTO quiz_results_summary (
        student_id, session_id, total_questions, correct_answers, wrong_answers,
        total_score, percentage, highest_level_reached, time_spent, status,
        total_available_questions, questions_answered, completion_rate
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *
    `
    const result = await db.query(query, [
      resultData.student_id,
      resultData.session_id,
      resultData.total_questions,
      resultData.correct_answers,
      resultData.wrong_answers,
      resultData.total_score,
      resultData.percentage,
      resultData.highest_level_reached,
      resultData.time_spent,
      resultData.status,
      resultData.total_available_questions || 27,
      resultData.questions_answered || resultData.total_questions,
      resultData.completion_rate || 0
    ])
    
    console.log('✅ Quiz result summary created:', result.rows[0].id)
    return result.rows[0] as QuizResultSummary
  }

  /**
   * Get quiz result by session ID
   */
  static async getQuizResultBySessionId(sessionId: number): Promise<QuizResultSummary | null> {
    const query = `
      SELECT * FROM quiz_results_summary 
      WHERE session_id = $1
    `
    const result = await db.query(query, [sessionId])
    return result.rows[0] as QuizResultSummary || null
  }

  /**
   * Get quiz results by student ID
   */
  static async getQuizResultsByStudentId(studentId: number): Promise<QuizResultSummary[]> {
    const query = `
      SELECT qrs.*, qs.session_token, qs.started_at
      FROM quiz_results_summary qrs
      JOIN quiz_sessions qs ON qrs.session_id = qs.id
      WHERE qrs.student_id = $1
      ORDER BY qrs.completed_at DESC
    `
    const result = await db.query(query, [studentId])
    return result.rows as QuizResultSummary[]
  }

  /**
   * Get all quiz results with filters
   */
  static async getQuizResultsWithFilters(filters: {
    level?: number
    school?: string
    dateFrom?: string
    dateTo?: string
    status?: string
    limit?: number
    offset?: number
  } = {}): Promise<any[]> {
    let query = `
      SELECT 
        qrs.*,
        s.full_name as student_name,
        s.class as student_class,
        s.school as student_school,
        qs.session_token,
        qs.started_at,
        qs.token_used
      FROM quiz_results_summary qrs
      JOIN students s ON qrs.student_id = s.id
      JOIN quiz_sessions qs ON qrs.session_id = qs.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (filters.level !== undefined) {
      query += ` AND qrs.highest_level_reached = $${params.length + 1}`
      params.push(filters.level)
    }
    
    if (filters.school) {
      query += ` AND s.school ILIKE $${params.length + 1}`
      params.push(`%${filters.school}%`)
    }
    
    if (filters.status) {
      query += ` AND qrs.status = $${params.length + 1}`
      params.push(filters.status)
    }
    
    if (filters.dateFrom) {
      query += ` AND DATE(qrs.completed_at) >= $${params.length + 1}`
      params.push(filters.dateFrom)
    }
    
    if (filters.dateTo) {
      query += ` AND DATE(qrs.completed_at) <= $${params.length + 1}`
      params.push(filters.dateTo)
    }
    
    query += ` ORDER BY qrs.completed_at DESC`
    
    if (filters.limit) {
      query += ` LIMIT $${params.length + 1}`
      params.push(filters.limit)
    }
    
    if (filters.offset) {
      query += ` OFFSET $${params.length + 1}`
      params.push(filters.offset)
    }
    
    const result = await db.query(query, params)
    return result.rows
  }

  /**
   * Update quiz result
   */
  static async updateQuizResult(
    resultId: number, 
    updates: Partial<QuizResultSummary>
  ): Promise<QuizResultSummary> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const query = `
      UPDATE quiz_results_summary 
      SET ${setClause}
      WHERE id = $1 
      RETURNING *
    `
    const values = [resultId, ...Object.values(updates)]
    const result = await db.query(query, values)
    return result.rows[0] as QuizResultSummary
  }

  /**
   * Get quiz statistics for dashboard
   */
  static async getQuizStatistics(days: number = 30): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT qrs.student_id) as total_participants,
        COUNT(qrs.id) as total_sessions_completed,
        AVG(qrs.percentage) as average_percentage,
        AVG(qrs.highest_level_reached) as average_level,
        AVG(qrs.time_spent) as average_time_spent,
        MAX(qrs.percentage) as highest_score,
        MIN(qrs.percentage) as lowest_score,
        COUNT(CASE WHEN qrs.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN qrs.status = 'stopped_wrong' THEN 1 END) as stopped_count,
        COUNT(CASE WHEN qrs.percentage >= 80 THEN 1 END) as excellent_count,
        COUNT(CASE WHEN qrs.percentage >= 60 AND qrs.percentage < 80 THEN 1 END) as good_count,
        COUNT(CASE WHEN qrs.percentage < 60 THEN 1 END) as needs_improvement_count
      FROM quiz_results_summary qrs
      WHERE qrs.completed_at >= CURRENT_DATE - INTERVAL '${days} days'
    `
    
    const result = await db.query(query)
    return result.rows[0]
  }

  /**
   * Get level distribution
   */
  static async getLevelDistribution(): Promise<any[]> {
    const query = `
      SELECT 
        highest_level_reached as level,
        COUNT(*) as count,
        AVG(percentage) as avg_percentage
      FROM quiz_results_summary
      GROUP BY highest_level_reached
      ORDER BY highest_level_reached
    `
    
    const result = await db.query(query)
    return result.rows
  }

  /**
   * Get school performance ranking
   */
  static async getSchoolRanking(limit: number = 10): Promise<any[]> {
    const query = `
      SELECT 
        s.school,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(qrs.id) as total_attempts,
        AVG(qrs.percentage) as avg_percentage,
        MAX(qrs.percentage) as best_score,
        AVG(qrs.highest_level_reached) as avg_level
      FROM students s
      JOIN quiz_results_summary qrs ON s.id = qrs.student_id
      GROUP BY s.school
      ORDER BY avg_percentage DESC
      LIMIT $1
    `
    
    const result = await db.query(query, [limit])
    return result.rows
  }

  /**
   * Get daily performance trend
   */
  static async getDailyPerformanceTrend(days: number = 7): Promise<any[]> {
    const query = `
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as total_quizzes,
        AVG(percentage) as avg_percentage,
        AVG(highest_level_reached) as avg_level,
        COUNT(DISTINCT student_id) as unique_students
      FROM quiz_results_summary
      WHERE completed_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `
    
    const result = await db.query(query)
    return result.rows
  }
  
}