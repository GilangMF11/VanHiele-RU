// Script sederhana untuk memperbaiki jawaban L1Q6 yang hilang
// Jalankan: node scripts/fixL1Q6Simple.js

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixL1Q6Answers() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Memulai perbaikan jawaban L1Q6...');
    
    // 1. Cek berapa user yang sudah jawab L1Q7 tapi belum L1Q6
    const checkResult = await client.query(`
      SELECT COUNT(DISTINCT qa.student_id) as affected_users
      FROM quiz_answers qa
      WHERE qa.question_id = 'L1Q7'
        AND qa.level = 1
        AND NOT EXISTS (
          SELECT 1 FROM quiz_answers qa2 
          WHERE qa2.student_id = qa.student_id 
          AND qa2.question_id = 'L1Q6'
        )
    `);
    
    const affectedUsers = checkResult.rows[0].affected_users;
    console.log(`📊 Ditemukan ${affectedUsers} user yang perlu diperbaiki`);
    
    if (affectedUsers === 0) {
      console.log('✅ Tidak ada user yang perlu diperbaiki');
      return;
    }
    
    // 2. Insert jawaban L1Q6
    const insertResult = await client.query(`
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
        )
    `);
    
    console.log(`✅ Inserted ${insertResult.rowCount} jawaban L1Q6`);
    
    // 3. Update summary
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
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} quiz summaries`);
    
    // 4. Verifikasi
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_l1q6_answers,
        COUNT(DISTINCT student_id) as unique_students
      FROM quiz_answers 
      WHERE question_id = 'L1Q6'
    `);
    
    console.log('📊 Verifikasi hasil:', verifyResult.rows[0]);
    console.log('🎉 Perbaikan selesai!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixL1Q6Answers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script gagal:', error);
    process.exit(1);
  });
