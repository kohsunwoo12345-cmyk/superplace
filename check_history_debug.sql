-- Check if MessageSendHistory table exists
SELECT name, sql FROM sqlite_master WHERE type='table' AND name='MessageSendHistory';

-- Check all records in MessageSendHistory
SELECT * FROM MessageSendHistory LIMIT 10;

-- Check userId values in MessageSendHistory
SELECT DISTINCT userId FROM MessageSendHistory;
