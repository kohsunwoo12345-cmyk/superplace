# 🎯 반 추가 및 학원 목록 기능 완전 개선 완료

## 📋 작업 완료 요약

### 🎓 1. 반 추가 페이지 개선 (/dashboard/classes/add/)

#### ✅ 학년 선택 개선
- **변경 전**: 텍스트 입력 필드
- **변경 후**: Select 드롭다운
- **옵션**:
  - 초등 1학년 ~ 초등 6학년
  - 중1 ~ 중3 (중학교 1학년 ~ 3학년)
  - 고1 ~ 고3 (고등학교 1학년 ~ 3학년)

#### ✅ 학생 선택 권한 구현
- **ADMIN/SUPER_ADMIN**: 모든 학생 선택 가능
- **DIRECTOR (학원장)**: 자신의 학원 학생만 선택 가능
- **API**: `/api/students/by-academy` (이미 구현됨)

#### ✅ 학생 배정 로직 개선
**문제**: 반 생성 후 학생 계정에서 반이 보이지 않음

**해결**:
```typescript
// 두 가지 테이블 모두 업데이트
1. students 테이블: class_id 업데이트
2. class_students 테이블: classId, studentId 관계 생성 (status='active')
```

**파일**: `functions/api/classes/create.ts`

---

### 🏫 2. 학원 목록 API 개선 (/dashboard/admin/academies/)

#### ✅ 문제 해결: "학원이 0개로 나옴"

**원인**: 테이블명 대소문자 불일치
- 일부 DB: `Academy`, `User` (대문자)
- 일부 DB: `academies`, `users` (소문자)

**해결**: 테이블명 자동 감지
```typescript
// 테이블 존재 여부 확인 후 동적으로 선택
1. Academy 테이블 확인 → 없으면 academies 확인
2. User 테이블 확인 → 없으면 users 확인
3. 감지된 테이블명으로 쿼리 실행
```

**파일**: `functions/api/admin/academies.ts`

---

## 🔍 주요 변경 사항

### 📁 수정된 파일

1. **src/app/dashboard/classes/add/page.tsx**
   - Select 컴포넌트 import 추가
   - GRADE_OPTIONS 상수 추가
   - 학년 입력을 Select로 변경

2. **functions/api/classes/create.ts**
   - 학생 배정 시 `class_students` 테이블에도 등록
   - 중복 등록 방지 로직 추가
   - 에러 발생 시에도 다른 학생 계속 처리

3. **functions/api/admin/academies.ts**
   - 테이블명 자동 감지 로직 추가
   - Academy/academies, User/users 모두 지원
   - 상세한 로깅 추가

### 📄 새로 생성된 파일

1. **CHECK_DATABASE_SCHEMA.sql**
   - 테이블명 확인용 SQL
   - 테이블 스키마 조회
   - 데이터 개수 확인

---

## 🚀 배포 정보

- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Latest Commits**:
  - `8e7b727` - fix: 반 생성 시 학생 계정에도 표시되도록 개선
  - `08eaa25` - feat: 반 추가 및 학원 목록 기능 개선
- **Live URL**: https://superplacestudy.pages.dev
- **배포 시간**: 약 5-10분

---

## 📊 기능 확인 방법

### 1️⃣ 학원 목록 확인

#### Cloudflare D1 Console에서 실행:
```sql
-- 테이블명 확인
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%cademy%';
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%ser%';

-- 학원 데이터 확인
SELECT * FROM Academy LIMIT 5;
-- 또는
SELECT * FROM academies LIMIT 5;
```

#### 브라우저에서 확인:
1. https://superplacestudy.pages.dev/dashboard/admin/academies/ 접속
2. F12 → Console 탭
3. 로그 확인:
   - `📋 Using table names: { academyTable: 'Academy', userTable: 'User' }`
   - `✅ Found academies: X`

---

### 2️⃣ 반 추가 기능 확인

#### URL:
https://superplacestudy.pages.dev/dashboard/classes/add/

#### 테스트 순서:

**Step 1: 학년 선택 확인**
- "학년" 드롭다운 클릭
- 초등 1~6학년, 중1~중3, 고1~고3 옵션 확인

**Step 2: 학생 목록 확인**
- ADMIN 계정: 모든 학생이 표시됨
- DIRECTOR 계정: 자신의 학원 학생만 표시됨

**Step 3: 반 생성 테스트**
1. 반 이름 입력 (예: "중1-A반")
2. 학년 선택 (예: "중학교 1학년")
3. 과목 입력 (예: "수학")
4. 스케줄 추가
5. 학생 선택 (체크박스)
6. "반 생성" 버튼 클릭

