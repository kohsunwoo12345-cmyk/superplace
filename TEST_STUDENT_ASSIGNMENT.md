# 학생 추가 및 반 배정 테스트 가이드

## 🔍 문제 분석
사용자가 보고한 문제:
1. **학생 추가 실패**: "학원이 배정되지 않았습니다" 오류
2. **반 배정 시 학생 목록 없음**: 추가한 학생이 반 배정 탭에 표시되지 않음

## ✅ 적용된 수정사항

### 1. 토큰에 academyId 추가 (로그인 API)
```javascript
// 변경 전: userId|email|role|timestamp
// 변경 후: userId|email|role|academyId|timestamp
const token = `${user.id}|${user.email}|${user.role}|${user.academy_id}|${Date.now()}`;
```

### 2. 인증 유틸리티 업데이트 (functions/_lib/auth.ts)
- 5개 부분으로 구성된 토큰 형식 지원
- 토큰에 academyId가 없을 경우 DB에서 조회하는 폴백 로직 추가
- 상세한 디버깅 로그 추가

### 3. 학생 생성 API 수정 (functions/api/students/create.ts)
- TypeScript로 완전히 재작성
- `getUserFromAuth`를 사용한 통합 인증
- 자동 학생 코드 생성
- 올바른 컬럼명 사용 (academy_id, user_id, created_at)
- 상세한 에러 로깅

### 4. 학생 목록 조회 API (functions/api/students/by-academy.ts)
- `INNER JOIN` → `LEFT JOIN`으로 변경
- 학생이 students 테이블에 없어도 users 테이블 데이터 반환
- academyId 기반 필터링 강화

## 🧪 테스트 시나리오

### 시나리오 1: 학생 추가 테스트

#### Step 1: 로그인
```
URL: https://superplacestudy.pages.dev/login
계정: 학원장(DIRECTOR) 계정으로 로그인
```

**예상 결과:**
- 로그인 성공
- localStorage에 토큰 저장됨
- 토큰 형식: `userId|email|role|academyId|timestamp`

**확인 방법:**
```javascript
// 브라우저 콘솔에서 실행
const token = localStorage.getItem('token');
console.log('Token:', token);
const parts = token.split('|');
console.log('Token parts:', {
  userId: parts[0],
  email: parts[1],
  role: parts[2],
  academyId: parts[3],  // 이 값이 있어야 함!
  timestamp: parts[4]
});
```

#### Step 2: 학생 추가
```
URL: https://superplacestudy.pages.dev/dashboard/students/add/
```

**입력 데이터:**
- 이름: 테스트학생001
- 이메일: test001@example.com
- 비밀번호: test1234
- 전화번호: 010-1234-5678
- 학교: 테스트중학교
- 학년: 1

**예상 결과:**
1. POST /api/students/create 요청 성공
2. 알림: "학생이 추가되었습니다"
3. /dashboard/students/ 페이지로 리디렉션

**서버 로그 (Cloudflare Functions):**
```
[학생 생성 API] 요청 시작
[학생 생성 API] 인증 성공: { userId: 'X', role: 'DIRECTOR', academyId: 'Y' }
[학생 생성 API] 전화번호 중복 확인 완료
[학생 생성 API] 이메일 중복 확인 완료
[학생 생성 API] users 테이블에 학생 사용자 추가 성공, userId: Z
[학생 생성 API] students 테이블에 학생 정보 추가 성공
[학생 생성 API] 학생 코드 생성 완료: ABC123
[학생 생성 API] 학생 추가 완료
```

**브라우저 콘솔 로그:**
```
학생 추가 API 요청 데이터: { name, email, phone, ... academyId: Y }
학생 추가 성공: { success: true, studentId: Z, message: "학생이 추가되었습니다" }
```

#### Step 3: 학생 목록 확인
```
URL: https://superplacestudy.pages.dev/dashboard/students/
```

**예상 결과:**
- 방금 추가한 "테스트학생001"이 목록에 표시됨
- 학생 정보: 이름, 학생코드, 이메일, 전화번호, 학년

**브라우저 콘솔 로그:**
```
👥 Loading students...
Authorization token found, length: XXX
✅ Students loaded: 1
[
  {
    id: Z,
    name: "테스트학생001",
    email: "test001@example.com",
    studentCode: "ABC123",
    grade: "1",
    phone: "010-1234-5678",
    academyId: Y,
    status: "ACTIVE"
  }
]
```

### 시나리오 2: 반 추가 및 학생 배정 테스트

#### Step 1: 반 추가 페이지 접속
```
URL: https://superplacestudy.pages.dev/dashboard/classes/add/
```

**예상 결과:**
- "학생 배정" 섹션에 학생 목록이 로드됨
- 체크박스와 함께 학생 정보 표시

**브라우저 콘솔 로그:**
```
👥 Loading students for class assignment...
Authorization token found
🔍 API Request: GET /api/students/by-academy
✅ Students loaded: 1 students
📋 Student preview: [
  {
    id: Z,
    name: "테스트학생001",
    studentCode: "ABC123",
    ...
  }
]
```

**서버 로그:**
```
[학생 목록 조회] 사용자 인증 성공: { userId: X, role: 'DIRECTOR', academyId: Y }
[학생 목록 조회] SQL 실행: SELECT ... FROM users LEFT JOIN students ... WHERE users.academy_id = Y
[학생 목록 조회] 조회 결과: 1명
```

