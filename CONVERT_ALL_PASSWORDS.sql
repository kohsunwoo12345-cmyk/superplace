-- 🚨 모든 사용자를 SHA-256 해시로 변환
-- D1 Console에서 실행하세요

-- 1. 먼저 기존 사용자 백업 확인
SELECT id, email, name, role, LENGTH(password) as pwd_len, approved FROM User;

-- 2. 테스트 계정들을 SHA-256으로 업데이트
UPDATE User SET password = '00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f' WHERE email = 'admin@superplace.com';
UPDATE User SET password = '39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c' WHERE email = 'test@test.com';
UPDATE User SET password = '0e837948585f8ec9c22d655fc81af116838db4537a6d9fb705f4a8bad1a8653e' WHERE email = 'director@superplace.com';
UPDATE User SET password = '3b98a7c7192ebae6443663d636522647974b75117bb3e392986e2d52f2b51ff8' WHERE email = 'teacher@superplace.com';

-- 3. bcrypt 해시를 가진 다른 사용자들 확인 (60자)
SELECT email, name, role, LENGTH(password) as pwd_len 
FROM User 
WHERE LENGTH(password) = 60;

-- 4. 결과 확인
SELECT email, name, role, SUBSTR(password, 1, 20) || '...' as pwd_preview, LENGTH(password) as pwd_len, approved 
FROM User 
ORDER BY createdAt DESC 
LIMIT 10;