**Step 4: D1 Console에서 확인**
```sql
-- 생성된 반 확인
SELECT * FROM classes ORDER BY created_at DESC LIMIT 1;

-- 학생 배정 확인 (class_students 테이블)
SELECT * FROM class_students WHERE status='active' ORDER BY enrolledAt DESC;

-- 학생 배정 확인 (students 테이블)
SELECT user_id, class_id FROM students WHERE class_id IS NOT NULL;
```

---

### 3️⃣ 학생 계정에서 반 확인

#### 학생 계정으로 로그인:
1. 학생 계정으로 로그인
2. 대시보드 접속
3. 자신이 속한 반이 표시되는지 확인

#### API 직접 테스트:
```javascript
// 브라우저 Console에서 실행
const token = localStorage.getItem('token');
fetch('/api/classes/students?classId=1', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('📚 내 반 정보:', data));
```

---

## 🔧 데이터베이스 스키마 확인

### Cloudflare D1 Console에서 실행:

```sql
-- 1. 모든 테이블 목록
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 2. classes 테이블 스키마
PRAGMA table_info(classes);

-- 3. class_students 테이블 스키마
PRAGMA table_info(class_students);

-- 4. 반과 학생 관계 조회
SELECT 
  c.id as class_id,
  c.class_name,
  cs.studentId,
  u.name as student_name,
  cs.status
FROM classes c
LEFT JOIN class_students cs ON c.id = cs.classId
LEFT JOIN users u ON cs.studentId = u.id
WHERE cs.status = 'active'
ORDER BY c.id, u.name;
```

---

## ⚠️ 주의사항

### 데이터베이스 테이블명
- 현재 시스템은 두 가지 테이블명 형식을 모두 지원합니다:
  1. **대문자**: `Academy`, `User`, `Class`
  2. **소문자**: `academies`, `users`, `classes`
- API가 자동으로 감지하므로 별도 설정 불필요

### 학생 배정
- `class_students` 테이블이 없으면 `students` 테이블만 업데이트
- 에러 발생 시에도 다른 학생은 계속 처리
- 중복 등록 시 상태를 'active'로 변경

### 권한
- **ADMIN**: 모든 학생 선택 가능
- **DIRECTOR**: 자신의 학원 학생만 선택 가능
- 권한은 JWT 토큰의 role로 자동 판별

---

## 📞 문제 해결

### ❌ 문제 1: "학원이 0개로 나옴"

**확인**:
```sql
-- D1 Console에서 실행
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%cademy%';
```

**해결**:
- 테이블이 `Academy`인지 `academies`인지 확인
- API가 자동 감지하므로 5-10분 후 재접속

---

### ❌ 문제 2: "반 생성 후 학생 계정에서 안 보임"

**확인**:
```sql
-- D1 Console에서 실행
SELECT * FROM class_students WHERE studentId = ? AND status='active';
```

**해결**:
- `class_students` 테이블이 있는지 확인
- 없다면 테이블 생성 필요

---

### ❌ 문제 3: "학생 목록이 안 나옴"

**확인**:
```javascript
// 브라우저 Console에서 실행
const token = localStorage.getItem('token');
fetch('/api/students/by-academy', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('👥 학생 목록:', data));
```

**해결**:
- 401 에러: 다시 로그인
- 403 에러: 권한 확인 (ADMIN/DIRECTOR만 가능)
- 빈 배열: 학원에 학생 데이터가 없음

---

## 🎉 완료된 기능

- ✅ 학년 선택을 드롭다운으로 변경 (초등/중/고 1~6학년, 1~3학년)
- ✅ 관리자는 모든 학생 선택 가능
- ✅ 학원장은 자신의 학원 학생만 선택 가능
- ✅ 반 생성 시 학생 계정에도 표시됨
- ✅ 학원 목록 API 테이블명 자동 감지
- ✅ 학원이 0개로 나오는 문제 해결

---

## 📁 관련 파일

- **반 추가 페이지**: `src/app/dashboard/classes/add/page.tsx`
- **반 생성 API**: `functions/api/classes/create.ts`
- **학원 목록 API**: `functions/api/admin/academies.ts`
- **학생 조회 API**: `functions/api/students/by-academy.ts`
- **SQL 가이드**: `CHECK_DATABASE_SCHEMA.sql`

---

**배포 완료**: 약 5-10분 후 https://superplacestudy.pages.dev 에 반영됩니다.