#### Step 2: 반 생성 및 학생 배정
**입력 데이터:**
- 반 이름: 1학년 수학반
- 학년: 1
- 과목: 수학
- 학생 선택: "테스트학생001" 체크

**예상 결과:**
1. POST /api/classes/create 요청 성공
2. 선택한 학생이 반에 배정됨
3. 알림: "반이 추가되었습니다"
4. /dashboard/classes/ 페이지로 리디렉션

**API 요청 데이터:**
```json
{
  "academyId": "Y",
  "name": "1학년 수학반",
  "grade": "1",
  "subject": "수학",
  "teacherId": "X",
  "studentIds": ["Z"],
  "color": "#3B82F6"
}
```

## 🔧 디버깅 방법

### 1. 토큰 확인
```javascript
// 브라우저 콘솔
const token = localStorage.getItem('token');
const parts = token.split('|');
console.log('토큰 구조:', {
  userId: parts[0],
  email: parts[1],
  role: parts[2],
  academyId: parts[3],  // 중요!
  timestamp: parts[4]
});

// academyId가 undefined라면 다시 로그인 필요
if (!parts[3]) {
  console.error('❌ academyId가 토큰에 없습니다. 다시 로그인하세요.');
}
```

### 2. API 응답 확인
```javascript
// 학생 추가 시 네트워크 탭에서 확인
// POST /api/students/create
// 응답 예시:
{
  "success": true,
  "studentId": "123",
  "message": "학생이 추가되었습니다"
}

// 실패 시 응답 예시:
{
  "success": false,
  "error": "학원이 배정되지 않았습니다"
}
```

### 3. 데이터베이스 직접 확인 (Cloudflare Dashboard)
```sql
-- 1. 사용자 확인
SELECT id, name, email, role, academy_id 
FROM users 
WHERE role = 'STUDENT' 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 학생 테이블 확인
SELECT s.*, u.name, u.email 
FROM students s 
JOIN users u ON s.user_id = u.id 
ORDER BY s.created_at DESC 
LIMIT 10;

-- 3. 학생 코드 확인
SELECT * 
FROM student_attendance_codes 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. 특정 학원의 학생 확인
SELECT u.id, u.name, u.email, s.student_code, s.grade, u.academy_id
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'STUDENT' AND u.academy_id = 'YOUR_ACADEMY_ID'
ORDER BY u.created_at DESC;
```

## ⚠️ 주의사항

### 1. 캐시 문제
- 수정 후 반드시 **하드 새로고침** (Ctrl+Shift+R / Cmd+Shift+R)
- 또는 **시크릿 모드**에서 테스트

### 2. 토큰 갱신
- 로그인 API 수정 후에는 **반드시 재로그인** 필요
- 기존 토큰은 academyId가 없음

### 3. Cloudflare Pages 배포 대기
- 코드 푸시 후 **2-3분** 배포 대기
- Cloudflare Dashboard에서 배포 상태 확인
- URL: https://dash.cloudflare.com/ → Pages → superplacestudy

## 📊 체크리스트

### 배포 전
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] 모든 파일 커밋
- [ ] main 브랜치에 푸시

### 배포 후
- [ ] Cloudflare Pages 배포 완료 확인
- [ ] 최신 커밋 해시가 배포됨

### 기능 테스트
- [ ] 학원장으로 로그인 성공
- [ ] 토큰에 academyId 포함 확인
- [ ] 학생 추가 성공
- [ ] 학생 목록에 추가한 학생 표시됨
- [ ] 반 추가 페이지에서 학생 목록 로드됨
- [ ] 학생을 선택하여 반에 배정 가능
- [ ] 반 생성 성공

## 🎯 예상 결과

### ✅ 성공 시나리오
1. 학원장이 로그인하면 토큰에 academyId가 포함됨
2. 학생 추가 시 해당 academyId가 자동으로 설정됨
3. 학생 목록 조회 시 같은 academyId의 학생만 표시됨
4. 반 추가 시 같은 academyId의 학생만 배정 가능

### ❌ 실패 시 확인사항
1. "학원이 배정되지 않았습니다" → 토큰에 academyId 없음 → 재로그인 필요
2. "학생 목록이 비어있습니다" → 학생이 실제로 없거나 academyId 불일치
3. "Unauthorized" → 토큰 만료 또는 유효하지 않음 → 재로그인 필요

## 🔄 최종 커밋 정보
- **커밋 해시**: 최신 커밋 확인 필요
- **수정 파일**:
  - `functions/api/auth/login.js` - 토큰에 academyId 추가
  - `functions/_lib/auth.ts` - 5부분 토큰 파싱 지원
  - `functions/api/students/create.ts` - TypeScript 재작성
  - `functions/api/students/by-academy.ts` - LEFT JOIN 사용

## 📝 추가 문서
- [STUDENT_FIX_COMPLETE.md](./STUDENT_FIX_COMPLETE.md) - 이전 수정사항 요약
- [TEST_STUDENT_DATA.md](./TEST_STUDENT_DATA.md) - 학생 데이터 표시 검증

---

**배포 URL**: https://superplacestudy.pages.dev/
**테스트 일시**: 2026-02-20
**상태**: ✅ 수정 완료, 테스트 대기 중
