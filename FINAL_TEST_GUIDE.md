# 학생 추가 및 반 배정 완전 해결 - 최종 테스트 가이드

## 🔴 해결한 핵심 문제

### 문제: "학원이 배정되지 않았습니다"
**원인**: 토큰에 `academyId`가 포함되지 않음

### 해결 방법
1. **토큰 형식 변경**: `userId|email|role|timestamp` (4개) → `userId|email|role|academyId|timestamp` (5개)
2. **테이블명 수정**: `User` → `users`, `Academy` → `academies`
3. **Fallback 로직**: 토큰에 academyId 없으면 DB에서 조회

## ✅ 수정 완료 내역

### 1. functions/api/auth/login.js (로그인 API)
```javascript
// BEFORE
const token = `${user.id}|${user.email}|${user.role}|${Date.now()}`;
// 4개 파트, academyId 없음

// AFTER
const token = `${user.id}|${user.email}|${user.role}|${user.academyId || ''}|${Date.now()}`;
// 5개 파트, academyId 포함
```

### 2. functions/_lib/auth.ts (토큰 파서)
```typescript
// 새로운 5개 파트 토큰 지원
if (parts.length === 5) {
  const [userId, email, role, academyId, timestamp] = parts;
  return { userId, email, role, academyId, ... };
}

// 구 형식 4개 파트도 호환 (academyId는 null)
if (parts.length === 4) {
  const [userId, email, role, timestamp] = parts;
  return { userId, email, role, academyId: null, ... };
}
```

### 3. functions/api/students/create.ts (학생 생성 API)
```typescript
// Fallback: 토큰에 academyId 없으면 DB 조회
if (!tokenAcademyId && userId) {
  const userRecord = await DB.prepare(`
    SELECT academy_id FROM users WHERE id = ?
  `).bind(userId).first();
  
  tokenAcademyId = userRecord.academy_id;
}
```

## 🧪 테스트 시나리오

### ⚠️ 중요: 다시 로그인 필요!
기존 토큰은 4개 파트 형식이므로 **반드시 로그아웃 후 다시 로그인**하여 새로운 5개 파트 토큰을 받아야 합니다.

### 시나리오 1: 학생 추가 테스트

#### Step 1: 로그아웃 후 재로그인
1. **로그아웃**
   - 우측 상단 사용자 메뉴 → 로그아웃

2. **재로그인** ⭐ 필수!
   - URL: https://superplacestudy.pages.dev/login
   - 학원장 계정으로 로그인
   - 새로운 토큰 생성됨 (5개 파트, academyId 포함)

#### Step 2: 학생 추가
1. **학생 추가 페이지 이동**
   - URL: https://superplacestudy.pages.dev/dashboard/students/add/

2. **학생 정보 입력**
   ```
   이름: 테스트학생1 (필수 아님, 비워도 됨)
   이메일: student1@test.com (선택)
   연락처: 010-9999-0001 ⭐ 필수
   비밀번호: test1234 ⭐ 필수 (6자 이상)
   학교: 테스트중학교 (선택)
   학년: 중학교 1학년 (선택)
   ```

3. **"학생 추가" 버튼 클릭**

4. **예상 결과**
   - ✅ "학생이 추가되었습니다" 메시지
   - ✅ `/dashboard/students/` 페이지로 자동 이동
   - ✅ 추가한 학생이 목록에 표시됨

5. **브라우저 콘솔 확인 (F12)**
   ```javascript
   📤 Creating student with data: {
     phone: "010-9999-0001",
     academyId: 5,  // ⭐ academyId가 있어야 함!
     role: "DIRECTOR"
   }
   📥 Response status: 200
   ✅ Student created successfully
   ```

#### Step 3: 학생 목록 확인
1. **학생 페이지 확인**
   - URL: https://superplacestudy.pages.dev/dashboard/students/

2. **예상 결과**
   - ✅ 방금 추가한 학생이 카드 형태로 표시
   - ✅ 학생 이름 (또는 "이름 없음")
   - ✅ 학생 코드: STU000XXX
   - ✅ 연락처: 010-9999-0001
   - ✅ 학년: 중학교 1학년

### 시나리오 2: 반 추가 시 학생 배정 테스트

#### Step 1: 반 추가 페이지 이동
1. **URL**: https://superplacestudy.pages.dev/dashboard/classes/add/

2. **반 기본 정보 입력**
   ```
   반 이름: 중1-A반 ⭐ 필수
   학년: 중학교 1학년
   과목: 수학
   설명: 테스트 반입니다
   ```

3. **반 색상 선택** (선택사항)
   - 파란색, 초록색 등 원하는 색상 선택

#### Step 2: 학생 배정 확인
1. **페이지 아래로 스크롤**
   - "학생 배정" 섹션 찾기

2. **예상 결과** ⭐⭐⭐
   ```
   학생 배정
   반에 배정할 학생을 선택합니다
   선택: 0명 / 전체: 1명  ← 전체가 1명 이상이어야 함!
   
   □ 전체 선택
   
   학생 목록:
   ☑️ 테스트학생1
      010-9999-0001 · 중학교 1학년
   ```

3. **확인 사항**
   - ✅ "전체: X명" 카운터에 학생 수 표시 (0이 아님!)
   - ✅ 추가했던 학생이 체크박스와 함께 표시
   - ✅ 학생 이름, 연락처, 학년 정보 표시
   - ✅ 체크박스 클릭 시 "선택: 1명" 카운터 증가

4. **브라우저 콘솔 확인**
   ```javascript
   👥 Loading students with token authentication
   ✅ Students loaded: 1  // ⭐ 0이 아닌 숫자!
   📋 First few students: [{
     id: "123",
     name: "테스트학생1",
     studentCode: "STU000123",
     grade: "중학교 1학년",
     academyId: 5
   }]
   ```

