-- =========================================
-- 출석 코드 문제 완전 해결 SQL 스크립트
-- =========================================
-- Cloudflare D1 Console에서 직접 실행
-- https://dash.cloudflare.com → Workers & Pages → D1 → superplace-db → Console

-- 1단계: 현재 상태 확인
-- =========================================
SELECT 
  '📊 전체 통계' as info,
  COUNT(*) as total_codes,
  SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active_codes,
  SUM(CASE WHEN isActive != 1 OR isActive IS NULL THEN 1 ELSE 0 END) as inactive_codes
FROM student_attendance_codes;

-- 2단계: 문제 코드 확인
-- =========================================
SELECT 
  '❌ 비활성 코드' as info,
  u.id as userId,
  u.name,
  u.email,
  sac.code,
  sac.isActive
FROM users u
JOIN student_attendance_codes sac ON u.id = sac.userId
WHERE sac.isActive != 1 OR sac.isActive IS NULL
ORDER BY u.name;

-- 3단계: 코드 없는 학생 확인
-- =========================================
SELECT 
  '⚠️ 코드 없음' as info,
  u.id,
  u.name,
  u.email
FROM users u
WHERE u.role = 'STUDENT'
  AND u.id NOT IN (SELECT userId FROM student_attendance_codes)
ORDER BY u.name;

-- 4단계: 모든 코드 강제 활성화 (메인 해결책)
-- =========================================
UPDATE student_attendance_codes 
SET isActive = 1
WHERE isActive != 1 OR isActive IS NULL;

-- 5단계: 결과 확인
-- =========================================
SELECT 
  '✅ 활성화 후' as info,
  COUNT(*) as total_codes,
  SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active_codes,
  SUM(CASE WHEN isActive != 1 OR isActive IS NULL THEN 1 ELSE 0 END) as inactive_codes
FROM student_attendance_codes;

-- 6단계: 전체 코드 목록 확인
-- =========================================
SELECT 
  u.id as userId,
  u.name,
  u.email,
  sac.code,
  sac.isActive,
  CASE 
    WHEN sac.isActive = 1 THEN '✅ 활성'
    ELSE '❌ 비활성'
  END as status
FROM users u
LEFT JOIN student_attendance_codes sac ON u.id = sac.userId
WHERE u.role = 'STUDENT'
ORDER BY u.name;

-- 7단계: 코드 없는 학생에게 코드 생성 (필요시)
-- =========================================
-- 주의: 아래 SQL은 예시입니다. userId를 실제 값으로 변경하세요.
-- 
-- INSERT INTO student_attendance_codes (id, userId, code, isActive)
-- VALUES (
--   'code-manual-' || CAST(strftime('%s', 'now') * 1000 AS TEXT),
--   1,  -- ← 여기에 실제 userId 입력
--   printf('%06d', abs(random() % 1000000)),
--   1
-- );

-- 8단계: 출석 기록 테이블 확인 (선택사항)
-- =========================================
SELECT 
  '📅 최근 출석 기록' as info,
  ac.id,
  u.name,
  ac.date,
  ac.status,
  ac.checkInTime
FROM attendance_check ac
JOIN users u ON ac.userId = u.id
ORDER BY ac.checkInTime DESC
LIMIT 10;

-- =========================================
-- 완료 체크리스트
-- =========================================
-- [ ] 1단계 실행 → 비활성 코드 개수 확인
-- [ ] 4단계 실행 → UPDATE student_attendance_codes
-- [ ] 5단계 실행 → 모든 코드가 active = 1 확인
-- [ ] 6단계 실행 → 모든 학생의 코드와 상태 확인
-- [ ] 웹에서 테스트 → attendance-verify 페이지에서 코드 입력
-- [ ] "출석 처리되었습니다!" 메시지 확인

-- =========================================
-- 트러블슈팅
-- =========================================
-- 문제: UPDATE 실행 후에도 isActive가 0
-- 해결: 
--   DELETE FROM student_attendance_codes WHERE isActive != 1;
--   그리고 /api/admin/fix-attendance-codes POST 호출
--
-- 문제: 특정 학생만 계속 실패
-- 해결:
--   SELECT * FROM student_attendance_codes WHERE userId = <문제학생ID>;
--   코드가 없으면 7단계 SQL로 수동 생성
--
-- 문제: 출석 기록이 사라짐
-- 해결:
--   SELECT COUNT(*) FROM attendance_check;
--   0이면 테이블이 초기화된 것 → 정상 (새로운 출석 기록 생성됨)
