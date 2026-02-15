# 🚨 긴급 수정: Students 테이블 재생성 필요

## 현재 상황
- 에러: `NOT NULL constraint failed: students.parent_name`
- 원인: 기존 students 테이블에 parent_name 컬럼이 NOT NULL 제약조건을 가지고 있음
- 문제: ALTER TABLE로는 NOT NULL 제약조건을 제거할 수 없음

## 해결 방법 (D1 콘솔에서 실행)

### 방법 1: 빠른 수정 (parent_name NULL 허용)

```sql
-- 1. 백업
CREATE TABLE students_backup AS SELECT * FROM students;

-- 2. 기존 테이블 삭제
DROP TABLE students;

-- 3. 새 테이블 생성 (모든 컬럼 NULL 허용)
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT,
    parent_name TEXT,
    academy_id INTEGER,
    school TEXT,
    grade TEXT,
    diagnostic_memo TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- 4. 백업에서 데이터 복원
INSERT INTO students (id, user_id, name, parent_name, academy_id, school, grade, diagnostic_memo, status, created_at, updated_at)
SELECT 
    b.id,
    b.user_id,
    COALESCE(b.name, u.name) as name,
    b.parent_name,
    b.academy_id,
    b.school,
    b.grade,
    b.diagnostic_memo,
    b.status,
    b.created_at,
    b.updated_at
FROM students_backup b
LEFT JOIN users u ON u.id = b.user_id;

-- 5. 확인
SELECT user_id, name, parent_name, school, grade FROM students ORDER BY id DESC LIMIT 5;

-- 6. 백업 삭제 (확인 후)
-- DROP TABLE students_backup;
```

### 방법 2: 최소한의 테이블 (name, parent_name 제외)

```sql
-- 1. 백업
CREATE TABLE students_backup AS SELECT * FROM students;

-- 2. 기존 테이블 삭제
DROP TABLE students;

-- 3. 새 테이블 생성 (name, parent_name 제외)
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    academy_id INTEGER,
    school TEXT,
    grade TEXT,
    diagnostic_memo TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- 4. 백업에서 데이터 복원
INSERT INTO students (id, user_id, academy_id, school, grade, diagnostic_memo, status, created_at, updated_at)
SELECT 
    id,
    user_id,
    academy_id,
    school,
    grade,
    diagnostic_memo,
    status,
    created_at,
    updated_at
FROM students_backup;

-- 5. 확인
SELECT user_id, school, grade, diagnostic_memo FROM students ORDER BY id DESC LIMIT 5;
```

## 실행 후

위 SQL을 D1 콘솔에서 실행한 후:
1. 브라우저를 새로고침
2. 학생 추가 페이지로 이동
3. 학생 정보 입력 후 추가
4. 성공 메시지 확인

## 주의사항

- **방법 1 권장**: parent_name 필드를 유지하되 NULL 허용
- 백업 테이블은 확인 후 삭제
- 데이터 손실 방지를 위해 백업 필수

