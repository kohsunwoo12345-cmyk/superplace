# 🔍 학원 상세 페이지 실제 데이터 디버깅 가이드

## ✅ 완료된 변경사항

**Commit**: `052cd47` - Mock 데이터 완전 제거

### 주요 변경사항
1. ✅ Mock 데이터 fallback 완전 제거 (200줄 이상 삭제)
2. ✅ API 실패 시 명확한 에러 메시지 표시
3. ✅ 상세한 콘솔 로깅 추가
4. ✅ 에러 케이스별 적절한 처리

---

## 🔍 디버깅 방법

### 1단계: 브라우저 콘솔 로그 확인

학원 상세 페이지 접속 후 **F12 → Console 탭** 확인:

#### 정상 작동 시 표시되는 로그
```
📡 Fetching academy detail for ID: academy-001
📊 API Response status: 200 true
📦 API Response data: {success: true, academy: {...}}
✅ 학원 상세 정보 로드 완료: {id: "academy-001", name: "김학원의 학원", ...}
👨‍🎓 학생 수: 25
👨‍🏫 교사 수: 3
📋 학생 목록: 25
📋 교사 목록: 3
```

#### 에러 발생 시 표시되는 로그
```
❌ 학원 상세 정보 로드 실패: 404
❌ Error: Academy not found
```

---

### 2단계: API 직접 테스트

브라우저 콘솔에서 다음 스크립트 실행:

```javascript
(async () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token:', token ? '있음 (' + token.substring(0, 20) + '...)' : '없음');
  
  if (!token) {
    console.error('❌ 토큰이 없습니다. 로그인이 필요합니다.');
    return;
  }
  
  // 현재 페이지 URL에서 academy ID 추출
  const urlParams = new URLSearchParams(window.location.search);
  const academyId = urlParams.get('id');
  console.log('🆔 Academy ID:', academyId);
  
  if (!academyId) {
    console.error('❌ Academy ID가 URL에 없습니다.');
    return;
  }
  
  console.log('📡 API 호출 중...');
  
  const res = await fetch(`/api/admin/academies?id=${academyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('📊 Status:', res.status);
  console.log('📊 OK:', res.ok);
  
  const data = await res.json();
  console.log('📦 Full Response:', data);
  
  if (data.success) {
    console.log('✅ Success!');
    console.log('🏫 Academy Name:', data.academy?.name);
    console.log('👨‍🎓 Student Count:', data.academy?.studentCount);
    console.log('👨‍🏫 Teacher Count:', data.academy?.teacherCount);
    console.log('📋 Students Array:', data.academy?.students);
    console.log('📋 Teachers Array:', data.academy?.teachers);
    console.log('👔 Director:', data.academy?.director);
  } else {
    console.error('❌ Failed!');
    console.error('❌ Error:', data.error);
    console.error('❌ Message:', data.message);
  }
})();
```

---

### 3단계: D1 Database 확인

**Cloudflare Dashboard → D1 Database → Console**에서 실행:

#### 학원장 및 academy_id 확인
```sql
-- 1. 모든 학원장 조회
SELECT 
  id,
  name,
  email,
  academy_id,
  created_at
FROM users 
WHERE role = 'DIRECTOR'
ORDER BY created_at DESC;

-- 결과 예시:
-- id | name | email | academy_id | created_at
-- 123 | 김학원 | kim@academy.com | academy-001 | 2025-01-15...
```

#### 특정 academy_id의 학원장 조회
```sql
-- URL에서 사용한 academy_id로 검색
SELECT * FROM users 
WHERE role = 'DIRECTOR' AND academy_id = 'academy-001';

-- 결과가 없으면 → 404 에러 발생
-- 결과가 있으면 → 정상 조회 가능
```

#### 학생 및 교사 조회
```sql
-- 특정 academy_id의 학생 목록
SELECT 
  id,
  name,
  email,
  phone,
  created_at
FROM users 
WHERE academy_id = 'academy-001' AND role = 'STUDENT'
ORDER BY created_at DESC;

-- 특정 academy_id의 교사 목록
SELECT 
  id,
  name,
  email,
  phone
