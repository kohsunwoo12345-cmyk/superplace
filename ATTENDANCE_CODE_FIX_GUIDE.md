# 출석 코드 인증 문제 해결 가이드

## 🔍 문제 증상
- 학생이 출석 코드를 입력하면 "관리자에게 문의해주세요" 메시지 표시
- 출석 기록이 사라짐

## ✅ 해결 방법

### PR 머지 후 즉시 실행할 것

1. **PR을 main 브랜치에 머지**
   - https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
   - "Merge pull request" 버튼 클릭

2. **배포 완료 대기** (2-3분)
   - GitHub Actions에서 배포 진행 상황 확인
   - Cloudflare Pages 대시보드에서 배포 완료 확인

3. **Cloudflare D1 콘솔 접속**
   - https://dash.cloudflare.com
   - Workers & Pages > D1 데이터베이스 선택

4. **다음 SQL 실행**

```sql
-- 1단계: 모든 학생 조회
SELECT id, name, email FROM users WHERE role = 'STUDENT';

-- 2단계: 기존 출석 코드 확인
SELECT 
  sac.code,
  sac.userId,
  sac.isActive,
  u.name
FROM student_attendance_codes sac
LEFT JOIN users u ON sac.userId = u.id
WHERE u.role = 'STUDENT';

-- 3단계: 모든 코드 활성화
UPDATE student_attendance_codes SET isActive = 1;

-- 4단계: 코드가 없는 학생 찾기
SELECT u.id, u.name, u.email
FROM users u
WHERE u.role = 'STUDENT'
AND u.id NOT IN (SELECT userId FROM student_attendance_codes);

-- 5단계: 각 학생에게 코드 생성 (코드가 없는 경우)
-- 아래 쿼리를 각 학생 ID에 대해 실행 (예시: studentId = 1)
INSERT INTO student_attendance_codes (id, userId, code, isActive)
VALUES (
  'code-' || (strftime('%s', 'now') * 1000) || '-' || abs(random() % 1000000),
  1,  -- 학생 ID (변경 필요)
  printf('%06d', abs(random() % 1000000)),  -- 랜덤 6자리 코드
  1
);
```

## 📋 단계별 상세 가이드

### 1️⃣ 학생 목록 확인
```sql
SELECT id, name, email FROM users WHERE role = 'STUDENT' ORDER BY name;
```
결과 예시:
```
id | name   | email
---|--------|------------------
1  | 홍길동  | hong@example.com
2  | 김철수  | kim@example.com
```

### 2️⃣ 출석 코드 상태 확인
```sql
SELECT 
  sac.code,
  sac.userId,
  sac.isActive,
  u.name,
  u.email
FROM student_attendance_codes sac
LEFT JOIN users u ON sac.userId = u.id
ORDER BY u.name;
```

**예상 문제:**
- `isActive = 0` (비활성화됨)
- 일부 학생에게 코드가 없음

### 3️⃣ 모든 코드 활성화
```sql
UPDATE student_attendance_codes 
SET isActive = 1
WHERE isActive = 0 OR isActive IS NULL;

-- 확인
SELECT COUNT(*) as active_codes 
FROM student_attendance_codes 
WHERE isActive = 1;
```

### 4️⃣ 코드가 없는 학생에게 생성

**자동 생성 (한번에):**
```sql
-- 임시 테이블에 랜덤 코드 생성
WITH missing_students AS (
  SELECT u.id as studentId, u.name
  FROM users u
  WHERE u.role = 'STUDENT'
  AND u.id NOT IN (SELECT userId FROM student_attendance_codes)
)
SELECT 
  studentId,
  name,
  printf('%06d', abs(random() % 1000000)) as suggested_code
FROM missing_students;
```

위 결과를 보고 각 학생에게 수동으로 코드 생성:
```sql
-- 홍길동 (id=1)에게 코드 123456 생성
INSERT INTO student_attendance_codes (id, userId, code, isActive)
VALUES (
  'code-' || (strftime('%s', 'now') * 1000) || '-hong',
  1,
  '123456',
  1
);

-- 김철수 (id=2)에게 코드 654321 생성
INSERT INTO student_attendance_codes (id, userId, code, isActive)
VALUES (
  'code-' || (strftime('%s', 'now') * 1000) || '-kim',
  2,
  '654321',
  1
);
```

