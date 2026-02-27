-- Add school column to User table
-- This migration adds the missing 'school' column to store student's school name

-- Add school column to User table
ALTER TABLE User ADD COLUMN school TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);

-- Verification query (run separately to check)
-- SELECT COUNT(*) as total_users, 
--        COUNT(school) as users_with_school 
-- FROM User;
