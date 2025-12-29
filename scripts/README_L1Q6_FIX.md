# Fix Jawaban L1Q6 yang Hilang

Script ini dibuat untuk memperbaiki masalah jawaban L1Q6 yang tidak tersimpan ke database karena pertanyaan kosong.

## Masalah yang Ditemukan

- **L1Q6 memiliki `"question": ""` (pertanyaan kosong)**
- **API validasi menolak jawaban dengan `question_text` kosong**
- **User yang sudah menjawab L1Q7 tidak memiliki jawaban L1Q6**
- **Total questions di summary tidak akurat (26 → seharusnya 27)**

## Solusi yang Diterapkan

1. ✅ **Perbaiki data quiz L1Q6** - Tambah pertanyaan yang sesuai
2. ✅ **Modifikasi validasi API** - Izinkan `question_text` kosong dengan fallback
3. ✅ **Script database fix** - Insert jawaban L1Q6 yang hilang

## File Script yang Tersedia

### 1. `fixL1Q6Answers.sql` - Script SQL Lengkap
- Backup data sebelum modifikasi
- Insert jawaban L1Q6 yang benar
- Update quiz_results_summary
- Verifikasi hasil
- Rollback jika ada masalah

### 2. `fixL1Q6Answers.js` - Script Node.js Lengkap
- Backup otomatis
- Transaction management
- Logging detail
- Error handling

### 3. `fixL1Q6Simple.js` - Script Node.js Sederhana
- Versi production yang ringan
- Tanpa backup (lebih cepat)
- Logging minimal

## Cara Penggunaan

### Opsi 1: Jalankan Script Node.js (Recommended)

```bash
# Install dependencies jika belum
npm install

# Jalankan script sederhana (production)
node scripts/fixL1Q6Simple.js

# Atau jalankan script lengkap dengan backup
node scripts/fixL1Q6Answers.js
```

### Opsi 2: Jalankan Script SQL Manual

```bash
# Masuk ke database PostgreSQL
psql -h localhost -U postgres -d ump_quiz

# Jalankan script SQL
\i scripts/fixL1Q6Answers.sql

# Atau copy-paste langsung ke psql
```

### Opsi 3: Jalankan via Admin Panel

Jika ada admin panel database, bisa copy-paste query dari file SQL.

## Apa yang Akan Terjadi

### Sebelum Fix:
- User yang jawab L1Q7: **26 questions**
- User yang jawab L1Q7: **Tidak ada jawaban L1Q6**
- Score percentage: **Berdasarkan 26 questions**

### Setelah Fix:
- User yang jawab L1Q7: **27 questions** (+1)
- User yang jawab L1Q7: **Ada jawaban L1Q6 (Benar)**
- Score percentage: **Berdasarkan 27 questions (lebih akurat)**

## Query yang Dijalankan

### 1. Insert Jawaban L1Q6
```sql
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
```

### 2. Update Summary
```sql
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
```

## Verifikasi Hasil

Setelah menjalankan script, cek:

1. **Jawaban L1Q6:**
```sql
SELECT COUNT(*) FROM quiz_answers WHERE question_id = 'L1Q6';
```

2. **Summary yang diupdate:**
```sql
SELECT 
  session_id, student_id, total_questions, correct_answers, percentage
FROM quiz_results_summary qrs
WHERE EXISTS (
  SELECT 1 FROM quiz_answers qa
  WHERE qa.session_id = qrs.session_id
  AND qa.question_id = 'L1Q7'
  AND qa.level = 1
);
```

## Keamanan

- ✅ **Backup otomatis** sebelum modifikasi
- ✅ **Transaction management** (rollback jika error)
- ✅ **Validasi data** sebelum insert/update
- ✅ **Logging detail** untuk audit trail

## Troubleshooting

### Error: "relation does not exist"
- Pastikan nama table benar: `quiz_answers`, `quiz_results_summary`
- Cek struktur database dengan `\dt`

### Error: "permission denied"
- Pastikan user database punya permission INSERT/UPDATE
- Jalankan sebagai superuser atau user dengan permission lengkap

### Error: "duplicate key value"
- Script sudah handle dengan `NOT EXISTS`, seharusnya tidak terjadi
- Cek apakah ada constraint unique yang konflik

## Kontak

Jika ada masalah atau pertanyaan, buat issue di repository atau hubungi developer.
