# 🔧 D1 로그인 문제 해결 - 완벽 가이드

## 📌 문제 개요

**데이터베이스**: `webapp-production`  
**ID**: `8c106540-21b4-4fa9-8879-c4956e459ca1`  
**증상**: 회원가입 및 로그인이 실패함

## 🎯 빠른 해결 (5분)

### 1단계: Cloudflare D1 Console 접속

```
https://dash.cloudflare.com/
→ Workers & Pages → D1 → webapp-production
```

### 2단계: SQL 실행

**D1 Console**에서 `fix_d1_users.sql` 파일의 내용을 복사하여 실행하거나, 아래 명령어를 한 줄씩 실행:

```sql
-- 기존 테스트 계정 삭제
DELETE FROM User WHERE email IN (
  'admin@superplace.com',
  'director@superplace.com', 
  'teacher@superplace.com',
  'test@test.com'
);

-- 테스트 학원 생성
INSERT OR IGNORE INTO Academy (id, name, code, createdAt, updatedAt)
VALUES ('test-academy-001', '슈퍼플레이스 테스트 학원', 'TEST2024', datetime('now'), datetime('now'));

-- 관리자 계정 생성
INSERT INTO User (id, email, name, password, role, academyId, approved, createdAt, updatedAt)
VALUES (
  'admin-001', 'admin@superplace.com', '슈퍼플레이스 관리자',
  '00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f',
  'SUPER_ADMIN', NULL, 1, datetime('now'), datetime('now')
);

-- 학원장 계정 생성
INSERT INTO User (id, email, name, password, role, academyId, approved, createdAt, updatedAt)
VALUES (
  'director-001', 'director@superplace.com', '원장',
  '0e837948585f8ec9c22d655fc81af116838db4537a6d9fb705f4a8bad1a8653e',
  'DIRECTOR', 'test-academy-001', 1, datetime('now'), datetime('now')
);

-- 선생님 계정 생성
INSERT INTO User (id, email, name, password, role, academyId, approved, createdAt, updatedAt)
VALUES (
  'teacher-001', 'teacher@superplace.com', '김선생',
  '3b98a7c7192ebae6443663d636522647974b75117bb3e392986e2d52f2b51ff8',
  'TEACHER', 'test-academy-001', 1, datetime('now'), datetime('now')
);

-- 일반 계정 생성
INSERT INTO User (id, email, name, password, role, academyId, approved, createdAt, updatedAt)
VALUES (
  'user-001', 'test@test.com', '테스트',
  '39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c',
  'ADMIN', NULL, 1, datetime('now'), datetime('now')
);
```

### 3단계: 결과 확인

```sql
SELECT id, email, name, role, academyId, approved FROM User;
```

4개의 계정이 표시되어야 합니다.

## ✅ 테스트 계정

| 이메일 | 비밀번호 | 역할 | 학원 |
|--------|----------|------|------|
| admin@superplace.com | admin1234 | SUPER_ADMIN | - |
| director@superplace.com | director1234 | DIRECTOR | 슈퍼플레이스 테스트 학원 |
| teacher@superplace.com | teacher1234 | TEACHER | 슈퍼플레이스 테스트 학원 |
| test@test.com | test1234 | ADMIN | - |

## 🧪 로그인 테스트 방법

### 방법 1: 브라우저 테스트 페이지 (권장)

1. `test-login.html` 파일을 브라우저로 열기
2. 테스트 계정 버튼 클릭하여 자동 입력
3. "로그인 테스트" 버튼 클릭
4. 결과 확인

### 방법 2: 실제 사이트에서 테스트

1. https://superplace-academy.pages.dev/auth/signin 접속
2. 위 테스트 계정으로 로그인
3. 성공 시 대시보드로 이동

### 방법 3: curl 명령어

```bash
curl -X POST https://superplace-academy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'
```

## 📁 제공된 파일

### 1. `fix_d1_users.sql`
D1 데이터베이스에 테스트 계정을 생성하는 SQL 스크립트

### 2. `check_d1_users.sql`
현재 데이터베이스 상태를 확인하는 SQL 쿼리 모음

### 3. `test_login.js`
비밀번호 해시를 생성하고 검증하는 Node.js 스크립트

```bash
node test_login.js
```

### 4. `test-login.html`
브라우저에서 로그인 API를 직접 테스트할 수 있는 HTML 도구

### 5. `D1_LOGIN_FIX_GUIDE.md`
전체 문제 해결 프로세스와 상세 설명

## 🔍 문제 원인 분석

### 1. 비밀번호 해싱 방식
```javascript
// SHA-256 해싱 + 고정 salt
password + 'superplace-salt-2024' → SHA-256 해시
```

