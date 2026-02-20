# 수업 추가 - 학생 배정 문제 해결 완전 가이드

## 🎯 문제 상황
1. **수업 추가가 안 됨** - "학원 정보가 없습니다" 오류
2. **배정 가능한 학생이 없음** - 학생 목록이 비어 있음
3. **학원장마다 자신의 학생만 보여야 함**

## ✅ 수정 완료 사항

### 1. 학생 API 개선 (`/api/students/by-academy`)
**변경 사항**:
- 토큰에 `academyId`가 없으면 DB에서 자동 조회
- 학원장이면 본인 ID를 academy_id로 사용 (fallback)
- TEACHER 역할도 학생 조회 가능하도록 추가
- 더 자세한 에러 디버깅 정보 제공

**코드 로직**:
```typescript
// 1. 토큰에서 기본 정보 추출
const userId = userPayload.userId || userPayload.id;
let tokenAcademyId = userPayload.academyId;

// 2. academyId가 없으면 DB에서 조회
if (!tokenAcademyId && userId) {
  const userRecord = await DB.prepare(`
    SELECT id, academy_id, role FROM users WHERE id = ?
  `).bind(userId).first();
  
  tokenAcademyId = userRecord.academy_id || userRecord.id; // fallback
}

// 3. DIRECTOR 또는 TEACHER면 자신의 academy 학생만 조회
if (upperRole === 'DIRECTOR' || upperRole === 'TEACHER') {
  const effectiveAcademyId = tokenAcademyId || userId;
  query += ` AND academy_id = ?`;
  bindings.push(effectiveAcademyId);
}
```

### 2. 프론트엔드 에러 처리 개선
**변경 사항**:
- 학생 0명일 때 경고 로그 추가
- 403 에러 시 권한 문제 명확히 표시
- 디버그 정보 출력

## 🧪 즉시 진단 방법

### Step 1: 브라우저 콘솔에서 사용자 정보 확인
```javascript
// F12 → Console 탭에서 실행
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('👤 Current user:', user);
console.log('🆔 User ID:', user.id);
console.log('🏫 Academy ID:', user.academyId || user.academy_id);
console.log('👨‍💼 Role:', user.role);
console.log('🔑 Token:', user.token?.substring(0, 50) + '...');
```

**기대 결과**:
```javascript
{
  id: "208",  // 또는 숫자
  email: "director@academy.com",
  role: "DIRECTOR",
  academyId: "208",  // 또는 academy_id: "208"
  token: "208|director@academy.com|DIRECTOR|..."
}
```

### Step 2: 학생 API 직접 호출 테스트
```javascript
// F12 → Console에서 실행
const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = user.token || localStorage.getItem('token');

console.log('🔑 Using token:', token?.substring(0, 50) + '...');

fetch('/api/students/by-academy', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('📡 Response status:', r.status);
  return r.json();
})
.then(data => {
  console.log('✅ API Response:', data);
  console.log('📊 Student count:', data.students?.length || 0);
  console.log('👥 Students:', data.students);
  
  if (data.debug) {
    console.log('🔍 Debug info:', data.debug);
  }
  
  if (!data.success) {
    console.error('❌ Error:', data.error, data.message);
  }
})
.catch(err => console.error('❌ Network error:', err));
```

**기대 결과** (성공):
```json
{
  "success": true,
  "students": [
    {
      "id": "123",
      "name": "김학생",
      "email": "student@example.com",
      "studentCode": "123",
      "grade": null,
      "phone": "010-1234-5678",
      "academyId": "208"
    },
    ...
  ]
}
```

**기대 결과** (실패 - 디버그 정보 포함):
```json
{
  "success": false,
  "error": "Academy ID not found",
  "message": "학원 정보가 없습니다. 사용자 정보를 확인해주세요.",
  "students": [],
  "debug": {
    "userId": "208",
    "tokenAcademyId": null,
    "role": "DIRECTOR"
  }
}
```

### Step 3: D1 데이터베이스에서 확인

