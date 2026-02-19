-- 🚨 긴급 비밀번호 수정 SQL
-- D1 Console에서 이 쿼리를 실행하세요
-- https://dash.cloudflare.com/ -> Workers & Pages -> D1 -> webapp-production -> Console

-- 1. 먼저 현재 비밀번호 확인
SELECT email, password, LENGTH(password) as hash_length FROM User WHERE email = 'admin@superplace.com';

-- 2. 비밀번호를 올바른 해시로 업데이트 (admin1234)
UPDATE User 
SET password = '00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f'
WHERE email = 'admin@superplace.com';

-- 3. test@test.com도 업데이트 (test1234)
UPDATE User 
SET password = '39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c'
WHERE email = 'test@test.com';

-- 4. 결과 확인
SELECT email, name, role, password, LENGTH(password) as hash_length, approved 
FROM User 
WHERE email IN ('admin@superplace.com', 'test@test.com');

-- 예상 결과:
-- admin@superplace.com | 관리자 | SUPER_ADMIN | 00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f | 64 | 1
-- test@test.com | 테스트 | ADMIN | 39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c | 64 | 1
