-- migrations/002_create_students_table.sql
-- Table for student participants (quiz takers)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    school VARCHAR(255) NOT NULL,
    student_number VARCHAR(50), -- Optional: NIS/NISN
    phone VARCHAR(20), -- Optional: for contact
    email VARCHAR(255), -- Optional: for notifications
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for students
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(full_name);