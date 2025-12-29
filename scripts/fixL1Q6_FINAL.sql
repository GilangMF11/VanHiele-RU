-- Script FINAL untuk memperbaiki jawaban L1Q6 yang hilang
-- Jalankan script ini di database untuk user yang sudah menjawab di atas L1Q7

-- ===== VERIFIKASI DATA SEBELUM MODIFIKASI =====
SELECT 
  'Data sebelum modifikasi:' as info,
  COUNT(*) as total_answers_l1q6,
  COUNT(DISTINCT student_id) as unique_students_l1q6
FROM quiz_answers 
WHERE question_id = 'L1Q6';

SELECT 
  'Summary yang akan diupdate:' as info,
  COUNT(*) as total_summaries,
  SUM(total_questions) as total_questions_sum,
  SUM(correct_answers) as total_correct_sum,
  AVG(percentage) as avg_percentage
FROM quiz_results_summary qrs
WHERE EXISTS (
  SELECT 1 FROM quiz_answers qa
  WHERE qa.session_id = qrs.session_id
  AND qa.question_id = 'L1Q7'
  AND qa.level = 1
);

-- ===== MULAI TRANSACTION =====
BEGIN;

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
);

-- ===== VERIFIKASI HASIL =====
SELECT 
  'Jawaban L1Q6 yang diinsert:' as info,
  COUNT(*) as total_inserted
FROM quiz_answers qa
WHERE qa.question_id = 'L1Q6'
  AND qa.created_at >= NOW() - INTERVAL '1 minute'; -- Jawaban yang baru dibuat

SELECT 
  'Summary yang diupdate:' as info,
  COUNT(*) as total_updated,
  SUM(total_questions) as new_total_questions_sum,
  SUM(correct_answers) as new_total_correct_sum,
  AVG(percentage) as new_avg_percentage
FROM quiz_results_summary qrs
WHERE EXISTS (
  SELECT 1 FROM quiz_answers qa
  WHERE qa.session_id = qrs.session_id
  AND qa.question_id = 'L1Q7'
  AND qa.level = 1
);

-- ===== PILIHAN: COMMIT ATAU ROLLBACK =====
-- Jika hasil sudah sesuai, jalankan:
-- COMMIT;

-- Jika ada masalah, jalankan:
-- ROLLBACK;

-- ===== SCRIPT ROLLBACK (jika diperlukan) =====
-- ROLLBACK;
-- 
-- -- Hapus jawaban L1Q6 yang baru diinsert
-- DELETE FROM quiz_answers 
-- WHERE question_id = 'L1Q6' 
-- AND created_at >= NOW() - INTERVAL '1 minute';
-- 
-- -- Restore quiz_results_summary dari backup (jika ada)
-- -- UPDATE quiz_results_summary qrs
-- -- SET 
-- --   total_questions = backup.total_questions,
-- --   correct_answers = backup.correct_answers,
-- --   percentage = backup.percentage,
-- --   updated_at = backup.updated_at
-- -- FROM quiz_results_summary_backup_l1q6 backup
-- -- WHERE qrs.session_id = backup.session_id;
