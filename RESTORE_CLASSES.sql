-- ============================================================
-- 클래스 데이터 복구 SQL
-- ============================================================
-- 목적: 데이터베이스에 클래스가 없을 경우 샘플 데이터 생성
-- 사용: Cloudflare D1 Console 또는 wrangler d1 execute로 실행
-- ============================================================

-- 1️⃣ 먼저 현재 클래스 데이터 확인
SELECT 
  id,
  academy_id,
  class_name,
  grade,
  description,
  teacher_id,
  created_at
FROM classes
ORDER BY created_at DESC
LIMIT 20;

-- 2️⃣ 학원 정보 확인
SELECT 
  id,
  name,
  directorId,
  isActive
FROM academies
LIMIT 10;

-- 3️⃣ 사용자 정보 확인 (학원장, 선생님)
SELECT 
  id,
  email,
  name,
  role,
  academy_id,
  academyId
FROM users
WHERE role IN ('DIRECTOR', 'TEACHER', 'ADMIN')
ORDER BY createdAt DESC
LIMIT 10;

-- ============================================================
-- 클래스 데이터 복구 (필요시 실행)
-- ============================================================

-- 🔹 학원 1번에 대한 샘플 클래스 생성
-- 주의: academy_id=1인 학원이 존재하는지 먼저 확인하세요!

INSERT INTO classes (
  id,
  academy_id,
  class_name,
  grade,
  description,
  teacher_id,
  color,
  created_at,
  updated_at
)
VALUES
  (
    'class-001-restored',
    1,
    '초급 파이썬 프로그래밍',
    '초등 4-6학년',
    '파이썬 기초부터 차근차근 배우는 수업',
    NULL,
    '#3b82f6',
    datetime('now'),
    datetime('now')
  ),
  (
    'class-002-restored',
    1,
    '중급 스크래치',
    '초등 3-5학년',
    '스크래치로 게임과 애니메이션 만들기',
    NULL,
    '#8b5cf6',
    datetime('now'),
    datetime('now')
  ),
  (
    'class-003-restored',
    1,
    '고급 웹 개발',
    '중등 1-3학년',
    'HTML, CSS, JavaScript로 웹사이트 만들기',
    NULL,
    '#10b981',
    datetime('now'),
    datetime('now')
  );

-- ============================================================
-- 복구 후 확인
-- ============================================================

-- 전체 클래스 수 확인
SELECT COUNT(*) as total_classes FROM classes;

-- 학원별 클래스 수 확인
SELECT 
  academy_id,
  COUNT(*) as class_count
FROM classes
GROUP BY academy_id;

-- 복구된 클래스 상세 확인
SELECT 
  c.id,
  c.academy_id,
  c.class_name,
  c.grade,
  c.description,
  c.teacher_id,
  c.color,
  a.name as academy_name,
  c.created_at
FROM classes c
LEFT JOIN academies a ON c.academy_id = a.id
WHERE c.id LIKE '%restored%'
ORDER BY c.created_at DESC;
