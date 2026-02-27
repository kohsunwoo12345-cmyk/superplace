-- Add school column to User table if not exists
-- This migration adds the school field to store student's school name

-- Check if column exists first (SQLite doesn't have IF NOT EXISTS for ALTER TABLE)
-- If this fails, the column already exists and that's OK

ALTER TABLE User ADD COLUMN school TEXT;

-- Add index for school column for faster queries
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);
