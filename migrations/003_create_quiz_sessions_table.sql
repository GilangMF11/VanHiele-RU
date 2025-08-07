-- migrations/003_create_quiz_sessions_table.sql
-- Update quiz sessions to reference students table
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    current_level INTEGER DEFAULT 1,
    current_question INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'timeout')),
    token_used VARCHAR(50), -- Token yang digunakan student
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for quiz sessions
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_student_id ON quiz_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_token ON quiz_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started_at ON quiz_sessions(started_at);