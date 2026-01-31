# 🔍 사용자 목록 표시 문제 진단 및 해결

## 🎯 문제 상황
- **URL**: https://superplace-study.vercel.app/dashboard/admin/users
- **증상**: 사용자 목록이 표시되지 않음

---

## 📋 가능한 원인

### 1. 데이터베이스에 사용자가 없음
- 데이터베이스가 비어있거나 마이그레이션이 안 됨

### 2. SUPER_ADMIN 권한이 없음
- 로그인한 계정이 SUPER_ADMIN이 아님
- API가 403 Forbidden 반환

### 3. 데이터베이스 연결 문제
- DATABASE_URL 환경 변수 누락 또는 잘못됨
- 데이터베이스 서버 연결 실패

### 4. 승인되지 않은 사용자
- `approved: false` 상태인 사용자는 로그인 불가

---

## 🔍 1단계: 브라우저 콘솔 확인

### 방법
1. https://superplace-study.vercel.app/dashboard/admin/users 접속
2. **F12** 키 또는 **우클릭 > 검사** 클릭
3. **Console** 탭 확인
4. **Network** 탭 확인

### 확인할 사항

#### Console 탭에서:
```
❌ "사용자 목록 로드 실패:" 에러 메시지
   → API 호출 실패

✅ 에러 없음
   → 2단계로 이동
```

#### Network 탭에서:
```
1. 페이지 새로고침 (F5)
2. "users" 요청 찾기 (/api/admin/users)
3. 상태 코드 확인:

   - 200 OK: API는 정상, 데이터가 빈 배열
   - 403 Forbidden: SUPER_ADMIN 권한 없음
   - 500 Internal Server Error: 서버 오류
   - 실패/없음: 네트워크 문제
```

---

## 🔍 2단계: 로그인 계정 권한 확인

### 현재 로그인한 계정이 SUPER_ADMIN인지 확인

#### 방법 1: 브라우저 콘솔에서 확인
```javascript
// Console 탭에서 실행:
fetch('/api/auth/session')
  .then(r => r.json())
  .then(data => console.log('Current user:', data));
```

**결과 확인**:
```json
{
  "user": {
    "email": "admin@example.com",
    "role": "SUPER_ADMIN"  ← 이게 "SUPER_ADMIN"이어야 함
  }
}
```

#### 방법 2: API 직접 호출
```javascript
// Console 탭에서 실행:
fetch('/api/admin/users')
  .then(r => r.json())
  .then(data => console.log('Users API response:', data));
```

**가능한 응답**:
```json
// ✅ 성공 (데이터 없음)
{ "users": [] }

// ✅ 성공 (데이터 있음)
{ "users": [ { "id": "...", "name": "..." } ] }

// ❌ 권한 없음
{ "error": "권한이 없습니다." }

// ❌ 서버 오류
{ "error": "사용자 목록 조회 중 오류가 발생했습니다." }
```

---

## 🛠️ 3단계: 문제별 해결 방법

### 문제 A: "권한이 없습니다." (403 Forbidden)

**원인**: 로그인한 계정이 SUPER_ADMIN이 아님

**해결 방법 1: 데이터베이스에서 권한 변경**

#### Vercel Postgres 사용 시:
```bash
# Vercel Dashboard에서
1. Storage > Postgres 선택
2. Query 탭 클릭
3. 다음 SQL 실행:

-- 현재 사용자 확인
SELECT id, email, name, role, approved FROM "User";

-- SUPER_ADMIN 권한 부여 (자신의 이메일로 변경)
UPDATE "User" 
SET role = 'SUPER_ADMIN', approved = true
WHERE email = 'your-email@example.com';

-- 확인
SELECT email, role, approved FROM "User" WHERE email = 'your-email@example.com';
```

#### 로컬에서 Prisma Studio 사용:
```bash
# 로컬 터미널에서
cd /home/user/webapp

# .env 파일에 Vercel DATABASE_URL 추가
echo "DATABASE_URL=your-vercel-database-url" > .env

# Prisma Studio 실행
npx prisma studio

# 브라우저에서:
1. User 테이블 선택
2. 자신의 계정 찾기
3. role을 "SUPER_ADMIN"으로 변경
4. approved를 true로 변경
5. Save 클릭
```

**해결 방법 2: 새 SUPER_ADMIN 계정 생성 스크립트**

```javascript
// create-super-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'admin@superplace.com';
  const password = 'Admin1234!'; // 로그인 후 변경하세요
  const name = '시스템 관리자';
  
  // 기존 계정 확인
  const existing = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existing) {
    // 기존 계정을 SUPER_ADMIN으로 변경
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'SUPER_ADMIN',
        approved: true
      }
    });
    console.log('✅ 기존 계정을 SUPER_ADMIN으로 변경:', updated.email);
  } else {
    // 새 SUPER_ADMIN 계정 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN',
        approved: true
      }
    });
    console.log('✅ SUPER_ADMIN 계정 생성 완료:', admin.email);
  }
  
  console.log('\n📋 로그인 정보:');
  console.log('이메일:', email);
  console.log('비밀번호:', password);
  console.log('\n⚠️  로그인 후 반드시 비밀번호를 변경하세요!');
}

createSuperAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### 문제 B: 데이터베이스에 사용자가 없음

**원인**: 데이터베이스가 비어있거나 마이그레이션이 안 됨

**해결 방법**:

#### 1. Prisma 마이그레이션 실행
```bash
# 로컬에서
cd /home/user/webapp

# DATABASE_URL 설정 (.env 파일)
echo "DATABASE_URL=your-vercel-database-url" > .env

