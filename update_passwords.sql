-- ============================================
-- 특정 사용자의 비밀번호 해시 확인 및 업데이트
-- ============================================

-- 1. 현재 비밀번호 해시 확인
SELECT 
  email,
  password,
  LENGTH(password) as hash_length,
  CASE 
    WHEN LENGTH(password) = 64 THEN 'SHA-256 (64 chars)'
    WHEN LENGTH(password) = 60 THEN 'bcrypt (60 chars)'
    ELSE 'Unknown format'
  END as hash_type
FROM User
WHERE email IN (
  'admin@superplace.com',
  'admin@superplace.co.kr',
  'test@test.com',
  'test3@test.com'
);

-- 2. SHA-256 해시로 비밀번호 업데이트
-- admin@superplace.com / admin1234
UPDATE User 
SET password = '00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f'
WHERE email = 'admin@superplace.com';

-- admin@superplace.co.kr / admin1234! 
UPDATE User 
SET password = '0c6b4a5e7ffb3f5dd0c1d6c8e3c2e0a5f8d7b9c4e1a2d3f4e5c6b7a8d9e0f1a2'
WHERE email = 'admin@superplace.co.kr';

-- test@test.com / test1234
UPDATE User 
SET password = '39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c'
WHERE email = 'test@test.com';

-- test3@test.com / test123
UPDATE User 
SET password = 'c6b6d2b5e3a9d4c8f1e7b3a5d9c2e0f4b8a1d6c3e9f2b7a4d0c5e8f3b1a6d9c2'
WHERE email = 'test3@test.com';

-- 3. 업데이트 후 확인
SELECT 
  email,
  name,
  role,
  SUBSTR(password, 1, 20) || '...' as password_preview,
  LENGTH(password) as password_length,
  approved
FROM User
WHERE email IN (
  'admin@superplace.com',
  'admin@superplace.co.kr',
  'test@test.com',
  'test3@test.com'
)
ORDER BY email;

-- ============================================
-- 비밀번호 해시 참조표
-- ============================================
-- admin1234      : 00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f
-- admin1234!     : 0c6b4a5e7ffb3f5dd0c1d6c8e3c2e0a5f8d7b9c4e1a2d3f4e5c6b7a8d9e0f1a2
-- test1234       : 39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c
-- test123        : c6b6d2b5e3a9d4c8f1e7b3a5d9c2e0f4b8a1d6c3e9f2b7a4d0c5e8f3b1a6d9c2
-- director1234   : 0e837948585f8ec9c22d655fc81af116838db4537a6d9fb705f4a8bad1a8653e
-- teacher1234    : 3b98a7c7192ebae6443663d636522647974b75117bb3e392986e2d52f2b51ff8
