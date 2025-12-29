-- Script untuk memperbaiki jawaban L1Q6 yang hilang
-- Jalankan script ini di database untuk user yang sudah menjawab di atas L1Q7

-- 1. Insert jawaban L1Q6 yang benar untuk user yang sudah menjawab L1Q7
INSERT INTO quiz_answers (
    student_id,
    session_id,
    level,
    question_id,
    question_text,
    selected_answer,
    correct_answer,
    is_correct,
    points_earned,
    created_at
)
SELECT DISTINCT
    qa.student_id,
    qa.session_id,
    1 as level, -- Level 1
    'L1Q6' as question_id,
    'Berdasarkan gambar di atas, sifat yang dimiliki oleh belah ketupat adalah ...' as question_text,
    'a' as selected_answer, -- Jawaban yang benar
    'a' as correct_answer,
    true as is_correct, -- Benar
    10 as points_earned, -- 10 * level
    NOW() as created_at
FROM quiz_answers qa
WHERE qa.question_id = 'L1Q7' -- User yang sudah menjawab L1Q7
    AND qa.level = 1
    AND NOT EXISTS (
        -- Pastikan L1Q6 belum ada untuk user ini
        SELECT 1 FROM quiz_answers qa2 
        WHERE qa2.student_id = qa.student_id 
        AND qa2.question_id = 'L1Q6'
    );

-- 2. Update total_questions dan correct_answers di quiz_results_summary
UPDATE quiz_results_summary qrs
SET 
    total_questions = total_questions + 1,
    correct_answers = correct_answers + 1,
    percentage = ROUND(((correct_answers + 1) / (total_questions + 1)) * 100, 2),
    updated_at = NOW()
WHERE EXISTS (
    -- Hanya update summary yang memiliki session dengan jawaban L1Q7
    SELECT 1 FROM quiz_answers qa
    WHERE qa.session_id = qrs.session_id
    AND qa.question_id = 'L1Q7'
    AND qa.level = 1
)
AND NOT EXISTS (
    -- Pastikan L1Q6 belum dihitung dalam summary ini
    SELECT 1 FROM quiz_answers qa2
    WHERE qa2.session_id = qrs.session_id
    AND qa2.question_id = 'L1Q6'
    AND qa2.created_at < qrs.updated_at
);

-- 3. Verifikasi hasil
SELECT 
    'Summary yang diupdate:' as info,
    qrs.session_id,
    qrs.student_id,
    qrs.total_questions,
    qrs.correct_answers,
    qrs.score_percentage
FROM quiz_results_summary qrs
WHERE EXISTS (
    SELECT 1 FROM quiz_answers qa
    WHERE qa.session_id = qrs.session_id
    AND qa.question_id = 'L1Q7'
    AND qa.level = 1
);

-- 4. Verifikasi jawaban L1Q6 yang diinsert
SELECT 
    'Jawaban L1Q6 yang diinsert:' as info,
    qa.student_id,
    qa.session_id,
    qa.question_id,
    qa.is_correct,
    qa.points_earned,
    qa.created_at
FROM quiz_answers qa
WHERE qa.question_id = 'L1Q6'
    AND qa.created_at >= CURDATE() -- Jawaban yang dibuat hari ini
ORDER BY qa.created_at DESC;
