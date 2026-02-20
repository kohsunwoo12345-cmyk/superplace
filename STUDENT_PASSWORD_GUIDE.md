# 🔐 학생 계정 비밀번호 확인 가이드

## 📋 계정 정보

**이메일:** `student_01012341234@phone.generated`  
**전화번호:** `010-1234-1234`  
**역할:** STUDENT

---

## 🔍 비밀번호 확인 방법

### 방법 1: Cloudflare D1 Console에서 직접 조회

#### 1단계: D1 Console 접속
```
https://dash.cloudflare.com
→ Workers & Pages
→ D1
→ 해당 데이터베이스 선택
→ Console 탭
```

#### 2단계: SQL 실행
```sql
SELECT 
  id,
  email,
  name,
  password,
  phoneNumber,
  role
FROM User 
WHERE email = 'student_01012341234@phone.generated';
```

#### 3단계: 결과 확인
```
email: student_01012341234@phone.generated
password: [여기에 비밀번호가 표시됨]
phoneNumber: 01012341234
role: STUDENT
```

---

### 방법 2: 관리자 페이지에서 확인 (권장)

#### 1단계: 관리자로 로그인
```
URL: https://superplacestudy.pages.dev/login
계정: admin@superplace.com
비밀번호: admin1234
```

#### 2단계: 사용자 관리 페이지
```
URL: https://superplacestudy.pages.dev/dashboard/admin/users
```

#### 3단계: 학생 검색
```
검색창에 입력: 01012341234 또는 student_01012341234
```

#### 4단계: 상세 정보 확인
```
학생 카드 클릭 → 상세 페이지
→ 비밀번호 필드 확인 (또는 재설정 버튼)
```

---

## 📱 일반적인 학생 비밀번호 패턴

슈퍼플레이스 시스템에서 자동 생성된 학생 계정의 비밀번호는 보통 다음 패턴 중 하나입니다:

### 패턴 1: 전화번호 기반
```
비밀번호: 01012341234
(전화번호 그대로)
```

### 패턴 2: 전화번호 뒷자리
```
비밀번호: 12341234
(전화번호 뒤 8자리)
```

### 패턴 3: 간단한 기본값
```
비밀번호: 1234
또는
비밀번호: student1234
```

### 패턴 4: 전화번호 뒷자리 4자리
```
비밀번호: 1234
(전화번호 마지막 4자리)
```

---

## 🔧 비밀번호 재설정

### D1 Console에서 재설정

```sql
-- 새 비밀번호로 변경 (예: newpass123)
UPDATE User 
SET password = 'newpass123',
    updatedAt = datetime('now')
WHERE email = 'student_01012341234@phone.generated';

-- 변경 확인
SELECT email, password, updatedAt 
FROM User 
WHERE email = 'student_01012341234@phone.generated';
```

### 관리자 페이지에서 재설정

```
1. 사용자 관리 → 해당 학생 검색
2. 상세 페이지 → "비밀번호 재설정" 버튼
3. 새 비밀번호 입력
4. 저장
```

---

## 🎯 테스트 로그인

### 학생 로그인 페이지
```
URL: https://superplacestudy.pages.dev/student-login
```

### 입력 정보
```
전화번호: 01012341234
비밀번호: [D1에서 조회한 비밀번호]
```

---

## 💡 빠른 확인 팁

### 브라우저 Console에서 API 직접 호출

```javascript
// 1. 관리자로 로그인 후 토큰 가져오기
const token = localStorage.getItem('token');

// 2. 학생 정보 조회
fetch('/api/admin/users?role=STUDENT', {
  headers: { 
    'Authorization': `Bearer ${token}` 
  }
})
.then(res => res.json())
.then(data => {
  // 3. 해당 학생 찾기
  const student = data.users.find(u => 
    u.email === 'student_01012341234@phone.generated'
  );
  
  console.log('📱 Student Info:', student);
  console.log('🔑 Password:', student?.password);
});
```

---

## 🚨 주의사항

### 보안
- 비밀번호는 일반적으로 해시되어 저장되어야 합니다
- 현재 시스템이 평문으로 저장하는지 확인 필요
- 해시된 경우: 재설정만 가능, 확인 불가

### 계정 타입
- `@phone.generated`: 전화번호로 자동 생성된 계정
- 일반 이메일 계정과 다른 로그인 프로세스일 수 있음

---

## 📊 데이터베이스 쿼리 결과 예시

### 정상 케이스
```
id: 123
email: student_01012341234@phone.generated
name: 학생_1234
password: 01012341234 (또는 해시값)
phoneNumber: 01012341234
role: STUDENT
academyId: 1
```

### 계정이 없는 경우
```
(empty result set)
→ 계정이 생성되지 않았거나 삭제됨
```

---

## 🔍 계정이 없다면?

### 새 학생 계정 생성

```sql
INSERT INTO User (
  id,
  email,
  name,
  password,
  phoneNumber,
  role,
  academyId,
  createdAt,
  updatedAt
) VALUES (
  'student_' || datetime('now'),
  'student_01012341234@phone.generated',
  '학생_1234',
  '01012341234',  -- 비밀번호
  '01012341234',
  'STUDENT',
  1,  -- academyId (해당 학원 ID)
  datetime('now'),
  datetime('now')
);
```

---

## 📞 학생 로그인 프로세스

### 1. 학생 로그인 페이지
```
https://superplacestudy.pages.dev/student-login
```

### 2. 입력 필드
```
전화번호: 010-1234-1234 (자동 포맷팅)
비밀번호: [비밀번호 입력]
```

### 3. 인증
```
→ /api/auth/student-login API 호출
→ phoneNumber + password 검증
→ 토큰 발급
→ 학생 대시보드로 이동
```

---

## 🎯 최종 확인 단계

1. **D1 Console에서 비밀번호 조회**
   ```sql
   SELECT password FROM User 
   WHERE email = 'student_01012341234@phone.generated';
   ```

2. **학생 로그인 테스트**
   ```
   https://superplacestudy.pages.dev/student-login
   전화번호: 01012341234
   비밀번호: [조회한 비밀번호]
   ```

3. **로그인 성공 확인**
   ```
   → 학생 대시보드 표시
   → Console에 "Login successful" 로그
   ```

4. **실패 시 비밀번호 재설정**
   ```sql
   UPDATE User 
   SET password = '1234'
   WHERE email = 'student_01012341234@phone.generated';
   ```

---

**결론:**

가장 빠른 방법은 **Cloudflare D1 Console**에서 제공된 SQL을 실행하는 것입니다.

```sql
SELECT email, password 
FROM User 
WHERE email = 'student_01012341234@phone.generated';
```

이 쿼리 실행 결과의 **password** 필드가 해당 학생의 비밀번호입니다.

---

**작성:** Claude (AI Coding Agent)  
**작성일:** 2026-02-18  
**파일:** CHECK_STUDENT_PASSWORD.sql
