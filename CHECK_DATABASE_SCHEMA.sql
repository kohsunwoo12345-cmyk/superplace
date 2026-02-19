-- ============================================================
-- 데이터베이스 스키마 확인 SQL
-- ============================================================
-- 목적: 테이블명, 컬럼명, 데이터 확인
-- 사용: Cloudflare D1 Console에서 실행
-- ============================================================

-- 1️⃣ 모든 테이블 목록 조회
SELECT name, type 
FROM sqlite_master 
WHERE type='table' 
ORDER BY name;

-- 2️⃣ Academy 테이블 확인 (대소문자 구분)
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%cademy%';

-- 3️⃣ User 테이블 확인 (대소문자 구분)
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%ser%';

-- 4️⃣ Academy 테이블 스키마 확인 (존재하는 경우)
PRAGMA table_info(Academy);

-- 5️⃣ academies 테이블 스키마 확인 (소문자인 경우)
PRAGMA table_info(academies);

-- 6️⃣ User 테이블 스키마 확인 (존재하는 경우)
PRAGMA table_info(User);

-- 7️⃣ users 테이블 스키마 확인 (소문자인 경우)
PRAGMA table_info(users);

-- 8️⃣ Academy 테이블 데이터 개수 (테이블명에 맞게 실행)
-- SELECT COUNT(*) FROM Academy;
-- SELECT COUNT(*) FROM academies;

-- 9️⃣ User 테이블에서 학원장 개수
-- SELECT COUNT(*) FROM User WHERE role = 'DIRECTOR';
-- SELECT COUNT(*) FROM users WHERE role = 'DIRECTOR';

-- 🔟 Academy + User 조인 테스트 (테이블명 확인 후 실행)
-- SELECT 
--   a.id,
--   a.name as academy_name,
--   u.name as director_name
-- FROM Academy a
-- LEFT JOIN User u ON a.directorId = u.id
-- LIMIT 3;
