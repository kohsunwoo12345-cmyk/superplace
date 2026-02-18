# 🔍 템플릿 API 디버깅 로그 분석 가이드

## 📌 현재 상황

브라우저 Console에서 다음 에러가 발생하고 있습니다:

```
/api/landing/templates:1 Failed to load resource: the server responded with a status of 500 ()
템플릿 목록 조회 응답: Object
템플릿 목록 조회 실패: Object

/api/landing/templates:1 Failed to load resource: the server responded with a status of 401 ()
템플릿 저장 응답: Object
저장 실패 상세: Object
```

**문제:**
- **GET 요청**: 500 에러 (서버 내부 오류)
- **POST 요청**: 401 에러 (인증 실패)

## 🎯 상세 로깅 추가 완료

최신 코드 (`9dbe536`)에 다음 로깅이 추가되었습니다:

### GET /api/landing/templates
```typescript
console.log('GET /api/landing/templates - Auth header:', authHeader ? 'Present' : 'Missing');
console.log('GET - Attempting to fetch templates from DB...');
console.log('GET - DB query result:', templatesResult);
console.log('GET - Successfully parsed templates:', templates.length);
// 에러 시
console.error('GET - Failed to fetch templates:', error);
console.error('GET - Error details:', { message, stack, name });
```

### POST /api/landing/templates
```typescript
console.log('POST /api/landing/templates - Auth header:', authHeader ? 'Present' : 'Missing');
console.log('POST - Attempting to decode token...');
console.log('POST - User from token:', user);
console.log('POST - Request body:', { name, descriptionLength, htmlLength });
// 에러 시
console.error('POST - Invalid token: user or userId is null');
console.error('POST - Failed to create template:', error);
console.error('POST - Error details:', { message, stack, name });
```

## 📋 Cloudflare Functions 로그 확인 방법

### 1단계: Cloudflare 대시보드 접속
```
https://dash.cloudflare.com
```

### 2단계: Pages 프로젝트 선택
```
왼쪽 메뉴 → Workers & Pages
→ superplacestudy 클릭
```

### 3단계: Functions 로그 확인
```
상단 탭 → Functions
→ Real-time Logs 또는 Analytics
```

### 4단계: 로그 필터링
```
- 시간 범위: 최근 1시간
- 필터: "templates" 검색
- 정렬: 최신순
```

## 🔍 예상되는 로그 패턴

### 시나리오 1: GET 500 에러 - DB 쿼리 실패

**예상 로그:**
```
GET /api/landing/templates - Auth header: Present
GET - Attempting to fetch templates from DB...
GET - Failed to fetch templates: Error: no such table: LandingPageTemplate
GET - Error details: {
  message: "no such table: LandingPageTemplate",
  name: "SQLiteError",
  stack: "..."
}
```

**원인:** `LandingPageTemplate` 테이블이 존재하지 않음

**해결 방법:**
1. Cloudflare D1 데이터베이스에 테이블 생성 필요
2. 스키마 파일 실행: `cloudflare-worker/schema.sql`

### 시나리오 2: GET 500 에러 - JSON 파싱 실패

**예상 로그:**
```
GET /api/landing/templates - Auth header: Present
GET - Attempting to fetch templates from DB...
GET - DB query result: { success: true, results: [...] }
GET - Failed to fetch templates: Error: Unexpected token in JSON at position 0
GET - Error details: {
  message: "Unexpected token in JSON at position 0",
  name: "SyntaxError",
  stack: "..."
}
```

**원인:** `variables` 필드가 잘못된 JSON 형식

**해결 방법:**
```sql
-- D1 Console에서 실행
UPDATE LandingPageTemplate SET variables = '[]' WHERE variables IS NULL OR variables = '';
```

### 시나리오 3: POST 401 에러 - 토큰 디코딩 실패

**예상 로그:**
```
POST /api/landing/templates - Auth header: Present
POST - Attempting to decode token...
POST - User from token: null
POST - Invalid token: user or userId is null
```

**원인:** `getUserFromAuth()`가 `null` 반환

**해결 방법:**
- `functions/_lib/auth.ts`의 `decodeToken()` 로직 확인
- 토큰 형식 검증 필요

### 시나리오 4: POST 401 에러 - userId 필드 없음

**예상 로그:**
```
POST /api/landing/templates - Auth header: Present
POST - Attempting to decode token...
POST - User from token: {
  id: "1",
  email: "admin@superplace.com",
  role: "SUPER_ADMIN"
}
POST - Invalid token: user or userId is null
```

**원인:** 토큰 파싱은 성공했지만 `userId` 필드가 없음 (대신 `id` 필드 사용)

**해결 방법:**
```typescript
// functions/_lib/auth.ts 수정
return {
  userId: userId || id,  // id를 userId로 매핑
  email,
  role,
  timestamp
};
```

### 시나리오 5: POST 500 에러 - DB INSERT 실패

**예상 로그:**
```
POST /api/landing/templates - Auth header: Present
POST - Attempting to decode token...
POST - User from token: { userId: "1", email: "...", role: "..." }
POST - Request body: { name: "테스트 템플릿", htmlLength: 1234 }
Creating template with userId: 1
Database insert failed: { success: false, error: "FOREIGN KEY constraint failed" }
POST - Failed to create template: Error: Database insert failed
```

**원인:** User 테이블에 `userId = "1"`인 사용자가 없음