#### Step 3: 학생 선택 및 반 생성
1. **학생 체크박스 선택**
   - 배정하고 싶은 학생 선택
   - "선택: X명" 카운터 확인

2. **"반 생성" 버튼 클릭**

3. **예상 결과**
   - ✅ "반이 생성되었습니다" 메시지
   - ✅ `/dashboard/classes` 페이지로 이동
   - ✅ 생성된 반이 목록에 표시됨

### 시나리오 3: 여러 학생 추가 및 배정

1. **학생 2명 이상 추가**
   ```
   학생1: 010-9999-0001, test1234
   학생2: 010-9999-0002, test1234
   학생3: 010-9999-0003, test1234
   ```

2. **반 추가 시 학생 목록 확인**
   - "전체: 3명" 표시
   - 3명의 학생 모두 표시

3. **"전체 선택" 테스트**
   - "전체 선택" 체크박스 클릭
   - ✅ 모든 학생이 선택됨
   - ✅ "선택: 3명 / 전체: 3명" 표시

4. **개별 선택 테스트**
   - 일부 학생만 선택
   - ✅ "선택: 2명 / 전체: 3명" 표시

## 🔍 문제 발생 시 체크리스트

### 1. "학원이 배정되지 않았습니다" 오류
- [ ] **다시 로그인 했는가?** ⭐ 가장 중요!
  - 구 토큰(4개 파트)은 academyId가 없음
  - 로그아웃 → 재로그인 필수

- [ ] 브라우저 콘솔에서 토큰 확인
  ```javascript
  // localStorage에서 토큰 확인
  const user = JSON.parse(localStorage.getItem('user'));
  const token = user.token;
  const parts = token.split('|');
  console.log('Token parts:', parts.length);  // 5여야 함!
  console.log('AcademyId in token:', parts[3]);  // 빈 문자열이 아니어야 함!
  ```

- [ ] Cloudflare 로그 확인
  ```
  👤 Authenticated user: {
    userId: 208,
    role: "DIRECTOR",
    academyId: 5  ← 이 값이 있어야 함!
  }
  ```

### 2. 학생 목록이 0명으로 표시
- [ ] 학생 추가가 성공했는가?
  - `/dashboard/students/` 페이지에서 확인

- [ ] 브라우저 콘솔 확인
  ```javascript
  ✅ Students loaded: 0  ← 0이면 문제!
  
  // API 응답 직접 확인
  const token = JSON.parse(localStorage.getItem('user')).token;
  fetch('/api/students/by-academy', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(r => r.json()).then(console.log);
  ```

- [ ] 데이터베이스 확인 (Cloudflare Dashboard)
  ```sql
  -- 학생이 DB에 있는지 확인
  SELECT u.id, u.name, u.phone, u.academy_id, s.student_code
  FROM users u
  LEFT JOIN students s ON u.id = s.user_id
  WHERE u.role = 'STUDENT'
  ORDER BY u.created_at DESC
  LIMIT 10;
  ```

### 3. 다른 학원의 학생이 보임
- [ ] 토큰의 academyId가 올바른가?
  ```javascript
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('My academyId:', user.academyId);
  ```

- [ ] Cloudflare 로그에서 쿼리 확인
  ```
  📊 Query: SELECT ... WHERE ... AND u.academy_id = ? [5]
  // 학원장의 academy_id와 일치해야 함
  ```

## 📊 데이터베이스 직접 확인

Cloudflare Dashboard → D1 Database → Query

### 학생 데이터 확인
```sql
-- 최근 추가된 학생 확인
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  u.role,
  u.academy_id,
  u.created_at,
  s.student_code,
  s.grade,
  s.status
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'STUDENT'
ORDER BY u.created_at DESC
LIMIT 10;
```

### 특정 학원의 학생만 확인
```sql
-- academy_id = 5인 학생들
SELECT 
  u.id,
  u.name,
  u.phone,
  u.academy_id,
  s.student_code,
  s.grade
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'STUDENT'
AND u.academy_id = 5  -- 학원장의 academy_id로 변경
ORDER BY u.created_at DESC;
```

### 토큰 형식 확인
```sql
-- 학원장 계정 정보 확인
SELECT id, email, name, role, academy_id
FROM users
WHERE role = 'DIRECTOR'
LIMIT 10;
```

## ✅ 배포 완료

### 커밋 정보
```
커밋: f454424
제목: fix: 토큰에 academyId 추가 및 로그인/인증 로직 완전 수정
브랜치: main
배포 URL: https://superplacestudy.pages.dev/
```

### 배포 상태 확인
**Cloudflare Pages Dashboard**:
https://dash.cloudflare.com/ → Pages → superplacestudy → Deployments

**예상 배포 시간**: 2-3분

## 🎯 성공 기준

### 학생 추가
- ✅ "학생이 추가되었습니다" 메시지
- ✅ `/dashboard/students/` 목록에 표시
- ✅ 오류 메시지 없음

### 반 추가 시 학생 배정
- ✅ "전체: X명" 카운터가 0이 아님
- ✅ 추가한 학생들이 목록에 표시
- ✅ 체크박스로 선택 가능
- ✅ "반이 생성되었습니다" 메시지

---

## ⚠️ 최종 확인사항

**배포 완료 후 (2-3분 대기)**

1. ✅ 반드시 로그아웃
2. ✅ 반드시 재로그인 (새 토큰 발급)
3. ✅ 학생 추가 테스트
4. ✅ 반 추가 시 학생 목록 확인

**이제 모든 기능이 정상 작동할 것입니다!** 🚀
