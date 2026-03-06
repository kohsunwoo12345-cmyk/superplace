-- =============================================
-- 테스트 데이터: 학생-학부모-리포트 연결 테스트
-- =============================================

-- 1. 기존 학생 테이블에 uniqueEmail 추가
UPDATE students SET uniqueEmail = 'student001@kumettang.com' WHERE id = (SELECT id FROM students LIMIT 1 OFFSET 0);
UPDATE students SET uniqueEmail = 'student002@kumettang.com' WHERE id = (SELECT id FROM students LIMIT 1 OFFSET 1);
UPDATE students SET uniqueEmail = 'student003@kumettang.com' WHERE id = (SELECT id FROM students LIMIT 1 OFFSET 2);

-- 2. 학부모 데이터 추가
INSERT OR IGNORE INTO parents (id, name, phone, email, academyId, createdAt)
SELECT 
  'parent-test-001',
  '김영희',
  '01012345678',
  'parent001@test.com',
  academyId,
  datetime('now')
FROM students 
WHERE uniqueEmail = 'student001@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO parents (id, name, phone, email, academyId, createdAt)
SELECT 
  'parent-test-002',
  '이철수',
  '01023456789',
  'parent002@test.com',
  academyId,
  datetime('now')
FROM students 
WHERE uniqueEmail = 'student002@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO parents (id, name, phone, email, academyId, createdAt)
SELECT 
  'parent-test-003',
  '박민수',
  '01034567890',
  'parent003@test.com',
  academyId,
  datetime('now')
FROM students 
WHERE uniqueEmail = 'student003@kumettang.com'
LIMIT 1;

-- 3. 학생-학부모 연결
INSERT OR IGNORE INTO student_parents (id, studentId, parentId, relationship, isPrimary, createdAt)
SELECT 
  'sp-test-001',
  s.id,
  'parent-test-001',
  'MOTHER',
  1,
  datetime('now')
FROM students s
WHERE s.uniqueEmail = 'student001@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO student_parents (id, studentId, parentId, relationship, isPrimary, createdAt)
SELECT 
  'sp-test-002',
  s.id,
  'parent-test-002',
  'FATHER',
  1,
  datetime('now')
FROM students s
WHERE s.uniqueEmail = 'student002@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO student_parents (id, studentId, parentId, relationship, isPrimary, createdAt)
SELECT 
  'sp-test-003',
  s.id,
  'parent-test-003',
  'MOTHER',
  1,
  datetime('now')
FROM students s
WHERE s.uniqueEmail = 'student003@kumettang.com'
LIMIT 1;

-- 4. 테스트용 랜딩페이지 데이터 추가 (landing_pages 테이블이 있다고 가정)
INSERT OR IGNORE INTO landing_pages (id, userId, academyId, title, slug, content, status, createdAt)
SELECT 
  'landing-test-001',
  userId,
  academyId,
  '2024년 1월 학습 리포트',
  'report-202401',
  '{"sections":[{"type":"header","content":"학습 리포트"}]}',
  'PUBLISHED',
  datetime('now', '-10 days')
FROM students 
WHERE uniqueEmail = 'student001@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO landing_pages (id, userId, academyId, title, slug, content, status, createdAt)
SELECT 
  'landing-test-002',
  userId,
  academyId,
  '2024년 1월 성적 분석',
  'analysis-202401',
  '{"sections":[{"type":"header","content":"성적 분석"}]}',
  'PUBLISHED',
  datetime('now', '-5 days')
FROM students 
WHERE uniqueEmail = 'student002@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO landing_pages (id, userId, academyId, title, slug, content, status, createdAt)
SELECT 
  'landing-test-003',
  userId,
  academyId,
  '2024년 1월 맞춤 학습 자료',
  'material-202401',
  '{"sections":[{"type":"header","content":"맞춤 학습 자료"}]}',
  'PUBLISHED',
  datetime('now', '-3 days')
FROM students 
WHERE uniqueEmail = 'student003@kumettang.com'
LIMIT 1;

-- 5. 학생 리포트 데이터 추가
INSERT OR IGNORE INTO student_reports (id, studentId, studentEmail, landingPageId, landingPageUrl, title, academyId, createdBy, isActive, createdAt)
SELECT 
  'report-test-001',
  s.id,
  'student001@kumettang.com',
  'landing-test-001',
  'https://superplacestudy.pages.dev/landing/landing-test-001',
  '2024년 1월 학습 리포트',
  s.academyId,
  s.userId,
  1,
  datetime('now', '-10 days')
FROM students s
WHERE s.uniqueEmail = 'student001@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO student_reports (id, studentId, studentEmail, landingPageId, landingPageUrl, title, academyId, createdBy, isActive, createdAt)
SELECT 
  'report-test-002',
  s.id,
  'student002@kumettang.com',
  'landing-test-002',
  'https://superplacestudy.pages.dev/landing/landing-test-002',
  '2024년 1월 성적 분석',
  s.academyId,
  s.userId,
  1,
  datetime('now', '-5 days')
FROM students s
WHERE s.uniqueEmail = 'student002@kumettang.com'
LIMIT 1;

INSERT OR IGNORE INTO student_reports (id, studentId, studentEmail, landingPageId, landingPageUrl, title, academyId, createdBy, isActive, createdAt)
SELECT 
  'report-test-003',
  s.id,
  'student003@kumettang.com',
  'landing-test-003',
  'https://superplacestudy.pages.dev/landing/landing-test-003',
  '2024년 1월 맞춤 학습 자료',
  s.academyId,
  s.userId,
  1,
  datetime('now', '-3 days')
FROM students s
WHERE s.uniqueEmail = 'student003@kumettang.com'
LIMIT 1;

-- 6. 검증 쿼리
SELECT 
  '=== 테스트 데이터 확인 ===' AS info;

SELECT 
  s.uniqueEmail AS 학생이메일,
  u.name AS 학생이름,
  p.name AS 학부모이름,
  p.phone AS 학부모연락처,
  sr.title AS 리포트제목,
  sr.landingPageUrl AS 랜딩페이지URL,
  sr.createdAt AS 리포트생성일
FROM students s
LEFT JOIN users u ON s.userId = u.id
LEFT JOIN student_parents sp ON s.id = sp.studentId
LEFT JOIN parents p ON sp.parentId = p.id
LEFT JOIN student_reports sr ON s.id = sr.studentId
WHERE s.uniqueEmail IN ('student001@kumettang.com', 'student002@kumettang.com', 'student003@kumettang.com')
ORDER BY s.uniqueEmail;

SELECT '✅ 테스트 데이터 생성 완료!' AS result;
