// Script Node.js untuk memperbaiki jawaban L1Q6 yang hilang
// Jalankan: node scripts/fixL1Q6Answers.js

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixL1Q6Answers() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Memulai perbaikan jawaban L1Q6...');
    
    // 1. Backup data sebelum modifikasi
    console.log('📋 Membuat backup data...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_answers_backup_l1q6 AS
      SELECT * FROM quiz_answers WHERE question_id = 'L1Q6'
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_results_summary_backup_l1q6 AS
      SELECT * FROM quiz_results_summary qrs
      WHERE EXISTS (
        SELECT 1 FROM quiz_answers qa
        WHERE qa.session_id = qrs.session_id
        AND qa.question_id = 'L1Q7'
        AND qa.level = 1
      )
    `);
    
    // 2. Verifikasi data sebelum modifikasi
    console.log('🔍 Verifikasi data sebelum modifikasi...');
    const beforeData = await client.query(`
      SELECT 
        COUNT(*) as total_answers_l1q6,
        COUNT(DISTINCT student_id) as unique_students_l1q6
      FROM quiz_answers 
      WHERE question_id = 'L1Q6'
    `);
    
    const beforeSummary = await client.query(`
      SELECT 
        COUNT(*) as total_summaries,
        SUM(total_questions) as total_questions_sum,
        SUM(correct_answers) as total_correct_sum
      FROM quiz_results_summary qrs
      WHERE EXISTS (
        SELECT 1 FROM quiz_answers qa
        WHERE qa.session_id = qrs.session_id
        AND qa.question_id = 'L1Q7'
        AND qa.level = 1
      )
    `);
    
    console.log('📊 Data sebelum modifikasi:', {
      answersL1Q6: beforeData.rows[0],
      summary: beforeSummary.rows[0]
    });
    
    // 3. Mulai transaction
    await client.query('START TRANSACTION');
    
    // 4. Insert jawaban L1Q6 yang benar
    console.log('➕ Insert jawaban L1Q6...');
    const insertResult = await client.query(`
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
        1 as level,
        'L1Q6' as question_id,
        'Berdasarkan gambar di atas, sifat yang dimiliki oleh belah ketupat adalah ...' as question_text,
        'a' as selected_answer,
        'a' as correct_answer,
        true as is_correct,
        10 as points_earned,
        NOW() as created_at
      FROM quiz_answers qa
      WHERE qa.question_id = 'L1Q7'
        AND qa.level = 1
        AND NOT EXISTS (
          SELECT 1 FROM quiz_answers qa2 
          WHERE qa2.student_id = qa.student_id 
          AND qa2.question_id = 'L1Q6'
        )
    `);
    
    console.log(`✅ Inserted ${insertResult.rowCount} jawaban L1Q6`);
    
    // 5. Update quiz_results_summary
    console.log('🔄 Update quiz results summary...');
    const updateResult = await client.query(`
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
      )
      AND NOT EXISTS (
        SELECT 1 FROM quiz_answers qa2
        WHERE qa2.session_id = qrs.session_id
        AND qa2.question_id = 'L1Q6'
        AND qa2.created_at < qrs.updated_at
      )
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} quiz summaries`);
    
    // 6. Verifikasi hasil
    console.log('🔍 Verifikasi hasil...');
    const afterData = await client.query(`
      SELECT 
        COUNT(*) as total_answers_l1q6,
        COUNT(DISTINCT student_id) as unique_students_l1q6
      FROM quiz_answers 
      WHERE question_id = 'L1Q6'
    `);
    
    const afterSummary = await client.query(`
      SELECT 
        COUNT(*) as total_summaries,
        SUM(total_questions) as total_questions_sum,
        SUM(correct_answers) as total_correct_sum
      FROM quiz_results_summary qrs
      WHERE EXISTS (
        SELECT 1 FROM quiz_answers qa
        WHERE qa.session_id = qrs.session_id
        AND qa.question_id = 'L1Q7'
        AND qa.level = 1
      )
    `);
    
    console.log('📊 Data setelah modifikasi:', {
      answersL1Q6: afterData.rows[0],
      summary: afterSummary.rows[0]
    });
    
    // 7. Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully!');
    
    // 8. Summary perubahan
    const totalQuestionsDiff = afterSummary.rows[0].total_questions_sum - beforeSummary.rows[0].total_questions_sum;
    const totalCorrectDiff = afterSummary.rows[0].total_correct_sum - beforeSummary.rows[0].total_correct_sum;
    
    console.log('🎯 Ringkasan perubahan:');
    console.log(`   - Total questions: ${beforeSummary.rows[0].total_questions_sum} → ${afterSummary.rows[0].total_questions_sum} (+${totalQuestionsDiff})`);
    console.log(`   - Total correct answers: ${beforeSummary.rows[0].total_correct_sum} → ${afterSummary.rows[0].total_correct_sum} (+${totalCorrectDiff})`);
    console.log(`   - Jawaban L1Q6: ${beforeData.rows[0].total_answers_l1q6} → ${afterData.rows[0].total_answers_l1q6} (+${afterData.rows[0].total_answers_l1q6 - beforeData.rows[0].total_answers_l1q6})`);
    
  } catch (error) {
    console.error('❌ Error occurred, rolling back...', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Jalankan script
fixL1Q6Answers()
  .then(() => {
    console.log('🎉 Perbaikan jawaban L1Q6 selesai!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script gagal:', error);
    process.exit(1);
  });
