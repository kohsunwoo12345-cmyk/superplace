# 교사/반/학생 추가 기능 문제 진단 보고서

**날짜**: 2026-03-19  
**테스트 URL**: https://suplacestudy.pages.dev/  
**상태**: 🔴 **모든 추가 기능 실패**

---

## 📋 요약

사용자가 웹 UI에서 교사, 반, 학생을 추가하려고 할 때 **모두 실패**합니다.

### 공통 원인
1. **인증 문제**: 테스트 계정이 DB에 없음
2. **권한 문제**: academyId가 올바르게 전달되지 않음
3. **구독 문제**: 학생 추가 시 활성 구독 필요

---

## 🔴 1. 교사 추가 실패

### 📍 위치
- **페이지**: `/dashboard/teachers` → "선생님 추가" 버튼
- **API**: `POST /api/teachers/add`
- **파일**: `functions/api/teachers/add.js`

### ❌ 오류 내용
```json
{
  "success": false,
  "error": "User not found",
  "message": "사용자를 찾을 수 없습니다"
}
```

### 🔍 원인 분석

#### 코드 로직 (add.js 86-98번 줄):
```javascript
// Get user from database - try by id first, then email
let user = await db
  .prepare('SELECT id, email, role, academyId FROM User WHERE id = ?')
  .bind(tokenData.id)
  .first();

if (!user && tokenData.email) {
  console.log('⚠️ User not found by id, trying email:', tokenData.email);
  user = await db
    .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
    .bind(tokenData.email)
    .first();
}
```

#### 문제점:
1. **토큰의 userId가 DB에 존재하지 않음**
2. localStorage의 토큰이 가짜/임시 데이터일 가능성
3. 실제 로그인하지 않고 localStorage에 임의의 user 객체를 설정한 경우

### ✅ 해결 방법

**옵션 1**: 토큰 검증 강화
```javascript
// Add this check before the user lookup
if (!tokenData || !tokenData.id) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Invalid token',
    message: '유효하지 않은 인증 토큰입니다. 다시 로그인해주세요.'
  }), { status: 401 });
}
```

**옵션 2**: 사용자가 없을 경우 명확한 안내
```javascript
if (!user) {
  return new Response(JSON.stringify({
    success: false,
    error: 'User not found',
    message: '사용자를 찾을 수 없습니다. 다시 로그인해주세요.',
    redirectTo: '/login'
  }), { status: 404 });
}
```

**옵션 3**: 권한 확인 완화 (개발 환경)
```javascript
// For development: allow demo/test users
if (!user && process.env.NODE_ENV === 'development') {
  console.log('⚠️ Development mode: Using token data as user');
  user = {
    id: tokenData.id,
    email: tokenData.email,
    role: tokenData.role,
    academyId: tokenData.academyId
  };
}
```

### 🧪 테스트 방법
```bash
# 1. 실제 사용자로 로그인
curl -X POST "https://suplacestudy.com/api/director/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "real@example.com", "password": "password123"}'

# 2. 받은 토큰으로 교사 추가
curl -X POST "https://suplacestudy.com/api/teachers/add" \
  -H "Authorization: Bearer <REAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트","phone":"010-1234-5678","password":"test1234"}'
```

---

## 🔴 2. 반(클래스) 추가 실패

### 📍 위치
- **페이지**: `/dashboard/classes` → "클래스 추가" 버튼
- **Add 페이지**: `/dashboard/classes/add/`
- **API**: `POST /api/classes/create-new`
- **파일**: `functions/api/classes/create-new.ts`

### ❌ 오류 내용
```json
{
  "success": false,
  "error": "Failed to create class",
  "message": "D1_ERROR: NOT NULL constraint failed: Class.academyId: SQLITE_CONSTRAINT"
}
```

### 🔍 원인 분석

#### DB 스키마 요구사항:
```sql
CREATE TABLE Class (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  academyId TEXT NOT NULL,  -- ❗ NOT NULL 제약 조건
  ...
);
```

#### 문제점:
1. **academyId가 null로 전달됨**
2. 토큰에서 academyId를 추출하지 못함
3. 프론트엔드에서 academyId를 명시적으로 전송하지 않음

### ✅ 해결 방법

#### API 수정 (create-new.ts):
```typescript
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  // Parse token
  const authHeader = request.headers.get('Authorization');
  const tokenData = parseToken(authHeader);
  
  if (!tokenData || !tokenData.academyId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing academy ID',
      message: '학원 정보를 찾을 수 없습니다. 다시 로그인해주세요.'
    }), { status: 400 });
  }
  
  const { name, grade, description, color, schedules, studentIds } = await request.json();
  
  // Use academyId from token
  const academyId = tokenData.academyId;
  
  // Insert with academyId
  await env.DB.prepare(`
    INSERT INTO Class (id, name, grade, description, color, academyId, isActive, capacity, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 1, 50, datetime('now'))
  `).bind(classId, name, grade, description, color, academyId).run();
  
  ...
};
```

