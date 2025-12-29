-- Script QUICK untuk memperbaiki jawaban L1Q6 yang hilang
-- Jalankan script ini di database untuk user yang sudah menjawab di atas L1Q7

-- ===== STEP 1: Cek data sebelum modifikasi =====
SELECT 'BEFORE: Total L1Q6 answers' as info, COUNT(*) as count FROM quiz_answers WHERE question_id = 'L1Q6';

SELECT 'BEFORE: Summary stats' as info, 
  COUNT(*) as total_summaries,
  SUM(total_questions) as total_questions_sum,
  SUM(correct_answers) as total_correct_sum
FROM quiz_results_summary qrs
WHERE EXISTS (
  SELECT 1 FROM quiz_answers qa
  WHERE qa.session_id = qrs.session_id
  AND qa.question_id = 'L1Q7'
  AND qa.level = 1
);

-- ===== STEP 2: Insert jawaban L1Q6 =====
INSERT INTO quiz_answers (
  student_id, session_id, level, question_id, question_text,
  selected_answer, correct_answer, is_correct, points_earned, created_at
)
SELECT DISTINCT
  qa.student_id, qa.session_id, 1, 'L1Q6',
  'Berdasarkan gambar di atas, sifat yang dimiliki oleh belah ketupat adalah ...',
  'a', 'a', true, 10, NOW()
FROM quiz_answers qa
WHERE qa.question_id = 'L1Q7'
  AND qa.level = 1
  AND NOT EXISTS (
    SELECT 1 FROM quiz_answers qa2 
    WHERE qa2.student_id = qa.student_id 
    AND qa2.question_id = 'L1Q6'
  );

-- ===== STEP 3: Update summary =====
UPDATE quiz_results_summary qrs
SET 
  total_questions = total_questions + 1,
  correct_answers = correct_answers + 1,
  percentage = ROUND(((correct_answers + 1) / (total_questions + 1)) * 100, 2),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM quiz_answers qa
  WHERE qa.session_id = qrs.session_id
  AND qa.question_id = 'L1Q7'
  AND qa.level = 1
);

-- ===== STEP 4: Verifikasi hasil =====
SELECT 'AFTER: Total L1Q6 answers' as info, COUNT(*) as count FROM quiz_answers WHERE question_id = 'L1Q6';

SELECT 'AFTER: Summary stats' as info, 
  COUNT(*) as total_summaries,
  SUM(total_questions) as total_questions_sum,
  SUM(correct_answers) as total_correct_sum
FROM quiz_results_summary qrs
WHERE EXISTS (
  SELECT 1 FROM quiz_answers qa
  WHERE qa.session_id = qrs.session_id
  AND qa.question_id = 'L1Q7'
  AND qa.level = 1
);

-- ===== STEP 5: Tampilkan detail perubahan =====
SELECT 
  'DETAIL: Updated summaries' as info,
  qrs.session_id,
  qrs.student_id,
  qrs.total_questions,
  qrs.correct_answers,
  qrs.percentage
FROM quiz_results_summary qrs
WHERE EXISTS (
  SELECT 1 FROM quiz_answers qa
  WHERE qa.session_id = qrs.session_id
  AND qa.question_id = 'L1Q7'
  AND qa.level = 1
)
ORDER BY qrs.session_id;
