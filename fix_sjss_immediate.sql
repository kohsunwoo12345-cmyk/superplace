-- 🔧 학생 "Sjss" 정보 즉시 수정 SQL
-- 
-- 실행 위치: Cloudflare Dashboard → D1 → superplace DB → Console
-- 실행 시각: 2026-02-15
-- 
-- 이 SQL을 복사하여 Cloudflare D1 콘솔에 붙여넣고 실행하세요.

-- ============================================================
-- 1단계: 현재 학생 정보 확인
-- ============================================================

SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id,
  created_at
FROM users 
WHERE email = 'student_01085328_1771126812909@temp.student.local'
  AND role = 'STUDENT';

-- 예상 결과:
-- id | name | email                                      | phone    | school | grade | diagnostic_memo | academy_id
-- ?  | Sjss | student_01085328_1771126812909@temp.st...  | 01085328 | NULL   | NULL  | NULL            | NULL

-- ============================================================
-- 2단계: 학생 정보 업데이트
-- ============================================================

UPDATE users 
SET 
  school = '서울고등학교',           -- 👈 실제 학교명으로 변경하세요
  grade = '고2',                     -- 👈 실제 학년으로 변경하세요
  diagnostic_memo = '수학 보강 필요', -- 👈 진단 메모 (선택사항)
  academy_id = 120                    -- 👈 소속 학원 ID (창남 학원)
WHERE email = 'student_01085328_1771126812909@temp.student.local'
  AND role = 'STUDENT';

-- 예상 결과:
-- Query OK, 1 row affected

-- ============================================================
-- 3단계: 업데이트 결과 확인
-- ============================================================

SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id,
  created_at
FROM users 
WHERE email = 'student_01085328_1771126812909@temp.student.local'
  AND role = 'STUDENT';

-- 예상 결과:
-- id | name | email                                      | phone    | school         | grade | diagnostic_memo | academy_id
-- ?  | Sjss | student_01085328_1771126812909@temp.st...  | 01085328 | 서울고등학교    | 고2   | 수학 보강 필요   | 120

-- ============================================================
-- 4단계: (선택사항) 모든 NULL 필드를 가진 학생 찾기
-- ============================================================

SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id
FROM users 
WHERE role = 'STUDENT'
  AND (school IS NULL OR grade IS NULL)
ORDER BY id DESC
LIMIT 20;

-- ============================================================
-- 5단계: (선택사항) 모든 NULL 필드 학생 일괄 업데이트
-- ============================================================

-- ⚠️ 주의: 이 쿼리는 모든 NULL 필드를 "미정"으로 설정합니다.
-- 실행 전 반드시 4단계 결과를 확인하세요!

-- UPDATE users 
-- SET 
--   school = COALESCE(school, '미정'),
--   grade = COALESCE(grade, '미정'),
--   diagnostic_memo = COALESCE(diagnostic_memo, '')
-- WHERE role = 'STUDENT'
--   AND (school IS NULL OR grade IS NULL);

-- ============================================================
-- ✅ 완료 후 할 일
-- ============================================================
-- 
-- 1. 브라우저에서 학생 상세 페이지 새로고침 (F5)
-- 2. "미등록" 대신 입력한 정보가 표시되는지 확인
-- 3. 문제가 해결되지 않으면 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
--
-- ============================================================

-- 📝 참고: API를 통한 수정 방법
-- 
-- 배포가 완료되면 다음 API를 사용할 수도 있습니다:
-- 
-- PUT https://superplacestudy.pages.dev/api/students/edit
-- Content-Type: application/json
-- 
-- {
--   "studentId": 123,
--   "school": "서울고등학교",
--   "grade": "고2",
--   "diagnosticMemo": "수학 보강 필요"
-- }
--
