# 🔴 500 에러 완전 해결 가이드

## 🚨 현재 에러 상황

### 프론트엔드 에러:
```
로그인 처리 중 오류가 발생했습니다
```

### 브라우저 콘솔 에러:
```
Failed to load resource: the server responded with a status of 404 () forgot-password.txt?_rsc=asqg6:1
Failed to load resource: the server responded with a status of 404 () Understand this error
Failed to load resource: the server responded with a status of 500 () api/auth/login:1
```

### API 응답:
```json
{
  "success": false,
  "message": "로그인 처리 중 오류가 발생했습니다",
  "error": "Cannot read properties of undefined (reading 'prepare')"
}
```

---

## 🎯 문제 원인 분석

### 주요 원인: D1 바인딩 미설정

Cloudflare Pages Functions에서 D1 데이터베이스를 사용하려면 **환경 변수 바인딩**이 필요합니다.

현재 상태:
- ✅ `wrangler.toml`에 D1 설정 완료
- ✅ `functions/api/auth/login.ts` API 코드 완료
- ❌ **Cloudflare Dashboard에서 D1 바인딩 미설정**

결과:
- `context.env.DB`가 `undefined`
- `.prepare()` 메서드 호출 시 에러 발생

---

## ✅ 해결 방법 (100% 확실)

### 📋 Step 1: Cloudflare Dashboard에서 D1 바인딩 설정

#### 1-1. Dashboard 접속
1. URL 열기: https://dash.cloudflare.com/
2. Cloudflare 계정으로 로그인

#### 1-2. 프로젝트 선택
1. 왼쪽 메뉴: **Workers & Pages** 클릭
2. 프로젝트 목록에서: **superplacestudy** (또는 **superplace**) 클릭

#### 1-3. Functions 설정 열기
1. 상단 탭: **Settings** 클릭
2. 왼쪽 사이드바: **Functions** 선택

#### 1-4. D1 바인딩 추가
1. 페이지를 아래로 스크롤하여 **D1 database bindings** 섹션 찾기
2. **Add binding** 버튼 클릭
3. 폼 입력:
   - **Variable name**: `DB` 
     - ⚠️ 반드시 대문자로 정확히 `DB` 입력!
     - 소문자 `db`나 다른 이름 사용 시 작동하지 않음
   - **D1 database**: 드롭다운에서 `superplace-db` 선택
4. **Save** 버튼 클릭

#### 1-5. 자동 재배포 대기
- Save 후 Cloudflare Pages가 자동으로 재배포 시작
- 재배포 완료까지 **1-2분** 소요
- **Deployments** 탭에서 진행 상황 확인 가능

---

### 📋 Step 2: D1 데이터베이스 초기화 (최초 1회)

#### 2-1. D1 Console 접속
1. Cloudflare Dashboard: https://dash.cloudflare.com/
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
```

#### 2-3. 관리자 계정 생성

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

#### 2-4. 데이터 확인

```sql
SELECT * FROM users WHERE email = 'admin@superplace.com';
```

**예상 결과:**
| id | email | password | name | role | phone |
|----|-------|----------|------|------|-------|
| admin-001 | admin@superplace.com | admin123456 | 슈퍼플레이스 관리자 | ADMIN | 010-8739-9697 |

---

### 📋 Step 3: 로그인 테스트

#### 3-1. 로그인 페이지 접속
URL: https://genspark-ai-developer.superplacestudy.pages.dev/login

#### 3-2. 관리자 계정으로 로그인
- **이메일**: admin@superplace.com
- **비밀번호**: admin123456

#### 3-3. 성공 확인
- ✅ 로그인 성공 시 → `/dashboard`로 자동 리다이렉트
- ❌ 에러 발생 시 → 아래 "문제 해결" 참고

---

## 🔧 문제 해결

### ❌ 여전히 "Cannot read properties of undefined" 에러

**원인:** D1 바인딩이 올바르게 설정되지 않음

**해결:**
1. D1 바인딩의 Variable name이 정확히 `DB`인지 확인 (대소문자 구분!)
2. 바인딩 저장 후 1-2분 대기 (자동 재배포 시간)
3. Deployments 탭에서 재배포 완료 확인
4. 브라우저 캐시 삭제:
   - Chrome: Ctrl+Shift+Delete → "캐시된 이미지 및 파일" 선택 → 삭제
   - 또는 시크릿 모드로 테스트

### ❌ "D1 데이터베이스 바인딩이 설정되지 않았습니다" 에러

**원인:** 최신 배포에서 D1 바인딩을 명시적으로 확인하도록 코드 수정됨

**해결:**
- 이 메시지는 Step 1을 완료하지 않았다는 명확한 신호입니다
- Step 1-4의 D1 바인딩 추가를 정확히 따라 하세요

### ❌ "이메일 또는 비밀번호가 올바르지 않습니다" 에러

**원인:** 데이터베이스에 관리자 계정이 없음

**해결:**
1. D1 Console에서 계정 확인:
   ```sql
   SELECT * FROM users WHERE email = 'admin@superplace.com';
   ```
2. 결과가 없으면 Step 2-3의 INSERT 문 실행
3. 이미 존재한다는 에러가 나면:
   ```sql
   DELETE FROM users WHERE email = 'admin@superplace.com';
   -- 그 다음 INSERT 문 재실행
   ```

### ❌ "UNIQUE constraint failed: users.email" 에러

**원인:** 이미 동일한 이메일의 사용자가 존재함

**해결:**
```sql
-- 기존 계정 삭제 후 재생성
DELETE FROM users WHERE email = 'admin@superplace.com';