# Prisma 마이그레이션
npx prisma db push

# 스키마 확인
npx prisma studio
```

#### 2. 테스트 사용자 생성
```bash
# 회원가입 페이지에서 직접 가입
https://superplace-study.vercel.app/auth/signup

# 또는 스크립트 사용 (위의 create-super-admin.js)
```

---

### 문제 C: DATABASE_URL 환경 변수 문제

**원인**: DATABASE_URL이 설정되지 않았거나 잘못됨

**해결 방법**:

#### Vercel Dashboard에서 확인
```
1. https://vercel.com/dashboard 접속
2. superplace 프로젝트 선택
3. Settings > Environment Variables
4. DATABASE_URL 확인

확인 사항:
✅ DATABASE_URL이 존재함
✅ 값이 postgres://... 형식
✅ ?sslmode=require 포함
✅ Production 환경에 적용됨
```

#### 테스트 방법
```bash
# Vercel 로그 확인
vercel logs superplace --limit 100

# 에러 메시지 찾기:
❌ "DATABASE_URL 환경 변수가 설정되지 않았습니다"
❌ "connect ETIMEDOUT"
❌ "P1001: Can't reach database server"
```

---

### 문제 D: 사용자는 있지만 approved = false

**원인**: 가입했지만 승인되지 않은 사용자

**해결 방법**:

#### SQL로 모든 사용자 승인
```sql
-- Vercel Postgres Query 탭에서
UPDATE "User" SET approved = true WHERE approved = false;

-- 확인
SELECT email, role, approved FROM "User";
```

#### Prisma Studio로 승인
```bash
npx prisma studio

# User 테이블에서:
1. approved = false인 사용자 찾기
2. approved를 true로 변경
3. Save
```

---

## 🔍 4단계: 빠른 진단 스크립트

다음 스크립트를 브라우저 콘솔에 붙여넣으면 자동으로 문제를 진단합니다:

```javascript
async function diagnoseProblem() {
  console.log('🔍 사용자 목록 문제 진단 시작...\n');
  
  // 1. 세션 확인
  console.log('1️⃣ 현재 세션 확인...');
  try {
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    console.log('세션:', session);
    
    if (!session.user) {
      console.error('❌ 로그인되어 있지 않습니다!');
      console.log('해결: /auth/signin 페이지에서 로그인하세요.');
      return;
    }
    
    if (session.user.role !== 'SUPER_ADMIN') {
      console.error(`❌ SUPER_ADMIN 권한이 없습니다. 현재 역할: ${session.user.role}`);
      console.log('해결: 데이터베이스에서 role을 SUPER_ADMIN으로 변경하세요.');
      return;
    }
    
    console.log('✅ SUPER_ADMIN 권한 확인됨\n');
  } catch (error) {
    console.error('❌ 세션 확인 실패:', error);
    return;
  }
  
  // 2. API 호출 테스트
  console.log('2️⃣ 사용자 API 호출...');
  try {
    const usersRes = await fetch('/api/admin/users');
    const usersData = await usersRes.json();
    
    if (!usersRes.ok) {
      console.error(`❌ API 오류 (${usersRes.status}):`, usersData);
      return;
    }
    
    console.log(`✅ API 호출 성공 - 사용자 수: ${usersData.users.length}\n`);
    
    if (usersData.users.length === 0) {
      console.warn('⚠️  데이터베이스에 사용자가 없습니다!');
      console.log('해결:');
      console.log('  1. /auth/signup에서 회원가입');
      console.log('  2. 데이터베이스에서 role을 SUPER_ADMIN으로 변경');
      console.log('  3. approved를 true로 변경');
    } else {
      console.log('✅ 사용자 목록:', usersData.users);
      console.log('\n📊 요약:');
      console.log(`  - 전체: ${usersData.users.length}명`);
      console.log(`  - SUPER_ADMIN: ${usersData.users.filter(u => u.role === 'SUPER_ADMIN').length}명`);
      console.log(`  - DIRECTOR: ${usersData.users.filter(u => u.role === 'DIRECTOR').length}명`);
      console.log(`  - TEACHER: ${usersData.users.filter(u => u.role === 'TEACHER').length}명`);
      console.log(`  - STUDENT: ${usersData.users.filter(u => u.role === 'STUDENT').length}명`);
      console.log(`  - 승인 대기: ${usersData.users.filter(u => !u.approved).length}명`);
    }
  } catch (error) {
    console.error('❌ API 호출 실패:', error);
  }
}

// 실행
diagnoseProblem();
```

---

## ✅ 최종 체크리스트

문제 해결 후 확인:

- [ ] 브라우저 콘솔에 에러 없음
- [ ] /api/admin/users 호출 시 200 OK
- [ ] 로그인 계정의 role = 'SUPER_ADMIN'
- [ ] 로그인 계정의 approved = true
- [ ] 데이터베이스에 최소 1명 이상의 사용자 존재
- [ ] DATABASE_URL 환경 변수 정상
- [ ] 사용자 목록 페이지에 카드 표시됨

---

## 📞 추가 지원

### Vercel 로그 확인
```bash
vercel logs superplace --limit 100 --follow
```

### 데이터베이스 직접 쿼리
```sql
-- 모든 사용자 조회
SELECT id, email, name, role, approved, "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- SUPER_ADMIN 계정 확인
SELECT * FROM "User" WHERE role = 'SUPER_ADMIN';
```

---

**작성자**: GenSpark AI Developer  
**날짜**: 2025-01-31  
**긴급도**: 🔥 높음
