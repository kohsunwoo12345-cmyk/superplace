-- D1 Database Migration Script
-- Adds starterMessage fields to ai_bots table

-- Step 1: Check if columns exist and add them if missing
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN directly,
-- so we need to handle this carefully

-- Add starterMessage1 column
ALTER TABLE ai_bots ADD COLUMN starterMessage1 TEXT;

-- Add starterMessage2 column
ALTER TABLE ai_bots ADD COLUMN starterMessage2 TEXT;

-- Add starterMessage3 column
ALTER TABLE ai_bots ADD COLUMN starterMessage3 TEXT;

-- Add profileIcon column (if not exists)
ALTER TABLE ai_bots ADD COLUMN profileIcon TEXT DEFAULT '🤖';

-- Optional: Update existing bots to have default values
UPDATE ai_bots 
SET profileIcon = '🤖' 
WHERE profileIcon IS NULL;
