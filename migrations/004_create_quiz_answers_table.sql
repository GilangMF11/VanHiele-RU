-- migrations/004_create_quiz_answers_table.sql
-- Update quiz answers to reference students table with 5 options support
CREATE TABLE IF NOT EXISTS quiz_answers (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    question_id VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd', 'e')),  -- UPDATED: Added 'e'
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'e')),   -- UPDATED: Added 'e'
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER DEFAULT 0,
    time_taken INTEGER, -- seconds taken to answer
    answered_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for quiz answers
CREATE INDEX IF NOT EXISTS idx_quiz_answers_student_id ON quiz_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_level ON quiz_answers(level);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_answered_at ON quiz_answers(answered_at);

-- ADDED: Additional indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_quiz_answers_selected_answer ON quiz_answers(selected_answer);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_correct_answer ON quiz_answers(correct_answer);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_is_correct ON quiz_answers(is_correct);

-- ADDED: Helper function untuk validation
CREATE OR REPLACE FUNCTION validate_answer_option(option_value CHAR(1))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN option_value IN ('a', 'b', 'c', 'd', 'e');
END;
$$ LANGUAGE plpgsql;

-- ADDED: Composite index untuk common queries
CREATE INDEX IF NOT EXISTS idx_quiz_answers_student_level ON quiz_answers(student_id, level);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_level ON quiz_answers(session_id, level);

-- ADDED: Comment untuk dokumentasi
COMMENT ON TABLE quiz_answers IS 'Stores individual quiz answers with support for 5 options (a-e)';
COMMENT ON COLUMN quiz_answers.selected_answer IS 'Answer selected by student (a, b, c, d, or e)';
COMMENT ON COLUMN quiz_answers.correct_answer IS 'Correct answer for the question (a, b, c, d, or e)';
COMMENT ON COLUMN quiz_answers.level IS 'Quiz level (starting from 0)';
COMMENT ON FUNCTION validate_answer_option IS 'Validates if answer option is valid (a-e)';