### 5️⃣ 최종 확인
```sql
-- 모든 학생이 활성화된 코드를 가지고 있는지 확인
SELECT 
  u.id,
  u.name,
  u.email,
  sac.code,
  sac.isActive,
  CASE 
    WHEN sac.code IS NULL THEN '❌ 코드 없음'
    WHEN sac.isActive = 0 THEN '❌ 비활성화'
    ELSE '✅ 정상'
  END as status
FROM users u
LEFT JOIN student_attendance_codes sac ON u.id = sac.userId
WHERE u.role = 'STUDENT'
ORDER BY u.name;
```

## 🧪 테스트

### 1. 코드 복사
D1 콘솔에서 확인한 코드를 복사:
```sql
SELECT u.name, sac.code 
FROM users u
JOIN student_attendance_codes sac ON u.id = sac.userId
WHERE u.role = 'STUDENT'
LIMIT 1;
```

### 2. 출석 인증 테스트
1. 브라우저 열기
2. https://genspark-ai-developer.superplacestudy.pages.dev/attendance-verify 접속
3. 위에서 복사한 6자리 코드 입력
4. "출석 인증하기" 버튼 클릭

**성공 시:**
```
✅ 출석 처리되었습니다!
→ 자동으로 숙제 제출 화면으로 이동
```

**실패 시:**
1. F12 눌러서 Console 탭 열기
2. 에러 메시지 확인
3. `debug` 객체 내용 확인:
   - `searchedCode`: 입력한 코드
   - `sampleCodesInDB`: DB에 실제 있는 코드 샘플

## 🔍 트러블슈팅

### 문제: "유효하지 않은 출석 코드입니다"
**원인:** DB에 해당 코드가 없음

**해결:**
```sql
-- 입력한 코드가 DB에 있는지 확인
SELECT * FROM student_attendance_codes WHERE code = '123456';

-- 없으면 생성
INSERT INTO student_attendance_codes (id, userId, code, isActive)
VALUES ('code-manual-1', 1, '123456', 1);
```

### 문제: "비활성화된 출석 코드입니다"
**원인:** `isActive = 0`

**해결:**
```sql
UPDATE student_attendance_codes 
SET isActive = 1 
WHERE code = '123456';
```

### 문제: "학생 정보를 찾을 수 없습니다"
**원인:** userId와 users.id 불일치

**해결:**
```sql
-- userId 확인
SELECT userId FROM student_attendance_codes WHERE code = '123456';

-- 해당 학생이 존재하는지 확인
SELECT * FROM users WHERE id = 1;

-- userId 수정
UPDATE student_attendance_codes 
SET userId = 2  -- 올바른 학생 ID
WHERE code = '123456';
```

## 📊 전체 상태 점검 쿼리

```sql
-- 전체 리포트
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') as total_students,
  (SELECT COUNT(*) FROM student_attendance_codes) as total_codes,
  (SELECT COUNT(*) FROM student_attendance_codes WHERE isActive = 1) as active_codes,
  (SELECT COUNT(*) FROM student_attendance_codes WHERE isActive = 0 OR isActive IS NULL) as inactive_codes,
  (SELECT COUNT(*) 
   FROM users u 
   WHERE u.role = 'STUDENT' 
   AND u.id NOT IN (SELECT userId FROM student_attendance_codes)
  ) as students_without_code;
```

**목표 상태:**
- `total_students = total_codes`
- `active_codes = total_codes`
- `inactive_codes = 0`
- `students_without_code = 0`

## 💡 예방 조치

앞으로 새 학생이 추가될 때 자동으로 코드 생성되도록:

```sql
-- 트리거 생성 (SQLite 지원 시)
CREATE TRIGGER IF NOT EXISTS auto_create_attendance_code
AFTER INSERT ON users
WHEN NEW.role = 'STUDENT'
BEGIN
  INSERT INTO student_attendance_codes (id, userId, code, isActive)
  VALUES (
    'code-' || (strftime('%s', 'now') * 1000) || '-' || NEW.id,
    NEW.id,
    printf('%06d', abs(random() % 1000000)),
    1
  );
END;
```

## 📞 추가 지원

위 방법으로 해결되지 않으면:
1. D1 콘솔 스크린샷
2. 브라우저 콘솔 로그 (F12 → Console)
3. 실패한 학생의 ID와 이름

제공해주시면 추가로 도와드리겠습니다!

---

**PR:** https://github.com/kohsunwoo12345-cmyk/superplace/pull/7  
**업데이트 날짜:** 2026-02-09
