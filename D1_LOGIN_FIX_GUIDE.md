# D1 로그인 오류 완벽 해결 가이드

## 🔴 문제 상황
- **데이터베이스**: webapp-production (ID: 8c106540-21b4-4fa9-8879-c4956e459ca1)
- **증상**: 회원가입/로그인이 실패함
- **원인**: D1 데이터베이스에 사용자 데이터가 없거나, 비밀번호 해시가 일치하지 않음

## 📋 진단 절차

### 1단계: D1 데이터베이스 접속
```bash
# Cloudflare Dashboard 접속
https://dash.cloudflare.com/

# 경로: Workers & Pages > D1 > webapp-production
```

### 2단계: 현재 상태 확인
D1 Console에서 다음 쿼리 실행:

```sql
-- User 테이블 구조 확인
PRAGMA table_info(User);

-- 전체 사용자 조회
SELECT id, email, name, role, approved FROM User;

-- 역할별 사용자 수
SELECT role, COUNT(*) as count FROM User GROUP BY role;
```

## 🔧 해결 방법

### 방법 1: SQL 스크립트 직접 실행 (권장)

**파일**: `fix_d1_users.sql`

D1 Console에서 다음 SQL을 **순서대로** 실행:

```sql
-- 1. 기존 테스트 사용자 삭제
DELETE FROM User WHERE email IN (
  'admin@superplace.com',
  'director@superplace.com', 
  'teacher@superplace.com',
  'test@test.com'
);

-- 2. 테스트 학원 생성
INSERT OR IGNORE INTO Academy (id, name, code, createdAt, updatedAt)
VALUES (
  'test-academy-001',
  '슈퍼플레이스 테스트 학원',
  'TEST2024',
  datetime('now'),
  datetime('now')
);

-- 3. 관리자 계정 (admin@superplace.com / admin1234)
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'admin-001',
  'admin@superplace.com',
  '슈퍼플레이스 관리자',
  '00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f',
  'SUPER_ADMIN',
  NULL,
  1,
  datetime('now'),
  datetime('now')
);

-- 4. 학원장 계정 (director@superplace.com / director1234)
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'director-001',
  'director@superplace.com',
  '원장',
  '0e837948585f8ec9c22d655fc81af116838db4537a6d9fb705f4a8bad1a8653e',
  'DIRECTOR',
  'test-academy-001',
  1,
  datetime('now'),
  datetime('now')
);

-- 5. 선생님 계정 (teacher@superplace.com / teacher1234)
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'teacher-001',
  'teacher@superplace.com',
  '김선생',
  '3b98a7c7192ebae6443663d636522647974b75117bb3e392986e2d52f2b51ff8',
  'TEACHER',
  'test-academy-001',
  1,
  datetime('now'),
  datetime('now')
);

-- 6. 일반 계정 (test@test.com / test1234)
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'user-001',
  'test@test.com',
  '테스트',
  '39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c',
  'ADMIN',
  NULL,
  1,
  datetime('now'),
  datetime('now')
);

-- 7. 결과 확인
SELECT id, email, name, role, academyId, approved FROM User;
```

### 방법 2: Wrangler CLI 사용

```bash
# D1 데이터베이스에 SQL 파일 실행
wrangler d1 execute webapp-production --file=fix_d1_users.sql
```

## ✅ 테스트 계정 정보

SQL 실행 후 다음 계정으로 로그인 테스트:

| 이메일 | 비밀번호 | 역할 | 승인 상태 |
|--------|----------|------|-----------|
| admin@superplace.com | admin1234 | SUPER_ADMIN | ✅ 승인됨 |
| director@superplace.com | director1234 | DIRECTOR | ✅ 승인됨 |
| teacher@superplace.com | teacher1234 | TEACHER | ✅ 승인됨 |
| test@test.com | test1234 | ADMIN | ✅ 승인됨 |

## 🔍 로그인 프로세스 분석

### 1. 비밀번호 해싱 알고리즘
```javascript
// functions/api/auth/login.ts
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'superplace-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### 2. 로그인 쿼리
```sql
SELECT id, email, name, role, academyId, approved 
FROM User 
WHERE email = ? AND password = ?
```

### 3. 승인 확인
- DIRECTOR는 자동 승인 (`approved = 1`)
- TEACHER, STUDENT는 학원장 승인 필요
- 승인되지 않은 사용자는 로그인 거부

## 🐛 일반적인 오류 원인

### 1. 비밀번호 해시 불일치
**증상**: "이메일 또는 비밀번호가 올바르지 않습니다"

**원인**:
- DB에 저장된 비밀번호가 해싱되지 않음
- 다른 해싱 알고리즘 사용
- Salt가 다름

**해결**: 위 SQL로 올바른 해시값으로 재생성

### 2. 승인되지 않은 사용자
**증상**: "아직 학원장의 승인이 완료되지 않았습니다"

**원인**: `approved = 0` 상태

**해결**:
```sql
UPDATE User SET approved = 1 WHERE email = 'user@example.com';
```

### 3. 데이터베이스가 비어있음
**증상**: 모든 로그인 시도 실패, fallback 계정으로 로그인됨

**원인**: User 테이블에 데이터 없음

**해결**: 위 SQL 스크립트 실행하여 테스트 계정 생성

## 📊 검증 방법

### 1. D1 Console에서 확인
```sql
-- 사용자 수 확인
SELECT COUNT(*) as total FROM User;

