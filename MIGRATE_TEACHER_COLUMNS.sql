-- ============================================================
-- 🚀 교사 권한 및 반 배정 기능 활성화
-- ============================================================
-- 목적: User 테이블에 permissions, assignedClasses 컬럼 추가
-- 사용: Cloudflare D1 Console에서 실행
-- 경로: Cloudflare Dashboard → D1 → webapp-production → Console
-- ============================================================

-- 📋 STEP 1: 현재 스키마 확인
-- User 테이블의 현재 컬럼 목록 확인
PRAGMA table_info(User);

-- 📋 STEP 2: permissions 컬럼 추가
-- 만약 이미 존재하면 오류 발생 (무시하고 계속 진행)
ALTER TABLE User ADD COLUMN permissions TEXT;

-- 📋 STEP 3: assignedClasses 컬럼 추가
-- 만약 이미 존재하면 오류 발생 (무시하고 계속 진행)
ALTER TABLE User ADD COLUMN assignedClasses TEXT;

-- 📋 STEP 4: 업데이트된 스키마 확인
-- permissions와 assignedClasses 컬럼이 추가되었는지 확인
PRAGMA table_info(User);

-- 📋 STEP 5: 기존 교사들의 기본값 설정 (옵션)
-- 모든 교사에게 빈 배열 설정
UPDATE User 
SET 
  permissions = '[]',
  assignedClasses = '[]'
WHERE 
  role = 'TEACHER' 
  AND (permissions IS NULL OR assignedClasses IS NULL);

-- 📋 STEP 6: 테스트 조회
-- 교사 목록과 권한/반 배정 확인
SELECT 
  id, 
  name, 
  email, 
  role, 
  permissions, 
  assignedClasses,
  academyId,
  createdAt
FROM User 
WHERE role = 'TEACHER' 
ORDER BY createdAt DESC
LIMIT 5;

-- ============================================================
-- ✅ 완료 후 확인사항
-- ============================================================
-- 1. permissions 컬럼이 추가되었는지 확인
-- 2. assignedClasses 컬럼이 추가되었는지 확인
-- 3. 기존 교사 데이터에 빈 배열 '[]'이 설정되었는지 확인
-- 4. 브라우저에서 교사 관리 페이지 테스트:
--    https://superplacestudy.pages.dev/dashboard/teacher-management
-- ============================================================

-- ⚠️ 중요: 
-- ALTER TABLE 명령이 "column already exists" 오류를 발생시키면
-- 이미 컬럼이 존재한다는 의미이므로 무시하고 계속 진행하세요.
-- ============================================================
