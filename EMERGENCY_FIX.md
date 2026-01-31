# 🚨 긴급 수정 가이드 - /api/admin/users 500 에러

## 📋 현재 상황
- URL: https://superplace-study.vercel.app/dashboard/admin/users
- 문제: `/api/admin/users` 엔드포인트에서 500 에러 발생
- 증상: 사용자 목록이 표시되지 않음

## 🔍 원인 분석

500 에러가 발생하는 주요 원인:

1. **SUPER_ADMIN 권한 없음** (가장 가능성 높음)
   - `/api/admin/users`는 `SUPER_ADMIN` 역할만 접근 가능
   - 다른 역할(DIRECTOR, TEACHER, STUDENT)로 로그인 시 403 반환

2. **데이터베이스 연결 실패**
   - `DATABASE_URL` 환경 변수가 Vercel에 설정되지 않음
   - 잘못된 데이터베이스 URL

3. **Prisma 스키마 불일치**
   - 데이터베이스와 Prisma 스키마가 동기화되지 않음

4. **세션 문제**
   - `NEXTAUTH_SECRET`이 설정되지 않음
   - 세션이 만료되었거나 유효하지 않음

## ⚡ 즉시 해결 방법 (3분)

### 옵션 1: 진단 스크립트 실행 (권장)

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/user/webapp

# 2. 진단 스크립트 실행 (DATABASE_URL 필요)
node diagnose-api.js
```

**필요한 것:**
- Vercel 대시보드에서 `DATABASE_URL` 복사

**스크립트 기능:**
- ✅ 데이터베이스 연결 테스트
- ✅ 사용자 수 및 역할별 통계
- ✅ SUPER_ADMIN 계정 확인
- ✅ API 쿼리 시뮬레이션
- ✅ 문제 진단 및 해결 방법 제시

### 옵션 2: SUPER_ADMIN 즉시 생성

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/user/webapp

# 2. 대화형 수정 스크립트 실행
node run-fix.js
```

**스크립트 동작:**
1. DATABASE_URL 입력 요청
2. 데이터베이스 연결
3. 첫 번째 사용자를 SUPER_ADMIN으로 업그레이드
4. 모든 사용자 자동 승인
5. 완료 확인

### 옵션 3: Vercel 로그 확인

1. **Vercel 대시보드 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **프로젝트 선택**
   - `superplace` 프로젝트 클릭

3. **배포 로그 확인**
   - `Deployments` 탭
   - 최신 배포 클릭
   - `Functions` 탭에서 `/api/admin/users` 로그 확인

4. **에러 메시지 분석**
   - 데이터베이스 연결 에러
   - Prisma 쿼리 에러
   - 세션/권한 에러

## 🛠️ 상세 해결 단계

### 1단계: 환경 변수 확인

**Vercel 대시보드에서:**

```
https://vercel.com/dashboard
→ superplace 프로젝트
→ Settings
→ Environment Variables
```

**필수 환경 변수 체크:**

```bash
✅ DATABASE_URL
   예: postgresql://user:password@host.region.neon.tech:5432/database?sslmode=require

✅ NEXTAUTH_SECRET
   예: your-secret-here-minimum-32-characters-long

✅ NEXTAUTH_URL
   예: https://superplace-study.vercel.app

✅ GOOGLE_GEMINI_API_KEY
   예: AIzaSy...

✅ GEMINI_API_KEY
   예: AIzaSy... (위와 동일)
```

**없으면 추가:**
1. `Add New` 버튼 클릭
2. Name: `DATABASE_URL`
3. Value: `postgresql://...` (전체 연결 문자열)
4. Environment: `Production`, `Preview`, `Development` 모두 체크
5. `Save` 클릭

### 2단계: 데이터베이스 마이그레이션

**로컬에서 실행:**

```bash
# 1. .env 파일 생성
echo 'DATABASE_URL="복사한_DATABASE_URL"' > .env

# 2. Prisma 클라이언트 생성
npx prisma generate

# 3. 데이터베이스 스키마 동기화
npx prisma db push

# 4. 진단 실행
node diagnose-api.js
```

### 3단계: SUPER_ADMIN 생성

**방법 A: 스크립트 사용**

```bash
# 대화형 스크립트
node run-fix.js

# 또는 직접 실행
node create-super-admin.js
```

**방법 B: Vercel Postgres 직접 수정**

Vercel 대시보드:
```
Storage 탭 → 데이터베이스 선택 → Query
```

SQL 실행:
```sql
-- 첫 번째 사용자를 SUPER_ADMIN으로 변경
UPDATE "User" 
SET role = 'SUPER_ADMIN', approved = true 
WHERE email = 'your-email@example.com';

-- 모든 사용자 승인
UPDATE "User" SET approved = true;
```

### 4단계: 배포 재시작

**Vercel 대시보드에서:**

