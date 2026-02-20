# 🚨 학생 추가 및 목록 조회 문제 진단 가이드

## 현재 상황
- **문제 1**: 학생 추가가 안 됨
- **문제 2**: 학생 목록이 0명으로 표시됨
- **시간**: 2026-02-20

## ✅ 확인된 코드 상태

### 1. 로그인 API (`functions/api/auth/login.js`)
- ✅ 3가지 패턴 모두 시도하도록 수정됨:
  - 패턴 1: `users` + `academyId` (camelCase)
  - 패턴 2: `User` + `academyId` (대문자 시작)
  - 패턴 3: `users` + `academy_id` (snake_case)
- ✅ 토큰 생성: `userId|email|role|academyId|timestamp`

### 2. 학생 생성 API (`functions/api/students/create.ts`)
- ✅ 테이블: `users`, `students`
- ✅ 컬럼: `academyId`, `userId`, `createdAt`
- ✅ getUserFromAuth 사용
- ✅ 로그 출력 완비

### 3. 학생 목록 API (`functions/api/students/by-academy.ts`)
- ✅ 테이블: `users LEFT JOIN students`
- ✅ 컬럼: `academyId`, `userId`
- ✅ RBAC 적용 (DIRECTOR는 자기 학원만)
- ✅ 로그 출력 완비

### 4. 프론트엔드 (`src/app/dashboard/students/page.tsx`)
- ✅ 엔드포인트: `/api/students/by-academy`
- ✅ Authorization 헤더 전송
- ✅ 에러 로깅

## 🔍 진단 절차

### Step 1: 로그인 테스트
```javascript
// 1. https://superplacestudy.pages.dev/login 접속
// 2. 로그인 시도
// 3. 브라우저 콘솔(F12) 확인

// 예상 로그:
// 🔐 Login API called
// 🔍 시도 1: users 테이블 + academyId (camelCase)
// ✅ 패턴 1 성공 (users + academyId)
// ✅ Login successful

// 4. 토큰 확인
const token = localStorage.getItem('token');
console.log('Token:', token);
const parts = token.split('|');
console.log('Parts:', {
  userId: parts[0],
  email: parts[1],
  role: parts[2],
  academyId: parts[3],  // ⭐ 이 값이 있어야 함!
  timestamp: parts[4]
});

// ✅ 성공: academyId에 숫자 값이 있음
// ❌ 실패: academyId가 undefined 또는 빈 문자열
```

### Step 2: 학생 추가 테스트
```javascript
// 1. https://superplacestudy.pages.dev/dashboard/students/add/ 접속
// 2. 학생 정보 입력:
//    이름: 테스트학생001
//    이메일: test001@test.com
//    비밀번호: test1234
//    전화번호: 010-1111-2222
//    학년: 1

// 3. "학생 추가" 버튼 클릭

// 4. 브라우저 네트워크 탭(F12 > Network) 확인
// POST /api/students/create
// Request Headers:
//   Authorization: Bearer [token]
// Request Payload:
//   { name, email, phone, password, ... }

// 5. 응답 확인
// ✅ 성공 응답:
{
  success: true,
  message: "학생이 추가되었습니다",
  studentId: "..."
}

// ❌ 실패 응답:
{
  success: false,
  error: "...",
  message: "..."
}
```

### Step 3: 학생 목록 테스트
```javascript
// 1. https://superplacestudy.pages.dev/dashboard/students/ 접속

// 2. 브라우저 콘솔 확인
// 예상 로그:
// ✅ Loaded students: 1

// 3. 네트워크 탭 확인
// GET /api/students/by-academy
// Request Headers:
//   Authorization: Bearer [token]
// Response:
{
  success: true,
  students: [
    {
      id: "...",
      name: "테스트학생001",
      email: "test001@test.com",
      studentCode: "...",
      grade: "1",
      academyId: "...",
      status: "ACTIVE"
    }
  ]
}
```

## 🐛 예상 문제 및 해결

### 문제 1: "인증이 필요합니다" / "Unauthorized"
**원인**: 토큰이 없거나 만료됨

**해결**:
```javascript
// 브라우저 콘솔에서 실행
localStorage.clear();
location.reload();
// 그리고 재로그인
```

### 문제 2: "학원 정보가 없습니다" / "Academy ID not found"
**원인**: 토큰에 academyId가 없음

**해결**:
1. 로그아웃
2. 재로그인 (새로운 토큰 생성)
3. 토큰 확인:
```javascript
const token = localStorage.getItem('token');
const parts = token.split('|');
console.log('academyId:', parts[3]);
// undefined가 아니어야 함
```

### 문제 3: "학생 추가 중 오류가 발생했습니다"
**원인**: DB 스키마 불일치 또는 권한 문제

**해결**:
1. Cloudflare Dashboard → Pages → superplacestudy → Functions 로그 확인
2. 에러 메시지 확인:
   - `no such table: users` → 테이블명 불일치
   - `no such column: academyId` → 컬럼명 불일치
   - `FOREIGN KEY constraint failed` → FK 문제

### 문제 4: 학생 목록이 0명
**원인 1**: 실제로 학생이 없음
**해결**: Step 2의 학생 추가를 먼저 수행

