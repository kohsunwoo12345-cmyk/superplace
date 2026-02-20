-- Add enableProblemGeneration column to ai_bots table
-- This migration adds support for problem worksheet printing feature

-- Check if column exists and add it if not
-- SQLite doesn't have ALTER TABLE ADD COLUMN IF NOT EXISTS, so we need to handle errors gracefully

-- Add the enableProblemGeneration column
ALTER TABLE ai_bots ADD COLUMN enableProblemGeneration INTEGER DEFAULT 0;

-- Verify the column was added
SELECT sql FROM sqlite_master WHERE type='table' AND name='ai_bots';

