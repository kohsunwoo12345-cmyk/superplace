# 🔧 Students 테이블 수정 가이드

## 문제
`NOT NULL constraint failed: students.name` 에러 발생

## 원인
기존 students 테이블에 name 컬럼이 있지만, 기존 레코드들의 name이 NULL이거나 
컬럼 자체가 NOT NULL 제약조건을 가지고 있어 INSERT 실패

## 해결 방법

**D1 콘솔에서 다음 SQL 쿼리를 순서대로 실행해주세요:**

### 1단계: 현재 테이블 구조 확인
```sql
PRAGMA table_info(students);
```
→ name 컬럼이 있는지, notnull 값이 1인지 확인

### 2단계: 기존 레코드에 name 채우기
```sql
-- users 테이블에서 name 가져와서 students 테이블 업데이트
UPDATE students 
SET name = (SELECT name FROM users WHERE users.id = students.user_id)
WHERE name IS NULL OR name = '';
```

### 3단계: name 컬럼이 아예 없다면 추가
```sql
-- name 컬럼이 없을 경우에만 실행
ALTER TABLE students ADD COLUMN name TEXT;

-- 추가 후 데이터 채우기
UPDATE students 
SET name = (SELECT name FROM users WHERE users.id = students.user_id);
```

### 4단계: 확인
```sql
-- NULL인 name이 있는지 확인
SELECT user_id, name, school, grade FROM students WHERE name IS NULL LIMIT 5;

-- 최근 레코드 확인
SELECT user_id, name, school, grade, diagnostic_memo FROM students ORDER BY id DESC LIMIT 5;
```

### 5단계: 테스트
위 쿼리 실행 후, 학생 추가 페이지에서 다시 테스트해주세요.

---

## 대안: 테이블 재생성 (위 방법이 안될 경우)

```sql
-- 백업
CREATE TABLE students_backup AS SELECT * FROM students;

-- 기존 테이블 삭제
DROP TABLE students;

-- 새 테이블 생성 (name 컬럼 포함)
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT,
    academy_id INTEGER,
    school TEXT,
    grade TEXT,
    diagnostic_memo TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- 백업에서 데이터 복원 (name은 users에서 가져오기)
INSERT INTO students (id, user_id, name, academy_id, school, grade, diagnostic_memo, status, created_at, updated_at)
SELECT 
    b.id, 
    b.user_id, 
    u.name,
    b.academy_id, 
    b.school, 
    b.grade, 
    b.diagnostic_memo, 
    b.status, 
    b.created_at, 
    b.updated_at
FROM students_backup b
LEFT JOIN users u ON u.id = b.user_id;

-- 확인 후 백업 삭제
-- DROP TABLE students_backup;
```

