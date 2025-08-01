-- migrations/007_create_quiz_results_summary_table.sql
-- Aggregate results for quick reporting
CREATE TABLE IF NOT EXISTS quiz_results_summary (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    total_questions INTEGER,
    correct_answers INTEGER,
    wrong_answers INTEGER,
    total_score INTEGER,
    percentage DECIMAL(5,2),
    highest_level_reached INTEGER,
    time_spent INTEGER, -- total seconds
    status VARCHAR(20), -- 'completed', 'stopped_wrong', 'timeout'
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for quiz results
CREATE INDEX IF NOT EXISTS idx_quiz_results_student_id ON quiz_results_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_session_id ON quiz_results_summary(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_percentage ON quiz_results_summary(percentage);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results_summary(completed_at);

-- migrations/008_create_views_and_functions.sql
-- Useful views for admin dashboard

-- View: Student Performance Summary
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT 
    s.id as student_id,
    s.full_name,
    s.class,
    s.school,
    qs.started_at,
    qs.completed_at,
    qs.status,
    qrs.total_questions,
    qrs.correct_answers,
    qrs.percentage,
    qrs.highest_level_reached,
    qrs.time_spent,
    qs.token_used
FROM students s
LEFT JOIN quiz_sessions qs ON s.id = qs.student_id
LEFT JOIN quiz_results_summary qrs ON qs.id = qrs.session_id
ORDER BY qs.started_at DESC;

-- View: Daily Quiz Statistics
CREATE OR REPLACE VIEW daily_quiz_stats AS
SELECT 
    DATE(qs.started_at) as quiz_date,
    COUNT(DISTINCT qs.student_id) as total_participants,
    COUNT(CASE WHEN qs.status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN qs.status = 'stopped' THEN 1 END) as stopped_count,
    COUNT(CASE WHEN qs.status = 'timeout' THEN 1 END) as timeout_count,
    AVG(qrs.percentage) as average_score,
    AVG(qrs.highest_level_reached) as average_level
FROM quiz_sessions qs
LEFT JOIN quiz_results_summary qrs ON qs.id = qrs.session_id
WHERE qs.started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(qs.started_at)
ORDER BY quiz_date DESC;

-- View: Token Usage Statistics
CREATE OR REPLACE VIEW token_usage_stats AS
SELECT 
    t.token_code,
    t.token_name,
    t.usage_count,
    t.max_usage,
    t.expires_at,
    t.is_active,
    COUNT(qs.id) as sessions_count,
    u.full_name as created_by_admin
FROM tokens t
LEFT JOIN quiz_sessions qs ON t.token_code = qs.token_used
LEFT JOIN users u ON t.created_by = u.id
GROUP BY t.id, u.full_name
ORDER BY t.created_at DESC;

-- Function: Generate random token
CREATE OR REPLACE FUNCTION generate_token(length INTEGER DEFAULT 6) 
RETURNS VARCHAR AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if token is valid
CREATE OR REPLACE FUNCTION is_token_valid(token_code VARCHAR) 
RETURNS BOOLEAN AS $$
DECLARE
    token_record RECORD;
BEGIN
    SELECT * INTO token_record 
    FROM tokens 
    WHERE token_code = is_token_valid.token_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND usage_count < max_usage;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Use token (increment usage count)
CREATE OR REPLACE FUNCTION use_token(token_code VARCHAR) 
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tokens 
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE token_code = use_token.token_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND usage_count < max_usage;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;