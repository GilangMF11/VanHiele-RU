-- migrations/005_create_tokens_table.sql
-- Admin-managed tokens for quiz access
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    token_code VARCHAR(10) UNIQUE NOT NULL,
    token_name VARCHAR(100), -- e.g., "Batch A", "SMAN 1 Jakarta"
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER DEFAULT 1,
    expires_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id), -- Admin who created this token
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for tokens
CREATE INDEX IF NOT EXISTS idx_tokens_code ON tokens(token_code);
CREATE INDEX IF NOT EXISTS idx_tokens_active ON tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_created_by ON tokens(created_by);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at);

-- Insert sample tokens
INSERT INTO tokens (token_code, token_name, max_usage, expires_at, created_by) VALUES 
('ABC123', 'Batch A - SMAN 1', 100, NOW() + INTERVAL '30 days', 1),
('DEF456', 'Batch B - SMAN 2', 50, NOW() + INTERVAL '15 days', 1),
('GHI789', 'Batch C - SMAN 3', 200, NOW() + INTERVAL '60 days', 1)
ON CONFLICT (token_code) DO NOTHING;