-- Step 2-3의 INSERT 문 재실행
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

---

## 🧪 API 직접 테스트 (선택사항)

터미널에서 API를 직접 테스트할 수 있습니다:

```bash
curl -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin123456"}'
```

### 예상 응답 (성공):
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

### 예상 응답 (D1 바인딩 미설정):
```json
{
  "success": false,
  "message": "D1 데이터베이스 바인딩이 설정되지 않았습니다",
  "error": "DB binding not found. Please configure D1 binding in Cloudflare Pages settings.",
  "instructions": {
    "step1": "Go to Cloudflare Dashboard",
    "step2": "Workers & Pages → superplacestudy → Settings → Functions",
    "step3": "Add D1 binding: Variable name = DB, Database = superplace-db"
  }
}
```

---

## 📊 체크리스트

완료 여부를 체크하세요:

- [ ] **Cloudflare Dashboard 접속** (https://dash.cloudflare.com/)
- [ ] **Workers & Pages → superplacestudy 선택**
- [ ] **Settings → Functions 이동**
- [ ] **D1 database bindings 섹션 찾기**
- [ ] **Add binding 클릭**
- [ ] **Variable name: DB (대문자!)**
- [ ] **D1 database: superplace-db 선택**
- [ ] **Save 클릭**
- [ ] **1-2분 대기 (재배포)**
- [ ] **D1 Console 접속**
- [ ] **Users 테이블 생성**
- [ ] **관리자 계정 생성 (admin@superplace.com)**
- [ ] **데이터 확인 (SELECT 쿼리)**
- [ ] **로그인 페이지 접속**
- [ ] **로그인 테스트 (admin@superplace.com / admin123456)**
- [ ] **대시보드 접속 성공**

---

## 📝 데이터베이스 정보

- **Database ID**: 8c106540-21b4-4fa9-8879-c4956e459ca1
- **Database Name**: superplace-db
- **Binding Variable**: DB (대문자!)

---

## 🎯 관리자 계정 정보

- **이메일**: admin@superplace.com
- **비밀번호**: admin123456
- **역할**: ADMIN
- **전화번호**: 010-8739-9697

---

## 🚀 배포 정보

- **Production URL**: https://genspark-ai-developer.superplacestudy.pages.dev/
- **로그인 페이지**: https://genspark-ai-developer.superplacestudy.pages.dev/login
- **회원가입 페이지**: https://genspark-ai-developer.superplacestudy.pages.dev/register
- **대시보드**: https://genspark-ai-developer.superplacestudy.pages.dev/dashboard

---

## 💡 자동 설정 스크립트

터미널에서 가이드를 따라 하려면:

```bash
cd /home/user/webapp
./setup-d1-binding.sh
```

이 스크립트는:
- D1 바인딩 설정 방법 안내
- API 테스트 자동 실행
- 문제 진단 및 해결 방법 제공

---

## 📌 중요 안내

### 🔴 가장 중요한 것

**D1 바인딩 설정은 Cloudflare Dashboard에서만 가능합니다!**

코드나 설정 파일(`wrangler.toml`)로는 바인딩을 자동으로 추가할 수 없습니다. 반드시 수동으로 Dashboard에서 설정해야 합니다.

### 🟢 Step 1 완료 후 자동으로 해결됨

Step 1의 D1 바인딩 설정만 완료하면:
- ✅ API가 정상 작동
- ✅ 로그인/회원가입 가능
- ✅ 대시보드 접근 가능

---

## 🎉 완료!

모든 단계를 완료하면 로그인이 정상 작동합니다!

문제가 계속되면:
1. `D1_SETUP_GUIDE.md` 파일 참고
2. 또는 `./setup-d1-binding.sh` 스크립트 실행
3. API 테스트로 정확한 에러 메시지 확인

---

**최종 업데이트**: 2026-02-03  
**커밋**: 6a5bcf1  
**브랜치**: genspark_ai_developer