FROM users 
WHERE academy_id = 'academy-001' AND role = 'TEACHER'
ORDER BY name;
```

#### 학원별 통계
```sql
-- 모든 academy_id별 인원 집계
SELECT 
  academy_id,
  role,
  COUNT(*) as count
FROM users
WHERE role IN ('DIRECTOR', 'STUDENT', 'TEACHER')
GROUP BY academy_id, role
ORDER BY academy_id, role;

-- 결과 예시:
-- academy_id | role | count
-- academy-001 | DIRECTOR | 1
-- academy-001 | STUDENT | 25
-- academy-001 | TEACHER | 3
```

---

## 🚨 에러 케이스별 해결 방법

### Case 1: "학원 정보를 찾을 수 없습니다" (404)

**원인**: 해당 academy_id의 학원장이 없음

**확인**:
```sql
SELECT * FROM users 
WHERE academy_id = 'academy-001' AND role = 'DIRECTOR';
```

**해결**:
1. academy_id가 올바른지 확인
2. 학원장의 academy_id 수정:
```sql
UPDATE users 
SET academy_id = 'academy-001' 
WHERE id = 123 AND role = 'DIRECTOR';
```

---

### Case 2: "인증이 만료되었습니다" (401)

**원인**: 토큰이 만료되었거나 유효하지 않음

**확인**:
```javascript
console.log('Token:', localStorage.getItem('token'));
```

**해결**:
1. 로그아웃 후 재로그인
2. 토큰 수동 제거 후 재로그인:
```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/login';
```

---

### Case 3: 학생/교사 수가 0으로 표시

**원인**: 학생/교사의 academy_id가 학원장과 다름

**확인**:
```sql
-- 학원장의 academy_id
SELECT academy_id FROM users WHERE role = 'DIRECTOR' LIMIT 1;
-- 결과: academy-001

-- 학생들의 academy_id
SELECT DISTINCT academy_id FROM users WHERE role = 'STUDENT';
-- 결과: NULL, academy-002, academy-003 (academy-001 없음!)
```

**해결**:
```sql
-- 모든 학생을 academy-001로 변경
UPDATE users 
SET academy_id = 'academy-001' 
WHERE role = 'STUDENT';

-- 모든 교사를 academy-001로 변경
UPDATE users 
SET academy_id = 'academy-001' 
WHERE role = 'TEACHER';

-- 확인
SELECT 
  role,
  COUNT(*) as count