### 🧪 테스트 방법
```bash
curl -X POST "https://suplacestudy.com/api/classes/create-new" \
  -H "Authorization: Bearer <TOKEN_WITH_ACADEMYID>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 반",
    "grade": "중1",
    "description": "테스트",
    "color": "#3B82F6",
    "schedules": [],
    "studentIds": []
  }'
```

---

## 🔴 3. 학생 추가 실패

### 📍 위치
- **페이지**: `/dashboard/students` → "학생 추가" 버튼
- **Add 페이지**: `/dashboard/students/add/`
- **API**: `POST /api/students/create`
- **파일**: `functions/api/students/create.js`

### ❌ 오류 내용

#### 오류 1: 구독 필요
```json
{
  "success": false,
  "error": "NO_SUBSCRIPTION",
  "message": "활성화된 구독이 없습니다. 요금제를 선택해주세요.",
  "redirectTo": "/pricing",
  "logs": [
    "✅ DB 연결 확인",
    "✅ 토큰에서 userId: director-test-123, academyId: academy-test-456",
    "🔒 구독 확인 중...",
    "❌ 활성화된 구독이 없습니다"
  ]
}
```

#### 오류 2: 이메일 중복 (direct-add 사용 시)
```json
{
  "success": false,
  "error": "User 테이블 삽입 실패",
  "message": "D1_ERROR: UNIQUE constraint failed: User.email: SQLITE_CONSTRAINT"
}
```

### 🔍 원인 분석

#### 코드 로직 (create.js):
```javascript
// 🔒 구독 확인 (필수)
console.log('🔒 구독 확인 중...');
const subscription = await db.prepare(`
  SELECT * FROM subscriptions 
  WHERE userId = ? 
  AND status = 'active' 
  AND endDate > datetime('now')
`).bind(userId).first();

if (!subscription) {
  console.log('❌ 활성화된 구독이 없습니다');
  return Response.json({
    success: false,
    error: 'NO_SUBSCRIPTION',
    message: '활성화된 구독이 없습니다. 요금제를 선택해주세요.',
    redirectTo: '/pricing',
    logs: logs
  }, { status: 403 });
}
```

#### 문제점:
1. **구독 시스템 강제**: 학생 추가를 위해 활성 구독이 필요
2. **테스트 불가**: 구독 없이는 학생 추가 테스트 불가능
3. **이메일 중복**: 임시 이메일 생성 시 이미 존재하는 이메일과 충돌

### ✅ 해결 방법

#### 옵션 1: 구독 확인 스킵 모드 추가
```javascript
// Add environment variable or config to skip subscription check
const SKIP_SUBSCRIPTION_CHECK = env.SKIP_SUBSCRIPTION_CHECK === 'true';

if (!SKIP_SUBSCRIPTION_CHECK) {
  const subscription = await db.prepare(`
    SELECT * FROM subscriptions 
    WHERE userId = ? AND status = 'active' AND endDate > datetime('now')
  `).bind(userId).first();

  if (!subscription) {
    return Response.json({
      success: false,
      error: 'NO_SUBSCRIPTION',
      message: '활성화된 구독이 없습니다. 요금제를 선택해주세요.',
      redirectTo: '/pricing'
    }, { status: 403 });
  }
}
```

#### 옵션 2: 무료 티어 제공
```javascript
// Allow up to 5 students without subscription
const studentCount = await db.prepare(`
  SELECT COUNT(*) as count FROM User 
  WHERE academyId = ? AND role = 'STUDENT'
`).bind(academyId).first();

if (!subscription && studentCount.count >= 5) {
  return Response.json({
    success: false,
    error: 'FREE_TIER_LIMIT',
    message: '무료 티어는 최대 5명까지 학생을 추가할 수 있습니다. 요금제를 선택해주세요.',
    redirectTo: '/pricing'
  }, { status: 403 });
}
```

#### 옵션 3: 이메일 중복 처리 개선
```javascript
// Generate unique email with retry
let emailAttempt = 0;
let studentEmail = `student_${phone}@temp.superplace.local`;

while (emailAttempt < 10) {
  const existing = await db.prepare(`
    SELECT id FROM User WHERE email = ?
  `).bind(studentEmail).first();
  
  if (!existing) break;
  
  emailAttempt++;
  studentEmail = `student_${phone}_${emailAttempt}@temp.superplace.local`;
}

if (emailAttempt >= 10) {
  return Response.json({
    success: false,
    error: 'EMAIL_GENERATION_FAILED',
    message: '고유한 이메일을 생성할 수 없습니다. 다른 전화번호를 사용해주세요.'
  }, { status: 500 });
}
```

### 🧪 테스트 방법

