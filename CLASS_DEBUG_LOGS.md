# 클래스 디버깅 로그 추가 (2026-02-22)

## 🚀 배포 정보
- **커밋**: `800d584`
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 시간**: 약 2-3분 소요

## 🔍 추가된 디버깅 로그

### 1. 클래스 생성 API (`/api/classes/create`)

**로그 위치**: Cloudflare Workers 콘솔

**추가된 로그**:
```javascript
✅ Class created with ID: 123
📝 Inserted data: {
  academy_id: 1,
  class_name: "중1 수학반",
  grade: "중1",
  teacher_id: 10,
  color: "#3B82F6"
}
✅ Verification - Class in DB: {
  id: 123,
  academy_id: 1,
  class_name: "중1 수학반"
}
```

### 2. 클래스 조회 API (`/api/classes`)

**로그 위치**: Cloudflare Workers 콘솔

**추가된 로그**:
```javascript
📚 Classes API GET called
✅ User verified: {
  email: 'admin@school.com',
  role: 'ADMIN',
  academyId: 1,
  userId: 10,
  rawUser: { id: 10, email: 'admin@school.com', role: 'ADMIN', academyId: 1 }
}
🔒 Admin/Director access - academy filtered: 1
🔍 Executing query with params: [1]
✅ Returning 3 classes for ADMIN (academy: 1)
```

**클래스가 없을 때**:
```javascript
✅ Returning 0 classes for ADMIN (academy: 1)
⚠️ No classes found. Checking all classes in database...
📊 All classes in DB: [
  { id: 123, academy_id: 2, class_name: "다른 학원 반" },
  { id: 124, academy_id: 3, class_name: "또 다른 학원 반" }
]
```

### 3. 프론트엔드 (`/dashboard/classes`)

**로그 위치**: 브라우저 개발자 도구 콘솔

**추가된 로그**:
```javascript
📚 Loading classes...
👤 Current user: {
  id: "10",
  email: "admin@school.com",
  name: "홍학원장",
  role: "ADMIN",
  academyId: 1
}
📚 클래스 목록 로드 중...
📡 API Response status: 200
✅ 클래스 데이터: {
  success: true,
  classes: [...],
  count: 3
}
📊 클래스 개수: 3
```

## 📝 디버깅 절차

### Step 1: 클래스 생성 확인
1. 클래스 추가 페이지에서 클래스 생성
2. **Cloudflare Workers 콘솔 확인**:
   ```
   Cloudflare Dashboard → Workers & Pages → superplace → Logs
   ```
3. 다음 로그 확인:
   - `✅ Class created with ID: {숫자}`
   - `📝 Inserted data:` - academy_id 값 확인
   - `✅ Verification - Class in DB:` - 데이터베이스에 저장 확인

### Step 2: 사용자 정보 확인
1. `/dashboard/classes` 페이지 접속
2. **브라우저 콘솔** (F12) 확인
3. `👤 Current user:` 로그에서 확인:
   - `academyId` 또는 `academy_id` 값
   - `role` 값 (ADMIN, DIRECTOR 등)

### Step 3: API 응답 확인
1. **브라우저 콘솔**에서:
   - `📡 API Response status:` - 200이어야 함
   - `📊 클래스 개수:` - 0이면 문제 있음

2. **Cloudflare Workers 콘솔**에서:
   - `✅ User verified:` - academyId 값 확인
   - `🔍 Executing query with params:` - 필터링 파라미터 확인
   - `⚠️ No classes found. Checking all classes in database...` 
   - `📊 All classes in DB:` - 실제 DB의 클래스 확인

### Step 4: 문제 진단

#### 케이스 1: 클래스가 생성되지 않음
**증상**: 생성 로그가 없음
**확인**:
- `/api/classes/create` 호출 확인
- 에러 메시지 확인

#### 케이스 2: 클래스는 생성되었지만 보이지 않음
**증상**: 
- 생성 로그: `✅ Class created with ID: 123`
- 조회 로그: `✅ Returning 0 classes`
- DB 로그: `📊 All classes in DB: [...]` (데이터 있음)

**원인 분석**:
```javascript
// 생성된 클래스의 academy_id
📝 Inserted data: { academy_id: 10 }

// 사용자의 academyId
✅ User verified: { academyId: 1 }

// 결과: academy_id (10) != academyId (1) → 필터링으로 제외됨
```

**해결 방법**:
- 사용자의 실제 academyId 확인
- 클래스 생성 시 올바른 academyId 전달 확인

#### 케이스 3: 사용자에게 academyId가 없음
**증상**:
```javascript
✅ User verified: {
  email: 'admin@school.com',
  role: 'ADMIN',
  academyId: undefined  // ← 문제!
}
```

