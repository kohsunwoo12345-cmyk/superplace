-- ============================================================
-- 교사 권한 및 반 배정 컬럼 추가
-- ============================================================
-- 목적: User 테이블에 permissions, assignedClasses 컬럼 추가
-- 사용: Cloudflare D1 Console에서 실행
-- ============================================================

-- 1️⃣ User 테이블 스키마 확인
PRAGMA table_info(User);

-- 2️⃣ permissions 컬럼 추가 (JSON 배열 저장)
-- 예: ["view_students", "edit_students", "view_attendance"]
ALTER TABLE User ADD COLUMN permissions TEXT;

-- 3️⃣ assignedClasses 컬럼 추가 (JSON 배열 저장)
-- 예: ["class-123", "class-456"]
ALTER TABLE User ADD COLUMN assignedClasses TEXT;

-- 4️⃣ 업데이트 확인
PRAGMA table_info(User);

-- 5️⃣ 테스트: 교사 권한 설정
-- UPDATE User 
-- SET permissions = '["view_students","edit_students"]'
-- WHERE role = 'TEACHER' AND id = 'your-teacher-id';

-- 6️⃣ 테스트: 반 배정
-- UPDATE User 
-- SET assignedClasses = '["class-1","class-2"]'
-- WHERE role = 'TEACHER' AND id = 'your-teacher-id';

-- 7️⃣ 조회 테스트
-- SELECT id, name, role, permissions, assignedClasses 
-- FROM User 
-- WHERE role = 'TEACHER' 
-- LIMIT 5;