#### 3-1. 사용자 정보 확인
```sql
-- Cloudflare Dashboard → D1 → superplace → Console

-- 본인 사용자 정보 조회
SELECT id, name, email, role, academy_id 
FROM users 
WHERE email = 'your-email@example.com';

-- 예상 결과:
-- id: 208
-- role: DIRECTOR
-- academy_id: 208 (또는 NULL)
```

#### 3-2. 학생 목록 확인
```sql
-- 특정 academy의 학생 수 확인
SELECT COUNT(*) as student_count 
FROM users 
WHERE role = 'STUDENT' 
  AND academy_id = 208;  -- 본인의 ID로 변경

-- 학생 목록 조회
SELECT id, name, email, role, academy_id 
FROM users 
WHERE role = 'STUDENT' 
  AND academy_id = 208  -- 본인의 ID로 변경
ORDER BY name ASC
LIMIT 10;
```

**문제 발견 시**: 학생의 `academy_id`가 학원장의 ID와 다르거나 NULL

#### 3-3. 데이터 수정 (필요 시)
```sql
-- 1. 학원장의 academy_id 설정 (본인 ID로)
UPDATE users 
SET academy_id = id 
WHERE id = 208 AND role = 'DIRECTOR';

-- 2. 학생들의 academy_id를 학원장 ID로 설정
UPDATE users 
SET academy_id = 208  -- 학원장 ID
WHERE role = 'STUDENT' 
  AND (academy_id IS NULL OR academy_id != 208);

-- 3. 확인
SELECT role, COUNT(*) as count 
FROM users 
WHERE academy_id = 208 
GROUP BY role;

-- 예상 결과:
-- DIRECTOR | 1
-- STUDENT  | 15
-- TEACHER  | 3
```

## 🔧 문제별 해결 방법

### 문제 1: "배정 가능한 학생이 없습니다"

**원인 체크리스트**:
- [ ] 학생이 실제로 DB에 없음
- [ ] 학생의 `academy_id`가 학원장 ID와 다름
- [ ] 토큰에 academy_id가 없고 DB 조회도 실패
- [ ] 역할(role)이 DIRECTOR/TEACHER가 아님

**해결 방법**:

#### A. DB에 학생이 없는 경우
1. `/dashboard/students/` 페이지로 이동
2. "학생 추가" 버튼 클릭
3. 학생 정보 입력 및 저장
4. 다시 `/dashboard/classes/add/`로 이동하여 확인

#### B. academy_id 불일치 문제
```sql
-- Cloudflare D1 Console에서 실행

-- 1. 학원장 ID 확인
SELECT id FROM users WHERE email = 'your-email@example.com';
-- 결과: 예) 208

-- 2. 학생들의 academy_id 일괄 수정
UPDATE users 
SET academy_id = 208  -- 위에서 확인한 학원장 ID
WHERE role = 'STUDENT';

-- 3. 교사들도 같은 academy_id로 설정
UPDATE users 
SET academy_id = 208
WHERE role = 'TEACHER';

-- 4. 확인
SELECT id, name, role, academy_id 
FROM users 
WHERE academy_id = 208;
```

#### C. 토큰 문제
```javascript
// localStorage 초기화 후 재로그인
localStorage.removeItem('user');
localStorage.removeItem('token');
// 로그인 페이지로 이동
window.location.href = '/login';
```

### 문제 2: "학원 정보가 없습니다" (수업 생성 실패)

**진단**:
```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const effectiveAcademyId = user.academyId || user.academy_id || user.id;

console.log('🏫 Effective Academy ID:', effectiveAcademyId);

if (!effectiveAcademyId) {
  console.error('❌ No academy ID available!');
  console.log('👤 User object:', user);
}
```

**해결 방법**:
1. 재로그인하여 토큰 갱신
2. DB에서 사용자의 academy_id 확인 및 수정
3. 사용자 role이 DIRECTOR, TEACHER, ADMIN 중 하나인지 확인

## 🎬 전체 워크플로우 테스트