**원인**: User 테이블에 academyId 또는 academy_id 컬럼이 NULL

**해결 방법**:
1. User 테이블 업데이트 필요
2. 또는 사용자 ID를 academyId로 사용 (학원장인 경우)

## 🛠️ 문제 해결 가이드

### 문제: "클래스가 없습니다" 표시

#### 1단계: 브라우저 콘솔 확인
```
F12 → Console 탭

예상 로그:
📚 Loading classes...
👤 Current user: { ... }
📊 클래스 개수: 0  ← 문제!
```

#### 2단계: Cloudflare 로그 확인
```
Cloudflare Dashboard → Workers → superplace → Logs

예상 로그:
✅ User verified: { academyId: ?? }
🔍 Executing query with params: [??]
📊 All classes in DB: [...]
```

#### 3단계: academy_id 매칭 확인
```javascript
// 사용자의 academyId
👤 Current user: { academyId: 1 }

// 쿼리 파라미터
🔍 Executing query with params: [1]

// DB의 실제 클래스
📊 All classes in DB: [
  { id: 123, academy_id: 1, class_name: "찾아야 할 반" }
]

// 결과
✅ Returning 1 classes  ← 성공!
```

**만약 매칭 안됨**:
```javascript
👤 Current user: { academyId: 10 }
📊 All classes in DB: [
  { id: 123, academy_id: 1, class_name: "다른 학원 반" }
]
✅ Returning 0 classes  ← 실패 (10 != 1)
```

### 문제: academyId가 undefined

#### 해결책 1: User 테이블 확인
```sql
-- Wrangler CLI
wrangler d1 execute DB --command "SELECT id, email, role, academyId FROM User WHERE email='your@email.com'"

-- 또는
wrangler d1 execute DB --command "SELECT id, email, role, academy_id FROM users WHERE email='your@email.com'"
```

#### 해결책 2: 사용자 데이터 업데이트
```sql
-- User 테이블
UPDATE User SET academyId = 1 WHERE email = 'your@email.com';

-- 또는 users 테이블
UPDATE users SET academy_id = 1 WHERE email = 'your@email.com';
```

#### 해결책 3: 학원장의 경우 ID 사용
클래스 생성 시 사용자 ID를 academyId로 사용:
```javascript
const effectiveAcademyId = user?.academyId || user?.academy_id || user?.id;
```

## 📊 로그 분석 예시

### 정상 케이스
```
[생성]
📝 Creating class: { academyId: 1, name: "중1 수학반" }
✅ Class created with ID: 123
📝 Inserted data: { academy_id: 1 }
✅ Verification - Class in DB: { id: 123, academy_id: 1 }

[조회]
👤 Current user: { academyId: 1, role: "ADMIN" }
🔍 Executing query with params: [1]
✅ Returning 1 classes for ADMIN (academy: 1)

[프론트]
📊 클래스 개수: 1
```

### 문제 케이스 (academyId 불일치)
```
[생성]
📝 Creating class: { academyId: 10, name: "중1 수학반" }
✅ Class created with ID: 123
📝 Inserted data: { academy_id: 10 }  ← 문제!

[조회]
👤 Current user: { academyId: 1, role: "ADMIN" }  ← 불일치!
🔍 Executing query with params: [1]
✅ Returning 0 classes for ADMIN (academy: 1)
⚠️ No classes found. Checking all classes in database...
📊 All classes in DB: [{ id: 123, academy_id: 10 }]  ← academy_id가 다름!

[프론트]
📊 클래스 개수: 0
```

## 🔧 다음 단계

### 배포 후 확인 사항
1. ✅ Cloudflare Workers 콘솔 접속
2. ✅ 클래스 생성 시도
3. ✅ 로그에서 `academy_id` 값 확인
4. ✅ 클래스 목록 페이지 접속
5. ✅ 브라우저 콘솔에서 `academyId` 값 확인
6. ✅ 두 값이 일치하는지 확인

### 문제 보고 시 포함할 정보
```
1. 브라우저 콘솔 스크린샷
   - 👤 Current user 로그
   - 📊 클래스 개수 로그

2. Cloudflare Workers 로그 스크린샷
   - ✅ User verified 로그
   - 📊 All classes in DB 로그

3. 사용자 정보
   - 이메일
   - 역할 (ADMIN/DIRECTOR)
```

---

**업데이트 일시**: 2026-02-22
**커밋 해시**: 800d584
**배포 상태**: ✅ 완료 (2-3분 후 반영)
**목적**: 클래스 생성 후 표시 안되는 문제 원인 파악