#### 1. 구독 생성 후 테스트
```bash
# First, create a subscription
curl -X POST "https://suplacestudy.com/api/subscriptions/create" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "basic",
    "duration": 12
  }'

# Then, add student
curl -X POST "https://suplacestudy.com/api/students/create" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 학생",
    "phone": "010-9999-8888",
    "password": "test1234",
    "grade": "중1"
  }'
```

#### 2. direct-add 사용 (구독 불필요)
```bash
curl -X POST "https://suplacestudy.com/api/students/direct-add" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 학생",
    "phone": "010-7777-6666",
    "academyId": "academy-123"
  }'
```

---

## 📊 현재 상태 요약

| 기능 | URL | API | 상태 | 주요 문제 |
|------|-----|-----|------|----------|
| 교사 추가 | `/dashboard/teachers` | `POST /api/teachers/add` | 🔴 실패 | User not found (토큰 검증 실패) |
| 반 추가 | `/dashboard/classes/add` | `POST /api/classes/create-new` | 🔴 실패 | academyId NOT NULL 제약 위반 |
| 학생 추가 | `/dashboard/students/add` | `POST /api/students/create` | 🔴 실패 | 활성 구독 필요 |

---

## 🛠️ 권장 수정 사항

### 우선순위 1 (필수)
1. ✅ **반 추가 API 수정**: academyId를 토큰에서 자동 추출
2. ✅ **교사 추가 API 수정**: 사용자 검증 개선 및 명확한 에러 메시지
3. ✅ **학생 추가 구독 확인**: 무료 티어 또는 스킵 모드 추가

### 우선순위 2 (개선)
4. ⚠️ **프론트엔드 에러 처리**: API 오류 시 사용자 친화적인 메시지 표시
5. ⚠️ **이메일 중복 처리**: 고유한 임시 이메일 생성 로직 개선
6. ⚠️ **토큰 갱신**: 만료된 토큰 자동 갱신 또는 재로그인 유도

### 우선순위 3 (장기)
7. 📝 **구독 시스템 개선**: 무료 체험 기간 제공
8. 📝 **권한 관리 강화**: 역할별 세분화된 권한 설정
9. 📝 **로깅 강화**: 모든 추가 작업 기록 및 audit trail

---

## 🧪 테스트 체크리스트

사용자가 직접 확인해야 할 항목:

### 1. 로그인 상태 확인
- [ ] 실제로 로그인했는가? (localStorage에 임의 설정하지 않았는가?)
- [ ] 토큰이 유효한가? (만료되지 않았는가?)
- [ ] academyId가 토큰에 포함되어 있는가?

### 2. 교사 추가 테스트
- [ ] 페이지 이동: `/dashboard/teachers`
- [ ] "선생님 추가" 버튼 클릭
- [ ] 이름, 전화번호, 비밀번호 입력
- [ ] 추가 버튼 클릭
- [ ] 브라우저 콘솔(F12) 확인 → 오류 메시지 확인

### 3. 반 추가 테스트
- [ ] 페이지 이동: `/dashboard/classes`
- [ ] "클래스 추가" 버튼 클릭
- [ ] 반 이름, 학년 입력
- [ ] 추가 버튼 클릭
- [ ] 브라우저 콘솔(F12) 확인 → 오류 메시지 확인

### 4. 학생 추가 테스트
- [ ] 페이지 이동: `/dashboard/students`
- [ ] "학생 추가" 버튼 클릭
- [ ] 이름, 전화번호, 비밀번호 입력
- [ ] 추가 버튼 클릭
- [ ] 구독 오류가 발생하는가?
- [ ] 브라우저 콘솔(F12) 확인 → 오류 메시지 확인

---

## 💡 즉시 사용 가능한 대안

구독 없이 학생을 추가하려면 **direct-add API**를 사용하세요:

```bash
curl -X POST "https://suplacestudy.com/api/students/direct-add" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "학생 이름",
    "phone": "010-1234-5678",
    "academyId": "your-academy-id"
  }'
```

또는 프론트엔드에서:
```javascript
const response = await fetch('/api/students/direct-add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '학생 이름',
    phone: '010-1234-5678',
    academyId: user.academyId
  })
});
```

---

## 📞 다음 단계

1. **사용자 확인 필요**:
   - 실제로 로그인한 계정인지 확인
   - 구독이 있는 계정인지 확인
   - academyId가 설정되어 있는지 확인

2. **코드 수정 필요**:
   - 반 추가 API: academyId 자동 추출 추가
   - 교사 추가 API: 에러 메시지 개선
   - 학생 추가 API: 구독 체크 완화 또는 무료 티어 제공

3. **테스트 재실행**:
   - 수정 후 실제 사용자 계정으로 테스트
   - 각 기능별 성공/실패 확인

---

**작성자**: Claude Code Agent  
**보고 날짜**: 2026-03-19  
**우선순위**: 🔴 긴급 (모든 추가 기능 불가)