**원인 2**: academyId 불일치
**해결**: Cloudflare Functions 로그 확인
```
// 로그 예시:
👥 by-academy API - Authenticated user: { role: 'DIRECTOR', academyId: '5' }
📊 Query: SELECT ... WHERE u.role = 'STUDENT' AND u.academyId = ? ['5']
🔍 Result count: 0  // ← 이 값이 0이면 DB에 실제로 없음
```

**원인 3**: DB에 학생이 있지만 academyId가 다름
**해결**: Cloudflare D1 콘솔에서 직접 확인
```sql
-- 1. users 테이블에 학생이 있는지 확인
SELECT id, name, email, role, academyId
FROM users
WHERE role = 'STUDENT'
ORDER BY createdAt DESC
LIMIT 10;

-- 2. students 테이블 확인
SELECT s.id, s.userId, s.academyId, s.grade, u.name, u.email
FROM students s
JOIN users u ON s.userId = u.id
ORDER BY s.createdAt DESC
LIMIT 10;

-- 3. 특정 학원의 학생 확인
SELECT u.id, u.name, u.email, u.academyId, s.grade
FROM users u
LEFT JOIN students s ON u.id = s.userId
WHERE u.role = 'STUDENT' AND u.academyId = 'YOUR_ACADEMY_ID'
ORDER BY u.name ASC;
```

## 🔧 Cloudflare Functions 로그 확인 방법

1. **Cloudflare Dashboard 접속**
   ```
   https://dash.cloudflare.com/
   ```

2. **Pages 프로젝트 선택**
   ```
   Pages → superplacestudy
   ```

3. **Functions 로그 확인**
   ```
   왼쪽 메뉴 → Functions → View logs
   또는
   Deployments → 최신 배포 클릭 → View logs
   ```

4. **실시간 로그 확인**
   - 로그인 시도 → 로그에서 "🔐 Login API called" 검색
   - 학생 추가 시도 → "📝 Create student API called" 검색
   - 학생 목록 조회 → "👥 by-academy API" 검색

5. **중요한 로그 라인**
   ```
   [로그인]
   ✅ 패턴 X 성공 (users + academyId)
   ✅ Login successful: { userId: ..., role: ..., academyId: ... }
   
   [학생 생성]
   👤 Authenticated user: { userId, role, academyId }
   💾 Creating student...
   ✅ User account created with ID: ...
   ✅ Student record created for userId: ...
   
   [학생 목록]
   👥 by-academy API - Authenticated user: { role, academyId }
   🔍 Result count: X
   ✅ Students found: X
   ```

## 📊 데이터베이스 스키마 (실제 사용 중)

```sql
-- users 테이블
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,         -- 'STUDENT', 'TEACHER', 'DIRECTOR', etc
  phone TEXT,
  academyId TEXT,             -- ⭐ camelCase
  isActive INTEGER DEFAULT 1,
  lastLoginAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

-- students 테이블
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,       -- ⭐ users.id 참조
  academyId TEXT NOT NULL,    -- ⭐ academy.id 참조
  grade TEXT,
  parentPhone TEXT,
  parentEmail TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);
```

## ⚡ 빠른 테스트 스크립트

브라우저 콘솔에서 실행:

```javascript
// 1. 현재 인증 상태 확인
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token) {
    console.error('❌ 토큰 없음');
    return false;
  }
  
  const parts = token.split('|');
  const authInfo = {
    userId: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3],
    timestamp: parts[4],
    tokenAge: Date.now() - parseInt(parts[4])
  };
  
  console.log('✅ 인증 정보:', authInfo);
  
  if (!authInfo.academyId) {
    console.error('❌ academyId 없음 → 재로그인 필요');
    return false;
  }
  
  if (authInfo.tokenAge > 24 * 60 * 60 * 1000) {
    console.warn('⚠️ 토큰 만료 (24시간 초과)');
    return false;
  }
  
  console.log('✅ 인증 상태 정상');
  return true;
}

// 2. 학생 목록 조회 테스트
async function testStudentList() {
  if (!checkAuth()) return;
  
  const token = localStorage.getItem('token');
  
  console.log('📡 학생 목록 조회 중...');
  const response = await fetch('/api/students/by-academy', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('📊 응답 상태:', response.status);
  const data = await response.json();
  console.log('📊 응답 데이터:', data);
  
  if (data.success) {
    console.log(`✅ 학생 ${data.students.length}명 조회됨`);
    data.students.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.name} (${s.email}) - 학년: ${s.grade || 'N/A'}`);
    });
  } else {
    console.error('❌ 조회 실패:', data.message || data.error);
  }
}

// 실행
checkAuth();
testStudentList();
```

## 🎯 해결 체크리스트

### 로그인
- [ ] 로그인 성공
- [ ] 토큰에 academyId 포함
- [ ] 토큰 만료되지 않음

### 학생 추가
- [ ] 학생 추가 API 호출 성공
- [ ] users 테이블에 INSERT 성공
- [ ] students 테이블에 INSERT 성공
- [ ] "학생이 추가되었습니다" 메시지 표시

### 학생 목록
- [ ] 학생 목록 API 호출 성공
- [ ] 응답에 students 배열 포함
- [ ] 추가한 학생이 목록에 표시됨
- [ ] 학생 정보 (이름, 이메일, 학년) 정확함

---

**작성일**: 2026-02-20  
**상태**: 진단 대기 중  
**다음 단계**: 위 진단 절차대로 실행 후 결과 보고
