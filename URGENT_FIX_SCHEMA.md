# 🔴 URGENT: D1 테이블 스키마 수정 필요

## 현재 에러:
```
D1_ERROR: no such column: academyId at offset 40: SQLITE_ERROR
```

## 원인:
Users 테이블에 `academyId` 컬럼이 없습니다.

## 해결 방법:

### 1️⃣ Cloudflare D1 Console 접속
1. https://dash.cloudflare.com/
2. Workers & Pages → D1 → superplace-db → Console

### 2️⃣ 기존 테이블 삭제 (있다면)
```sql
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academy;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS students;
```

### 3️⃣ 올바른 스키마로 테이블 생성

**Users 테이블:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  academyId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_academyId ON users(academyId);
```

**Academy 테이블:**
```sql
CREATE TABLE academy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logoUrl TEXT,
  subscriptionPlan TEXT DEFAULT 'FREE',
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_academy_code ON academy(code);
```

**Classes 테이블:**
```sql
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  startDate TEXT,
  endDate TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);

CREATE INDEX idx_classes_academyId ON classes(academyId);
```

**Students 테이블:**
```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  grade TEXT,
  parentPhone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX idx_students_academyId ON students(academyId);
```

### 4️⃣ 관리자 계정 생성
```sql
INSERT INTO users (
  id, email, password, name, role, phone, academyId, createdAt, updatedAt
) VALUES (
  'admin-001',
  'admin@superplace.com',
  'admin123456',
  '슈퍼플레이스 관리자',
  'ADMIN',
  '010-8739-9697',
  NULL,
  datetime('now'),
  datetime('now')
);
```

### 5️⃣ 테스트 학원 생성 (선택사항)
```sql
INSERT INTO academy (
  id, name, code, description, address, phone, email, 
  subscriptionPlan, maxStudents, maxTeachers, isActive, 
  createdAt, updatedAt
) VALUES (
  'academy-001',
  '슈퍼플레이스 학원',
  'SUPERPLACE01',
  '체계적인 학습 관리를 위한 스마트 학원',
  '인천광역시 서구 청라커낼로 270, 2층',
  '010-8739-9697',
  'academy@superplace.com',
  'PREMIUM',
  100,
  10,
  1,
  datetime('now'),
  datetime('now')
);
```

### 6️⃣ 확인
```sql
-- 테이블 구조 확인
PRAGMA table_info(users);

-- 데이터 확인
SELECT * FROM users WHERE email = 'admin@superplace.com';
```

## 예상 결과:

**PRAGMA table_info(users) 결과:**
| cid | name | type | notnull | dflt_value | pk |
|-----|------|------|---------|------------|-----|
| 0 | id | TEXT | 0 | NULL | 1 |
| 1 | email | TEXT | 1 | NULL | 0 |
| 2 | password | TEXT | 1 | NULL | 0 |
| 3 | name | TEXT | 1 | NULL | 0 |
| 4 | role | TEXT | 1 | NULL | 0 |
| 5 | phone | TEXT | 0 | NULL | 0 |
| 6 | academyId | TEXT | 0 | NULL | 0 |
| 7 | createdAt | TEXT | 0 | (datetime('now')) | 0 |
| 8 | updatedAt | TEXT | 0 | (datetime('now')) | 0 |

**SELECT 결과:**
| id | email | password | name | role | phone | academyId |
|----|-------|----------|------|------|-------|-----------|
| admin-001 | admin@superplace.com | admin123456 | 슈퍼플레이스 관리자 | ADMIN | 010-8739-9697 | NULL |

## 완료 후:

1. 로그인 페이지 접속: https://genspark-ai-developer.superplacestudy.pages.dev/login
2. 관리자 계정으로 로그인:
   - 이메일: admin@superplace.com
   - 비밀번호: admin123456
3. 성공! 🎉

---

## 빠른 실행 (모든 SQL 한번에):

```sql
-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academy;

-- 2. Users 테이블 생성
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  academyId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_academyId ON users(academyId);

-- 3. Academy 테이블 생성
CREATE TABLE academy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logoUrl TEXT,
  subscriptionPlan TEXT DEFAULT 'FREE',
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_academy_code ON academy(code);

-- 4. Classes 테이블 생성
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  startDate TEXT,
  endDate TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);
CREATE INDEX idx_classes_academyId ON classes(academyId);

-- 5. Students 테이블 생성
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  grade TEXT,
  parentPhone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);
CREATE INDEX idx_students_academyId ON students(academyId);

-- 6. 관리자 계정 생성
INSERT INTO users (
  id, email, password, name, role, phone, academyId, createdAt, updatedAt
) VALUES (
  'admin-001',
  'admin@superplace.com',
  'admin123456',
  '슈퍼플레이스 관리자',
  'ADMIN',
  '010-8739-9697',
  NULL,
  datetime('now'),
  datetime('now')
);

-- 7. 테스트 학원 생성
INSERT INTO academy (
  id, name, code, description, address, phone, email, 
  subscriptionPlan, maxStudents, maxTeachers, isActive, 
  createdAt, updatedAt
) VALUES (
  'academy-001',
  '슈퍼플레이스 학원',
  'SUPERPLACE01',
  '체계적인 학습 관리를 위한 스마트 학원',
  '인천광역시 서구 청라커낼로 270, 2층',
  '010-8739-9697',
  'academy@superplace.com',
  'PREMIUM',
  100,
  10,
  1,
  datetime('now'),
  datetime('now')
);

-- 8. 확인
SELECT * FROM users WHERE email = 'admin@superplace.com';
SELECT * FROM academy WHERE code = 'SUPERPLACE01';
```

위 SQL을 D1 Console에 복사-붙여넣기하고 실행하세요!