FROM users
WHERE academy_id = 'academy-001'
GROUP BY role;
```

---

### Case 4: 빈 배열로 표시됨 (학생/교사 목록)

**원인**: API는 성공했지만 students 또는 teachers 배열이 비어있음

**확인**:
```javascript
// 브라우저 콘솔에서
(async () => {
  const token = localStorage.getItem('token');
  const urlParams = new URLSearchParams(window.location.search);
  const academyId = urlParams.get('id');
  
  const res = await fetch(`/api/admin/academies?id=${academyId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.log('Students:', data.academy.students);
  console.log('Students Length:', data.academy.students?.length || 0);
  console.log('Teachers:', data.academy.teachers);
  console.log('Teachers Length:', data.academy.teachers?.length || 0);
})();
```

**D1에서 확인**:
```sql
-- 학생이 실제로 있는지 확인
SELECT COUNT(*) as student_count
FROM users
WHERE academy_id = 'academy-001' AND role = 'STUDENT';

-- 교사가 실제로 있는지 확인
SELECT COUNT(*) as teacher_count
FROM users
WHERE academy_id = 'academy-001' AND role = 'TEACHER';
```

**해결**: 데이터가 없으면 테스트 데이터 삽입
```sql
-- 테스트 학생 추가
INSERT INTO users (id, name, email, role, academy_id, phone, created_at)
VALUES 
('student-001', '이학생', 'student1@test.com', 'STUDENT', 'academy-001', '010-1111-1111', datetime('now')),
('student-002', '박학생', 'student2@test.com', 'STUDENT', 'academy-001', '010-2222-2222', datetime('now'));

-- 테스트 교사 추가
INSERT INTO users (id, name, email, role, academy_id, phone, created_at)
VALUES 
('teacher-001', '최선생', 'teacher1@test.com', 'TEACHER', 'academy-001', '010-3333-3333', datetime('now'));
```

---

## 📊 Cloudflare Pages 로그 확인

**Cloudflare Dashboard → Workers & Pages → superplacestudy → Logs**

### 정상 작동 시 로그
```
🔍 Requesting specific academy: academy-001
👥 Using User table: users
📋 User table columns: [id, name, email, role, academy_id, ...]
🔧 Column mapping: {id: "id", name: "name", ...}
✅ Found director: {id: 123, name: "김학원", academy_id: "academy-001"}
🎉 Academy detail retrieved successfully
```

### 에러 발생 시 로그
```
🔍 Requesting specific academy: academy-001
⚠️ No director found for academy: academy-001
```

---

## ✅ 최종 체크리스트

배포 완료 후 (5-10분 대기):

### 페이지 접속
- [ ] https://superplacestudy.pages.dev/dashboard/admin/academies/ 접속
- [ ] 학원 카드 클릭
- [ ] 로딩 스피너 표시
- [ ] 에러 없이 상세 페이지 로드

### 데이터 확인
- [ ] 학원명이 "{학원장 이름}의 학원" 형태로 표시
- [ ] 학원장 정보 탭에 이름, 이메일, 전화번호 표시
- [ ] 학생 탭에 **실제 학생 목록** 표시 (Mock 데이터 아님)
- [ ] 교사 탭에 **실제 교사 목록** 표시 (Mock 데이터 아님)
- [ ] 통계 탭에 정확한 학생 수, 교사 수 표시

### 콘솔 확인 (F12)
- [ ] `✅ 학원 상세 정보 로드 완료` 로그 있음
- [ ] `👨‍🎓 학생 수: X` 로그 있음
- [ ] `👨‍🏫 교사 수: Y` 로그 있음
- [ ] `📋 학생 목록: X` 로그 있음
- [ ] `📋 교사 목록: Y` 로그 있음
- [ ] 에러 로그 없음

---

## 🎯 예상 결과

### 정상 작동 화면
```
🏫 김학원의 학원
[활성] [STANDARD]

📊 통계 카드
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 총 학생 수   │ 총 선생님 수 │ 통합 대화 수 │ 총 매출     │
│ 25명        │ 3명         │ 0회         │ ₩0         │
│ (최대 100명) │ (최대 10명)  │             │            │
└─────────────┴─────────────┴─────────────┴─────────────┘

📑 탭 메뉴
개요 | AI 봇 (0) | 결제내역 (0) | 학생 (25) | 선생님 (3) | 통계

[학생 탭 - 실제 데이터!]
┌────────────────────────────────────────┐
│ 이학생                                  │
│ student1@test.com                      │
│ 010-1111-1111                          │
│ 등록일: 2025년 2월 1일                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 박학생                                  │
│ student2@test.com                      │
│ 010-2222-2222                          │
│ 등록일: 2025년 2월 5일                  │
└────────────────────────────────────────┘

... (총 25명)

[선생님 탭 - 실제 데이터!]
┌────────────────────────────────────────┐
│ 최선생                                  │
│ teacher1@test.com                      │
│ 010-3333-3333                          │
└────────────────────────────────────────┘

... (총 3명)
```

---

## 📞 추가 지원

문제가 지속되면 다음 정보를 제공해 주세요:

1. **브라우저 콘솔 로그** (F12 → Console 탭 전체 복사)
2. **D1 SQL 실행 결과**:
   ```sql
   SELECT * FROM users WHERE role = 'DIRECTOR' LIMIT 5;
   SELECT * FROM users WHERE academy_id = 'academy-001';
   ```
3. **Cloudflare Pages Logs** (최근 10줄)
4. **페이지 URL** (academy ID 확인용)

---

**최종 배포**: 2026-02-19  
**커밋 해시**: 052cd47  
**상태**: ✅ Mock 데이터 완전 제거, 실제 데이터만 표시
