-- Check if users exist in D1 database
SELECT 
  id,
  email,
  name,
  role,
  LEFT(password, 20) || '...' as password_preview,
  LENGTH(password) as password_length,
  approved,
  createdAt
FROM User 
WHERE email IN (
  'admin@superplace.com',
  'test@test.com',
  'director@superplace.com',
  'teacher@superplace.com'
)
ORDER BY createdAt DESC;

-- Check total user count
SELECT COUNT(*) as total_users FROM User;

-- Check Academy table
SELECT id, name, code FROM Academy;