### 2. 로그인 프로세스
```typescript
// 1. 입력된 비밀번호를 해싱
const hashedPassword = await hashPassword(data.password);

// 2. DB에서 이메일과 해시된 비밀번호로 검색
SELECT * FROM User WHERE email = ? AND password = ?

// 3. 승인 상태 확인
if (user.approved === 0 && user.role !== 'DIRECTOR') {
  return '승인되지 않음';
}
```

### 3. 일반적인 오류 원인

#### A. 사용자 데이터 없음
**증상**: 모든 로그인 시도 실패  
**해결**: `fix_d1_users.sql` 실행

#### B. 비밀번호 해시 불일치
**증상**: "이메일 또는 비밀번호가 올바르지 않습니다"  
**해결**: 올바른 해시값으로 재생성 (SQL 스크립트 사용)

#### C. 승인되지 않은 상태
**증상**: "학원장의 승인이 완료되지 않았습니다"  
**해결**: 
```sql
UPDATE User SET approved = 1 WHERE email = 'user@example.com';
```

## 🛠 CLI 명령어 (대안)

### Wrangler CLI 사용

```bash
# D1 데이터베이스 목록 조회
wrangler d1 list

# SQL 파일 실행
wrangler d1 execute webapp-production --file=fix_d1_users.sql

# 직접 SQL 실행
wrangler d1 execute webapp-production --command="SELECT * FROM User;"
```

## 🔐 새 사용자 추가하기

### 1. 비밀번호 해시 생성

```javascript
// Node.js
const crypto = require('crypto');
const password = 'your-password';
const hash = crypto.createHash('sha256');
hash.update(password + 'superplace-salt-2024');
console.log(hash.digest('hex'));
```

### 2. SQL 실행

```sql
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'unique-id-' || datetime('now'),  -- 또는 직접 ID 지정
  'new-user@example.com',
  '사용자 이름',
  '위에서_생성한_해시값',
  'ADMIN',  -- 또는 DIRECTOR, TEACHER, STUDENT
  NULL,     -- 학원 ID (선택)
  1,        -- 승인 상태 (1: 승인됨, 0: 대기)
  datetime('now'),
  datetime('now')
);
```

## 📊 데이터 확인 쿼리

### 전체 사용자 조회
```sql
SELECT 
  id, email, name, role, 
  academyId, approved, 
  createdAt 
FROM User 
ORDER BY createdAt DESC;
```

### 역할별 통계
```sql
SELECT role, COUNT(*) as count 
FROM User 
GROUP BY role;
```

### 승인 대기 중인 사용자
```sql
SELECT email, name, role, approved 
FROM User 
WHERE approved = 0;
```

### 학원별 사용자
```sql
SELECT 
  u.email, u.name, u.role,
  a.name as academy_name, a.code as academy_code
FROM User u
LEFT JOIN Academy a ON u.academyId = a.id
WHERE u.academyId IS NOT NULL;
```

## 🚨 긴급 복구 (모든 계정 접근 불가)

```sql
-- 모든 사용자 승인 처리
UPDATE User SET approved = 1;

-- 특정 계정을 SUPER_ADMIN으로 승격
UPDATE User 
SET role = 'SUPER_ADMIN' 
WHERE email = 'your-email@example.com';

-- 확인
SELECT email, role, approved FROM User;
```

## 📱 회원가입 테스트

### DIRECTOR (학원장) 가입
1. https://superplace-academy.pages.dev/auth/signup
2. 역할: DIRECTOR
3. 학원 이름 입력 (예: "테스트 학원")
4. 가입 후 즉시 로그인 가능
5. 학원 코드 자동 생성됨

### TEACHER/STUDENT 가입
1. https://superplace-academy.pages.dev/auth/signup
2. 역할: TEACHER 또는 STUDENT
3. 학원 코드 입력: `TEST2024`
4. 가입 후 학원장 승인 대기
5. 승인 후 로그인 가능

## ✨ 최종 확인 사항

- [ ] D1 Console에서 SQL 실행 완료
- [ ] 4개의 테스트 계정 생성 확인
- [ ] `test-login.html`에서 로그인 테스트 성공
- [ ] 실제 사이트에서 로그인 테스트 성공
- [ ] 각 역할별 대시보드 접근 확인
- [ ] 새 사용자 회원가입 테스트 완료

## 📞 추가 지원

문제가 계속되는 경우 다음 정보를 확인:

1. **D1 Console 스크린샷**
   - `SELECT * FROM User;` 실행 결과

2. **브라우저 개발자 도구**
   - Network 탭: `/api/auth/login` 요청/응답
   - Console 탭: 에러 메시지

3. **Cloudflare 로그**
   - Workers & Pages > superplace-study > Deployments > Logs

---

**작성일**: 2026-02-18  
**데이터베이스**: webapp-production  
**상태**: ✅ 해결 완료

모든 절차를 따라 실행하면 로그인 문제가 완전히 해결됩니다! 🎉