**해결 방법:**
```sql
-- D1 Console에서 실행
SELECT id FROM User WHERE id = '1';
-- 없으면 테스트 사용자 생성
INSERT INTO User (id, email, name, role, password) 
VALUES ('1', 'admin@superplace.com', '관리자', 'SUPER_ADMIN', 'hashed_password');
```

## 🧪 디버깅 절차

### 1. 브라우저 Console에서 Object 확장

**현재 보이는 로그:**
```
템플릿 목록 조회 응답: Object
```

**클릭해서 확장:**
```javascript
{
  success: false,
  error: "Failed to fetch templates",
  message: "no such table: LandingPageTemplate",
  details: "Error: no such table: LandingPageTemplate",
  stack: "..."
}
```

### 2. Cloudflare Functions 로그 확인

```bash
# 로그 확인 절차
1. https://dash.cloudflare.com 접속
2. Workers & Pages → superplacestudy
3. Functions → Real-time Logs
4. 템플릿 저장 다시 시도
5. 실시간으로 로그 확인
```

### 3. 로그 분석

**찾아야 할 정보:**
- GET 요청: DB 쿼리가 실행되었는가?
- GET 요청: 어떤 에러가 발생했는가?
- POST 요청: 토큰이 디코딩되었는가?
- POST 요청: user 객체에 userId가 있는가?
- POST 요청: DB INSERT가 시도되었는가?

### 4. 문제 확인

**체크리스트:**
- [ ] `LandingPageTemplate` 테이블 존재 여부
- [ ] `User` 테이블에 사용자 데이터 존재 여부
- [ ] 토큰 디코딩 성공 여부
- [ ] `userId` 필드명 일치 여부
- [ ] FOREIGN KEY 제약 조건 만족 여부

## 📊 다음 단계

### 배포 완료 후 (5-10분)

1. **로그인:**
   ```
   https://superplacestudy.pages.dev/login
   이메일: admin@superplace.com
   비밀번호: admin1234
   ```

2. **템플릿 페이지 접속:**
   ```
   https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
   ```

3. **F12 개발자 도구 열기**

4. **Console 탭에서 Object 확장:**
   ```
   템플릿 목록 조회 응답: Object ← 여기 클릭
   ```

5. **에러 메시지 확인:**
   ```json
   {
     "success": false,
     "error": "...",
     "message": "...",
     "details": "...",
     "stack": "..."
   }
   ```

6. **Cloudflare Functions 로그 확인:**
   ```
   https://dash.cloudflare.com
   → Workers & Pages
   → superplacestudy
   → Functions
   → Real-time Logs
   ```

7. **로그 내용 공유:**
   - GET 요청의 로그 전체
   - POST 요청의 로그 전체
   - 특히 에러 메시지와 stack trace

## 🎯 예상 문제와 해결 방법

### 문제 A: LandingPageTemplate 테이블 없음

**증상:**
```
GET - Error: no such table: LandingPageTemplate
```

**해결:**
```sql
-- Cloudflare D1 Console에서 실행
CREATE TABLE IF NOT EXISTS LandingPageTemplate (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html TEXT NOT NULL,
  variables TEXT,
  isDefault INTEGER DEFAULT 0,
  usageCount INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

### 문제 B: userId 필드명 불일치

**증상:**
```
POST - User from token: { id: "1", email: "...", role: "..." }
POST - Invalid token: user or userId is null
```

**해결:**
```typescript
// functions/_lib/auth.ts의 decodeToken() 수정
if (parts.length === 4) {
  const [id, email, role, timestamp] = parts;
  return {
    userId: id,  // id를 userId로 매핑
    id: id,      // 기존 호환성 유지
    email,
    role,
    timestamp: parseInt(timestamp)
  };
}
```

### 문제 C: User 테이블에 사용자 없음

**증상:**
```
Database insert failed: FOREIGN KEY constraint failed
```

**해결:**
```sql
-- D1 Console에서 실행
SELECT * FROM User WHERE id = '1';
-- 결과가 없으면
INSERT INTO User (id, email, name, role, password, createdAt, updatedAt)
VALUES ('1', 'admin@superplace.com', '관리자', 'SUPER_ADMIN', 'password', datetime('now'), datetime('now'));
```

## 📝 보고 형식

다음 정보를 공유해주세요:

```
1. 브라우저 Console의 에러 Object 확장 내용:
{
  success: ...,
  error: "...",
  message: "...",
  ...
}

2. Cloudflare Functions 로그:
GET /api/landing/templates - Auth header: ...
GET - Attempting to fetch templates from DB...
GET - Failed to fetch templates: Error: ...
...

3. 추가 정보:
- 로그인 사용자: admin@superplace.com
- 토큰 형식: 4개 파트 (1.admin@...SUPER_ADMIN.17098...)
- 브라우저: Chrome/Firefox/Safari
```

## 🚀 배포 정보

- **커밋**: `9dbe536` - "fix: 템플릿 API에 상세 로깅 추가"
- **푸시 완료**: 방금 전
- **배포 소요 시간**: 5-10분
- **테스트 가능 시간**: [현재 시각 + 10분] 이후
- **라이브 URL**: https://superplacestudy.pages.dev

---

**다음 단계**: 배포 완료 후 위의 절차를 따라 로그를 확인하고 공유해주세요!
