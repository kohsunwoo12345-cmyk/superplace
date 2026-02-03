# 🔴 관리자 로그인 문제 해결 가이드

## 🚨 현재 문제 상황

관리자 로그인 시도 시 다음 에러 발생:
```json
{
  "success": false,
  "message": "로그인 처리 중 오류가 발생했습니다",
  "error": "Cannot read properties of undefined (reading 'prepare')"
}
```

**원인**: Cloudflare Pages Functions에서 D1 데이터베이스 바인딩이 설정되지 않아 `context.env.DB`가 `undefined`임.

---

## ✅ 해결 방법 (3단계)

### 📋 **Step 1: Cloudflare D1 바인딩 설정 (필수)**

1. **Cloudflare 대시보드 접속**
   - URL: https://dash.cloudflare.com/
   
2. **프로젝트 설정으로 이동**
   - 왼쪽 메뉴: **Workers & Pages** 클릭
   - 프로젝트 선택: **superplacestudy** (또는 **superplace**) 클릭
   
3. **Functions 설정 열기**
   - 상단 탭: **Settings** 클릭
   - 왼쪽 섹션: **Functions** 선택
   
4. **D1 바인딩 추가**
   - **D1 database bindings** 섹션 찾기
   - 버튼 클릭: **Add binding**
   - 입력 폼:
     - **Variable name**: `DB` (대문자, 정확히 입력!)
     - **D1 database**: `superplace-db` 선택
   - 버튼 클릭: **Save**
   
5. **자동 재배포 대기**
   - 저장 후 1-2분 대기
   - Cloudflare Pages가 자동으로 재배포 시작

---

### 📋 **Step 2: D1 데이터베이스 초기화**

#### 2-1. D1 Console 접속
1. Cloudflare 대시보드: https://dash.cloudflare.com/
2. 왼쪽 메뉴: **Workers & Pages** → **D1** 클릭
3. 데이터베이스 선택: **superplace-db** 클릭
4. 상단 탭: **Console** 클릭

#### 2-2. 테이블 생성 SQL 실행

**Users 테이블:**
```sql
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_academyId ON users(academyId);
```

**Academy 테이블:**
```sql
CREATE TABLE IF NOT EXISTS academy (
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

CREATE INDEX IF NOT EXISTS idx_academy_code ON academy(code);
```

**Classes 테이블:**
```sql
CREATE TABLE IF NOT EXISTS classes (
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

CREATE INDEX IF NOT EXISTS idx_classes_academyId ON classes(academyId);
```

**Students 테이블:**
```sql
CREATE TABLE IF NOT EXISTS students (
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

CREATE INDEX IF NOT EXISTS idx_students_academyId ON students(academyId);
```

#### 2-3. 관리자 계정 생성

```sql
-- 관리자 계정 삽입
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

**중요**: 현재 개발 단계이므로 비밀번호를 **평문**으로 저장합니다. 프로덕션에서는 bcrypt 해시가 필요합니다.

#### 2-4. 테스트 학원 생성

```sql
-- 테스트 학원 삽입
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

#### 2-5. 데이터 확인

```sql
-- 관리자 계정 확인
SELECT * FROM users WHERE email = 'admin@superplace.com';

-- 테이블 목록 확인
SELECT name FROM sqlite_master WHERE type='table';
```

**예상 결과:**
- 테이블: users, academy, classes, students
- 관리자: id='admin-001', email='admin@superplace.com', role='ADMIN'

---

### 📋 **Step 3: 로그인 테스트**

#### 3-1. 배포 완료 대기
- Step 1의 D1 바인딩 저장 후 1-2분 대기
- Cloudflare Pages가 자동으로 재배포

#### 3-2. 로그인 테스트
1. URL 접속: https://genspark-ai-developer.superplacestudy.pages.dev/login
2. 관리자 계정으로 로그인:
   - **이메일**: admin@superplace.com
   - **비밀번호**: admin123456
3. 성공 시 `/dashboard`로 자동 이동

#### 3-3. API 직접 테스트 (선택사항)

**cURL 테스트:**
```bash
curl -X POST https://genspark-ai-developer.superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@superplace.com",
    "password": "admin123456"
  }'
```

**예상 응답 (성공):**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": "admin-001",
      "email": "admin@superplace.com",
      "name": "슈퍼플레이스 관리자",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🔍 문제 해결

### ❌ 여전히 "Cannot read properties of undefined" 에러

**확인 사항:**
1. D1 바인딩의 Variable name이 정확히 `DB`인지 확인 (대소문자 구분)
2. 바인딩 저장 후 1-2분 대기 (자동 재배포 시간)
3. 브라우저 캐시 삭제 후 재시도

### ❌ "이메일 또는 비밀번호가 올바르지 않습니다"

**확인 사항:**
1. D1 Console에서 관리자 계정 확인:
   ```sql
   SELECT * FROM users WHERE email = 'admin@superplace.com';
   ```
2. 계정이 없으면 Step 2-3 다시 실행
3. 비밀번호가 평문 `admin123456`인지 확인

### ❌ "UNIQUE constraint failed: users.email"

**해결:**
```sql
-- 기존 계정 삭제 후 재생성
DELETE FROM users WHERE email = 'admin@superplace.com';
-- Step 2-3의 INSERT 문 재실행
```

---

## 📊 체크리스트

배포 전 확인사항:

- [ ] **Step 1**: Cloudflare D1 바인딩 설정 (`DB`)
- [ ] **Step 2-2**: 4개 테이블 생성 (users, academy, classes, students)
- [ ] **Step 2-3**: 관리자 계정 생성 (admin@superplace.com)
- [ ] **Step 2-4**: 테스트 학원 생성 (SUPERPLACE01)
- [ ] **Step 2-5**: 데이터 확인 (SELECT 쿼리)
- [ ] **Step 3-1**: 배포 완료 대기 (1-2분)
- [ ] **Step 3-2**: 로그인 테스트 성공

---

## 🚀 배포 정보

- **Production URL**: https://genspark-ai-developer.superplacestudy.pages.dev/
- **로그인 페이지**: https://genspark-ai-developer.superplacestudy.pages.dev/login
- **회원가입 페이지**: https://genspark-ai-developer.superplacestudy.pages.dev/register
- **대시보드**: https://genspark-ai-developer.superplacestudy.pages.dev/dashboard

---

## 📝 관리자 계정

- **이메일**: admin@superplace.com
- **비밀번호**: admin123456
- **역할**: ADMIN
- **학원**: 없음 (슈퍼 관리자)

---

## 💡 추가 정보

### 데이터베이스 정보
- **Database ID**: 8c106540-21b4-4fa9-8879-c4956e459ca1
- **Database Name**: superplace-db
- **Binding Variable**: DB

### 관련 파일
- `wrangler.toml`: D1 설정
- `functions/api/auth/login.ts`: 로그인 API
- `functions/api/auth/signup.ts`: 회원가입 API
- `src/app/login/page.tsx`: 로그인 페이지
- `src/app/register/page.tsx`: 회원가입 페이지

---

**현재 커밋**: ce7b415
**배포 브랜치**: genspark_ai_developer
**배포 시간**: 1-2분 후 완료 예상

가장 중요한 것은 **Step 1의 D1 바인딩 설정**입니다. 이것이 없으면 API가 작동하지 않습니다!
