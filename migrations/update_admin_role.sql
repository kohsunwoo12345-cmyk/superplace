-- 관리자 역할 변경 SQL

-- 1. 현재 사용자 확인
SELECT id, email, name, role FROM users WHERE email = 'admin@superplace.co.kr';

-- 2. 역할을 ADMIN으로 변경
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@superplace.co.kr';

-- 또는 ID로 변경 (ID=1인 경우)
UPDATE users SET role = 'ADMIN' WHERE id = 1;

-- 3. 변경 확인
SELECT id, email, name, role FROM users WHERE email = 'admin@superplace.co.kr';
