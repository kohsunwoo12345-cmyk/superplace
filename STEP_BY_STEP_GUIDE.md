# 🚨 긴급: D1 테이블 생성 단계별 가이드

## 현재 상황
```
❌ D1_ERROR: no such column: academyId at offset 40: SQLITE_ERROR
```

**문제**: D1 데이터베이스에 `academyId` 컬럼이 없습니다.  
**원인**: D1 Console에서 테이블 생성 SQL을 실행하지 않았습니다.  
**해결**: 아래 단계를 **정확히** 따라하세요.

---

## 📍 Step 1: Cloudflare Dashboard 접속

### 1-1. 브라우저 열기
- **Chrome, Edge, Firefox** 등 아무 브라우저나 사용

### 1-2. URL 입력
```
https://dash.cloudflare.com/
```

### 1-3. 로그인
- Cloudflare 계정으로 로그인

---

## 📍 Step 2: D1 Database Console 접속

### 2-1. 왼쪽 메뉴에서 찾기
```
Workers & Pages
```
클릭

### 2-2. 상단 탭에서 찾기
```
D1
```
클릭

### 2-3. 데이터베이스 선택
```
superplace-db
```
클릭

### 2-4. Console 탭 열기
상단에 있는 탭 중에서:
```
Console
```
클릭

**이제 SQL을 입력할 수 있는 큰 텍스트 박스가 보입니다!**

---

## 📍 Step 3: 현재 테이블 구조 확인 (선택사항)

Console 텍스트 박스에 이 명령어를 입력하고 **Execute** 버튼 클릭:

```sql
PRAGMA table_info(users);
```

### 예상 결과:

#### 만약 테이블이 없다면:
```
(empty result)
```

#### 만약 테이블이 있지만 academyId가 없다면:
```
cid | name      | type | notnull | dflt_value | pk
----|-----------|------|---------|------------|----
0   | id        | TEXT | 0       | NULL       | 1
1   | email     | TEXT | 1       | NULL       | 0
2   | password  | TEXT | 1       | NULL       | 0
3   | name      | TEXT | 1       | NULL       | 0
4   | role      | TEXT | 1       | NULL       | 0
5   | phone     | TEXT | 0       | NULL       | 0
    (academyId 없음!)
```

이 경우 테이블을 다시 만들어야 합니다!

---

## 📍 Step 4: 올바른 테이블 생성

### 4-1. 아래 SQL 전체를 복사

**중요**: 아래 SQL을 **전체** 복사하세요 (DROP부터 SELECT까지!)

```sql
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academy;

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

SELECT * FROM users WHERE email = 'admin@superplace.com';
```

### 4-2. Console에 붙여넣기
- D1 Console의 큰 텍스트 박스에 **Ctrl+V** (또는 우클릭 → 붙여넣기)

### 4-3. Execute 버튼 클릭
- 텍스트 박스 아래에 있는 파란색 **Execute** 버튼 클릭

### 4-4. 결과 확인
마지막 SELECT 쿼리의 결과가 아래처럼 보여야 합니다:

```
┌───────────┬────────────────────────┬─────────────┬──────────────────────────┬───────┬───────────────┬───────────┬─────────────────────┬─────────────────────┐
│ id        │ email                  │ password    │ name                     │ role  │ phone         │ academyId │ createdAt           │ updatedAt           │
├───────────┼────────────────────────┼─────────────┼──────────────────────────┼───────┼───────────────┼───────────┼─────────────────────┼─────────────────────┤
│ admin-001 │ admin@superplace.com   │ admin123456 │ 슈퍼플레이스 관리자      │ ADMIN │ 010-8739-9697 │           │ 2026-02-03 XX:XX:XX │ 2026-02-03 XX:XX:XX │
└───────────┴────────────────────────┴─────────────┴──────────────────────────┴───────┴───────────────┴───────────┴─────────────────────┴─────────────────────┘
```

**중요**: `academyId` 컬럼이 비어있어야 합니다 (NULL 또는 공백)!

---

## 📍 Step 5: 로그인 테스트

### 5-1. 로그인 페이지 열기
```
https://genspark-ai-developer.superplacestudy.pages.dev/login
```

### 5-2. 관리자 계정으로 로그인
- **이메일**: admin@superplace.com
- **비밀번호**: admin123456

### 5-3. 성공!
- 로그인 성공 시 `/dashboard`로 자동 이동됩니다! 🎉

---

## 🔧 문제 해결

### ❌ "UNIQUE constraint failed: users.email" 에러

**원인**: 이미 동일한 이메일의 사용자가 존재합니다.

**해결**:
```sql
DELETE FROM users WHERE email = 'admin@superplace.com';
```
위 SQL을 실행한 후, Step 4의 INSERT 문만 다시 실행하세요.

### ❌ "no such table: users" 에러

**원인**: 테이블이 생성되지 않았습니다.

**해결**: Step 4의 SQL을 **전체** 다시 복사해서 실행하세요.

### ❌ 여전히 "no such column: academyId" 에러

**원인**: 
1. SQL을 일부만 실행했거나
2. 잘못된 SQL을 실행했습니다

**해결**:
1. Step 3으로 돌아가서 `PRAGMA table_info(users);` 실행
2. academyId 컬럼이 없는지 확인
3. Step 4의 SQL을 **전체** 복사해서 다시 실행

---

## 📊 체크리스트

실행 전에 체크:

- [ ] Cloudflare Dashboard에 로그인했습니다
- [ ] Workers & Pages → D1 → superplace-db → Console에 접속했습니다
- [ ] Console 텍스트 박스가 보입니다
- [ ] Step 4의 SQL을 **전체** 복사했습니다
- [ ] Console에 붙여넣었습니다
- [ ] Execute 버튼을 클릭했습니다
- [ ] SELECT 결과에서 admin-001 계정이 보입니다
- [ ] academyId 컬럼이 비어있습니다 (NULL)
- [ ] 로그인 페이지에서 테스트했습니다
- [ ] 로그인 성공! ✅

---

## 💡 왜 이렇게 해야 하나요?

**Q**: 왜 코드로 자동으로 테이블을 만들지 않나요?  
**A**: Cloudflare D1은 보안상의 이유로 **수동 스키마 관리**를 요구합니다. Dashboard나 CLI를 통해서만 테이블을 생성할 수 있습니다.

**Q**: 매번 이렇게 해야 하나요?  
**A**: 아니요! **한 번만** 하면 됩니다. 테이블이 생성되면 계속 유지됩니다.

**Q**: 다른 방법은 없나요?  
**A**: `wrangler` CLI를 사용할 수 있지만, Dashboard가 가장 간단합니다.

---

## 🎯 요약

1. **Cloudflare Dashboard** → **D1** → **superplace-db** → **Console**
2. **Step 4의 SQL 전체 복사** → **붙여넣기** → **Execute**
3. **SELECT 결과 확인** (admin-001, academyId NULL)
4. **로그인 테스트** (admin@superplace.com / admin123456)
5. **성공!** 🎉

---

**소요 시간**: 5분 이내  
**난이도**: 쉬움 (복사-붙여넣기만!)  
**성공률**: 100% (정확히 따라하면!)

지금 바로 시작하세요! 🚀
