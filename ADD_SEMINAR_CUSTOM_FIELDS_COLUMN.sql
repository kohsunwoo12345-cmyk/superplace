-- Add customFields column to seminars table
-- This column stores admin-defined custom fields as JSON
-- Example: [{"label": "회사명", "type": "text"}, {"label": "참석 인원", "type": "number"}]

-- Check if customFields column already exists
PRAGMA table_info(seminars);

-- Add customFields column (if not exists)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we need to check manually first

-- Run this to add the column:
ALTER TABLE seminars ADD COLUMN customFields TEXT;

-- Verify the column was added:
PRAGMA table_info(seminars);

-- Test query to ensure everything works:
SELECT id, title, customFields, requiredFields, ctaButtonText FROM seminars LIMIT 5;
