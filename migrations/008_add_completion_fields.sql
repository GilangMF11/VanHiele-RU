-- migrations/008_add_completion_fields.sql
-- Add completion tracking fields to quiz_results_summary table

-- Add new columns for completion tracking
ALTER TABLE quiz_results_summary 
ADD COLUMN IF NOT EXISTS total_available_questions INTEGER DEFAULT 27,
ADD COLUMN IF NOT EXISTS questions_answered INTEGER,
ADD COLUMN IF NOT EXISTS completion_rate INTEGER;

-- Update existing records to have proper values
UPDATE quiz_results_summary 
SET 
    questions_answered = total_questions,
    completion_rate = CASE 
        WHEN total_available_questions > 0 
        THEN ROUND((total_questions * 100.0) / total_available_questions)
        ELSE 0 
    END
WHERE questions_answered IS NULL;

-- Create index for completion rate
CREATE INDEX IF NOT EXISTS idx_quiz_results_completion_rate ON quiz_results_summary(completion_rate);
