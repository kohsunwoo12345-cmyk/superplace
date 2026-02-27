-- Add class column to User table
-- This migration adds the 'class' field to store student's class/homeroom

ALTER TABLE User ADD COLUMN class TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_class ON User(class);