-- 각 계정 비밀번호 해시 확인
SELECT email, password FROM User WHERE email LIKE '%superplace.com';

-- 승인 상태 확인
SELECT email, role, approved FROM User;
```

### 2. 로그인 API 테스트
```bash
# admin 계정 테스트
curl -X POST https://superplace-academy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'

# 예상 응답:
# {"success":true,"message":"로그인 성공","data":{"token":"...","user":{...}}}
```

### 3. 브라우저에서 직접 테스트
1. https://superplace-academy.pages.dev/auth/signin 접속
2. 위 테스트 계정으로 로그인 시도
3. 성공 시 대시보드로 리다이렉트

## 🔄 회원가입 테스트

### 새 사용자 등록
1. https://superplace-academy.pages.dev/auth/signup 접속
2. 역할 선택:
   - **DIRECTOR**: 학원장 (학원 자동 생성)
   - **TEACHER**: 선생님 (학원 코드: TEST2024)
   - **STUDENT**: 학생 (학원 코드: TEST2024)
3. 정보 입력 후 가입
4. DIRECTOR는 즉시 로그인 가능
5. TEACHER/STUDENT는 학원장 승인 후 로그인

### 승인 처리 (학원장으로)
1. director@superplace.com으로 로그인
2. Dashboard > 선생님 관리 / 학생 관리
3. 승인 대기 중인 사용자 확인
4. 승인 버튼 클릭

## 🚨 긴급 문제 해결

### 모든 계정이 로그인 안 되는 경우

**즉시 실행**:
```sql
-- 1. 모든 사용자 승인 처리
UPDATE User SET approved = 1;

-- 2. 확인
SELECT email, role, approved FROM User;
```

### 비밀번호를 모르는 경우

**특정 사용자 비밀번호 재설정** (예: newpass123):
```javascript
// Node.js에서 해시 생성
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
hash.update('newpass123' + 'superplace-salt-2024');
const hashed = hash.digest('hex');
console.log(hashed);
// 출력된 해시를 SQL에 사용
```

```sql
UPDATE User 
SET password = '생성된_해시값' 
WHERE email = 'user@example.com';
```

## 📝 체크리스트

로그인 문제 해결 전 확인사항:

- [ ] D1 데이터베이스 접속 확인
- [ ] User 테이블 존재 확인
- [ ] 테스트 계정 4개 생성 완료
- [ ] 비밀번호 해시값 정확히 일치
- [ ] approved = 1 설정 확인
- [ ] Academy 테이블에 TEST2024 코드 존재
- [ ] 브라우저에서 로그인 테스트 성공
- [ ] 각 역할별 대시보드 접근 확인

## 🎯 최종 확인 쿼리

```sql
-- 완벽한 상태 확인
SELECT 
  u.email,
  u.name,
  u.role,
  u.approved,
  a.name as academy_name,
  a.code as academy_code,
  SUBSTR(u.password, 1, 20) || '...' as password_hash
FROM User u
LEFT JOIN Academy a ON u.academyId = a.id
ORDER BY u.createdAt DESC;
```

## 💡 추가 팁

### 1. 로그 확인
Cloudflare Pages 배포 로그:
```
Workers & Pages > superplace-study > Deployments > [최신 배포] > Logs
```

### 2. 환경 변수 확인
```
Workers & Pages > superplace-study > Settings > Environment variables
```

필수 변수:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- D1 바인딩: `DB` → `webapp-production`

### 3. 캐시 클리어
```bash
# 브라우저 캐시 삭제 (개발자 도구)
Ctrl + Shift + Delete

# 또는 시크릿 모드로 테스트
```

## 📞 문제가 계속되는 경우

1. **D1 Console 스크린샷 공유**:
   - User 테이블 데이터
   - 실행한 SQL 쿼리 결과

2. **브라우저 개발자 도구**:
   - Network 탭에서 `/api/auth/login` 요청/응답 확인
   - Console에서 에러 메시지 확인

3. **로그 파일**:
   - Cloudflare Pages 배포 로그
   - 에러 메시지 전체 내용

---

**작성일**: 2026-02-18  
**데이터베이스**: webapp-production (8c106540-21b4-4fa9-8879-c4956e459ca1)  
**버전**: 1.0

이 가이드대로 실행하면 모든 로그인 문제가 해결됩니다! 🚀