1. `Deployments` 탭
2. 최신 배포의 `...` 메뉴
3. `Redeploy` 클릭
4. 빌드 완료 대기 (2-3분)

### 5단계: 확인

1. **로그인**
   ```
   https://superplace-study.vercel.app/auth/signin
   ```

2. **사용자 목록 접속**
   ```
   https://superplace-study.vercel.app/dashboard/admin/users
   ```

3. **예상 결과:**
   - ✅ 사용자 목록 표시
   - ✅ 통계 카드 표시 (전체/학원장/선생님/학생)
   - ✅ 검색/필터 작동
   - ✅ 상세 버튼 작동

## 🔧 문제별 해결 방법

### 문제 1: 403 Forbidden - "권한이 없습니다"

**원인:** SUPER_ADMIN 권한이 없음

**해결:**
```bash
node run-fix.js
# DATABASE_URL 입력 → SUPER_ADMIN 자동 생성
```

### 문제 2: 500 Internal Server Error - 데이터베이스 연결 실패

**원인:** DATABASE_URL 미설정 또는 잘못됨

**해결:**
1. Vercel 대시보드에서 DATABASE_URL 확인
2. `?sslmode=require` 파라미터 포함 확인
3. 환경 변수 재저장 후 재배포

### 문제 3: 사용자 목록이 비어있음

**원인:** 데이터베이스에 사용자가 없음

**해결:**
```bash
# 진단 실행
node diagnose-api.js

# 사용자 목록 확인
node list-users.js
```

### 문제 4: DNS_PROBE_STARTED - 도메인 접근 불가

**원인:** Vercel 배포 URL 문제

**해결:**
1. Vercel 대시보드에서 정확한 배포 URL 확인
2. 커스텀 도메인 설정 확인
3. DNS 전파 대기 (최대 24시간)

## 📊 진단 체크리스트

실행 전 체크:

- [ ] Vercel 프로젝트에 로그인 가능
- [ ] DATABASE_URL 환경 변수 설정됨
- [ ] NEXTAUTH_SECRET 환경 변수 설정됨
- [ ] 데이터베이스에 연결 가능
- [ ] 사용자 데이터가 존재함
- [ ] SUPER_ADMIN 계정이 있음
- [ ] 해당 계정이 승인됨 (approved: true)

실행 후 확인:

- [ ] /auth/signin 페이지 접속 가능
- [ ] SUPER_ADMIN 계정으로 로그인 성공
- [ ] /dashboard/admin/users 접속 성공
- [ ] 사용자 목록이 표시됨
- [ ] 통계가 정확히 표시됨
- [ ] 검색/필터 기능 작동
- [ ] 상세 버튼 작동
- [ ] Impersonation 기능 작동

## 🆘 여전히 해결되지 않으면

### 로그 수집

```bash
# 1. 진단 스크립트 실행 및 저장
node diagnose-api.js > diagnosis-report.txt 2>&1

# 2. 사용자 목록 확인
node list-users.js >> diagnosis-report.txt 2>&1

# 3. 환경 변수 체크 (민감 정보 제외)
echo "Environment Check:" >> diagnosis-report.txt
echo "DATABASE_URL: ${DATABASE_URL:0:20}..." >> diagnosis-report.txt
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET}" >> diagnosis-report.txt
```

### 수동 검증

**브라우저 Console에서:**

```javascript
// 1. 세션 확인
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log);

// 예상 결과:
// {
//   user: {
//     id: "...",
//     email: "...",
//     role: "SUPER_ADMIN",
//     ...
//   }
// }

// 2. API 테스트
fetch('/api/admin/users')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// 성공: { users: [...] }
// 실패: { error: "..." }
```

## 📚 관련 문서

- `START_HERE.md` - 빠른 시작 가이드
- `USERS_PAGE_DEBUG.md` - 사용자 페이지 디버깅
- `DATABASE_SYNC_GUIDE.md` - 데이터베이스 동기화
- `QUICK_SYNC_GUIDE.md` - 5분 동기화 가이드
- `FIX_NOW.md` - 즉시 수정 가이드

## 🎯 요약

**가장 빠른 해결 방법:**

```bash
# 1. 터미널에서
cd /home/user/webapp
node diagnose-api.js

# 2. DATABASE_URL 입력 (Vercel에서 복사)

# 3. 문제 확인 후
node run-fix.js

# 4. 다시 DATABASE_URL 입력

# 5. 완료!
```

**예상 소요 시간:** 3-5분

**성공 지표:**
- ✅ https://superplace-study.vercel.app/dashboard/admin/users 접속 성공
- ✅ 사용자 목록 표시
- ✅ 검색/필터 작동

---

**최종 업데이트:** 2026-01-31  
**작성자:** GenSpark AI Developer  
**프로젝트:** SUPER PLACE - AI 기반 통합 학원 관리 플랫폼