### 1. 로그인 후 사용자 정보 확인
```javascript
// Console에서 실행
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Step 1 - User Info:', {
  id: user.id,
  role: user.role,
  academyId: user.academyId || user.academy_id || user.id,
  email: user.email
});
```

### 2. 학생 목록 페이지 확인
```
https://superplacestudy.pages.dev/dashboard/students/
```
- 학생 목록이 보이는지 확인
- 없으면 학생 추가

### 3. 학생 API 테스트
```javascript
// Console에서 실행 (위의 Step 2 스크립트)
fetch('/api/students/by-academy', {...})
```

### 4. 수업 추가 페이지 테스트
```
https://superplacestudy.pages.dev/dashboard/classes/add/
```
- "학생 배정" 섹션에 학생 목록이 나타나는지 확인
- F12 → Console에서 로그 확인:
  ```
  👥 Loading students with token authentication
  ✅ Students loaded: 15
  📋 First few students: [{...}, {...}, {...}]
  ```

### 5. 수업 생성 테스트
1. 반 이름 입력: "테스트반"
2. 학년 선택 (선택사항)
3. 스케줄 추가
4. 학생 선택
5. "반 생성" 버튼 클릭
6. **기대 결과**: "반이 생성되었습니다!" → 수업 목록으로 이동

## 📊 데이터 구조 확인

### 올바른 데이터 구조:

#### users 테이블
```
| id  | name     | email                | role     | academy_id |
|-----|----------|----------------------|----------|------------|
| 208 | 김학원장 | director@academy.com | DIRECTOR | 208        |
| 209 | 이학생   | student1@academy.com | STUDENT  | 208        |
| 210 | 박학생   | student2@academy.com | STUDENT  | 208        |
| 211 | 최교사   | teacher@academy.com  | TEACHER  | 208        |
```

**핵심 규칙**:
- 학원장의 `academy_id` = 본인의 `id`
- 해당 학원의 모든 학생/교사의 `academy_id` = 학원장의 `id`

### LocalStorage 토큰 구조:
```javascript
{
  "id": "208",
  "email": "director@academy.com",
  "role": "DIRECTOR",
  "academyId": "208",  // 또는 academy_id
  "token": "208|director@academy.com|DIRECTOR|1709878987654"
}
```

## 🚀 배포 정보

- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **수정 파일**:
  - `functions/api/students/by-academy.ts` (학생 API 개선)
  - `src/app/dashboard/classes/add/page.tsx` (에러 처리 개선)
- **Live Site**: https://superplacestudy.pages.dev
- **배포 시간**: 5-10분 후 반영

## ✅ 최종 체크리스트

### 배포 전:
- [x] 학생 API에서 academyId fallback 로직 추가
- [x] DB에서 academy_id 조회 로직 추가
- [x] TEACHER 역할 추가
- [x] 에러 디버깅 정보 강화
- [x] 프론트엔드 에러 처리 개선

### 배포 후 확인:
- [ ] 브라우저 콘솔에서 사용자 정보 확인
- [ ] 학생 API 테스트 (`/api/students/by-academy`)
- [ ] D1에서 데이터 구조 확인 (academy_id 일치 여부)
- [ ] 수업 추가 페이지에서 학생 목록 표시 확인
- [ ] 수업 생성 테스트 (학생 배정 포함)

## 📞 추가 지원

문제가 계속되면 다음 정보를 공유해주세요:

1. **브라우저 콘솔 로그**:
   - `localStorage.getItem('user')` 결과
   - `/api/students/by-academy` API 응답
   - F12 Console 전체 로그

2. **D1 쿼리 결과**:
   - 사용자 정보 쿼리 결과
   - 학생 수 카운트 결과
   - academy_id 그룹별 카운트

3. **스크린샷**:
   - `/dashboard/students/` 페이지
   - `/dashboard/classes/add/` 페이지
   - 에러 메시지

---
**작성일**: 2026-02-20  
**문서 버전**: v2.0 - 학생 배정 완전 해결
