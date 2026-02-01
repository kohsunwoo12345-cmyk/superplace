# Cloudflare D1에 기존 사용자 데이터 가져오기

## 🎯 목적
로컬 PostgreSQL 데이터베이스의 기존 사용자들을 Cloudflare D1으로 복사

---

## 📋 방법 1: SQL 스크립트로 수동 추가 (빠름)

### Step 1: 로컬 DB에서 사용자 데이터 추출

먼저 현재 사용자 목록을 확인하세요:
```
https://superplace-study.vercel.app/dashboard/admin/users
```

### Step 2: Cloudflare D1 Console 접속

1. https://dash.cloudflare.com
2. **Workers & Pages** → **D1**
3. Database ID `8c10...` 선택
4. **Console** 탭 클릭

### Step 3: 사용자 추가 SQL 실행

다음 SQL을 복사해서 Console에 붙여넣고 실행:

```sql
-- 예시: 학생 사용자 추가
INSERT INTO User (
  id, email, name, password, role, 
  phone, grade, studentCode, approved, 
  createdAt, updatedAt
) VALUES 
(
  'student-001',
  'student1@example.com',
  '김학생',
  '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
  'STUDENT',
  '010-1234-5678',
  '중1',
  'ST001',
  1,
  datetime('now'),
  datetime('now')
),
(
  'student-002',
  'student2@example.com',
  '이학생',
  '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
  'STUDENT',
  '010-2345-6789',
  '중2',
  'ST002',
  1,
  datetime('now'),
  datetime('now')
),
(
  'director-001',
  'director@academy.com',
  '박학원장',
  '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
  'DIRECTOR',
  '010-9876-5432',
  NULL,
  NULL,
  1,
  datetime('now'),
  datetime('now')
);
```

---

## 📋 방법 2: API로 자동 동기화 (권장)

### 로컬 → D1 동기화 API 생성

이미 구현된 양방향 동기화 API 사용:

```
POST https://superplace-study.vercel.app/api/cloudflare/d1/sync?direction=to-d1
```

---

## 📋 방법 3: 현재 사용자 데이터 추출 API (제공 예정)

현재 로컬 DB의 사용자를 D1 형식으로 변환하는 API를 만들겠습니다.

---

## 🔍 확인 방법

추가 후 D1 Console에서 확인:

```sql
-- 전체 사용자 조회
SELECT id, email, name, role FROM User;

-- 사용자 수 확인
SELECT COUNT(*) as total FROM User;

-- 역할별 사용자 수
SELECT role, COUNT(*) as count FROM User GROUP BY role;
```

---

## ⚠️ 주의사항

1. **비밀번호**: 기존 사용자의 해시된 비밀번호를 그대로 복사해야 합니다
2. **이메일 중복**: 같은 이메일이 이미 있으면 에러 발생
3. **studentCode**: 학생 코드가 중복되면 안 됨

---

## 다음 단계

어떤 방법을 원하시나요?

1. **수동으로 SQL 직접 실행** (빠르지만 수동)
2. **자동 동기화 API 사용** (현재 로컬 DB → D1으로 복사)
3. **현재 사용자 목록을 SQL로 변환해주는 API 생성** (가장 정확)

선택해주시면 해당 방법으로 진행하겠습니다!
