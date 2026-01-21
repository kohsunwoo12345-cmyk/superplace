# 🔧 Vercel 환경 변수 체크리스트

## ❗ 중요: 프로덕션 로그인 오류 해결

현재 **"로그인 설정 오류입니다. 관리자에게 문의하세요"** 오류는 Vercel 환경 변수가 제대로 설정되지 않아서 발생합니다.

### 🎯 즉시 확인해야 할 사항

#### 1. Vercel 대시보드 접속
- URL: https://vercel.com/kohsunwoo12345-cmyk/superplace/settings/environment-variables

#### 2. 필수 환경 변수 3개 확인

| 환경 변수 | 값 | 적용 환경 |
|-----------|-----|----------|
| `NEXTAUTH_URL` | `https://superplacestudy.vercel.app` | Production, Preview, Development 모두 체크 ✅ |
| `NEXTAUTH_SECRET` | `ywacrB6bMHibXwkK9mnF5LeCb6VlYm6A03GWposU074=` | Production, Preview, Development 모두 체크 ✅ |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development 모두 체크 ✅ |

#### 3. 환경 변수 설정 방법 (스크린샷 포함)

**Step 1:** Vercel 프로젝트 → Settings 탭 클릭

**Step 2:** 왼쪽 사이드바에서 "Environment Variables" 클릭

**Step 3:** 각 환경 변수 추가:

```
Variable Name: NEXTAUTH_URL
Value: https://superplacestudy.vercel.app
Environments: ✅ Production ✅ Preview ✅ Development
→ [Save] 클릭
```

```
Variable Name: NEXTAUTH_SECRET
Value: ywacrB6bMHibXwkK9mnF5LeCb6VlYm6A03GWposU074=
Environments: ✅ Production ✅ Preview ✅ Development
→ [Save] 클릭
```

```
Variable Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
Environments: ✅ Production ✅ Preview ✅ Development
→ [Save] 클릭
```

**Step 4:** 저장 후 재배포
1. Deployments 탭으로 이동
2. 최신 배포의 ••• 메뉴 클릭
3. "Redeploy" 선택
4. **중요:** "Use existing Build Cache" 체크 해제 ✅
5. "Redeploy" 버튼 클릭
6. 배포 완료까지 2-3분 대기

## 🔍 환경 변수 설정 확인 방법

### 옵션 1: Vercel 대시보드에서 확인
1. Settings → Environment Variables 페이지 접속
2. 3개의 환경 변수가 모두 표시되는지 확인
3. 각 변수의 Environments 칼럼에서 "Production, Preview, Development" 표시 확인

### 옵션 2: API 엔드포인트로 확인 (배포 후)
```bash
# CSRF 토큰 가져오기 (정상 작동 확인)
curl https://superplacestudy.vercel.app/api/auth/csrf

# 예상 응답 (정상):
{"csrfToken":"..."}

# 예상 응답 (오류):
{"message":"There is a problem with the server configuration..."}
```

## 🚨 일반적인 오류와 해결 방법

### 오류 1: "There is a problem with the server configuration"
**원인:** 환경 변수가 설정되지 않음
**해결:** 위의 3개 환경 변수를 정확히 설정하고 재배포

### 오류 2: "로그인 설정 오류입니다. 관리자에게 문의하세요"
**원인:** NEXTAUTH_SECRET 또는 DATABASE_URL 미설정
**해결:** 환경 변수 확인 후 재배포

### 오류 3: Database connection error
**원인:** DATABASE_URL이 잘못되었거나 Neon DB 접속 불가
**해결:** 
1. Neon 콘솔에서 DATABASE_URL 재확인
2. Connection String이 최신인지 확인
3. `?sslmode=require` 파라미터 포함 여부 확인

### 오류 4: 환경 변수 설정 후에도 오류 지속
**원인:** 빌드 캐시 때문에 이전 빌드 사용
**해결:** 
1. Deployments → Redeploy
2. **"Use existing Build Cache" 체크 해제 필수**
3. 완전히 새로 빌드하도록 설정

## ✅ 설정 완료 후 테스트

### 1. 로그인 페이지 접속
```
https://superplacestudy.vercel.app/auth/signin
```

### 2. 관리자 계정으로 로그인
- **이메일:** admin@superplace.com
- **비밀번호:** admin123!@#

### 3. 예상 결과
- ✅ 로그인 성공 후 /dashboard로 자동 리다이렉트
- ✅ 사이드바에서 모든 메뉴 표시 (요금제 관리, 학원 관리, 전체 통계 등)
- ✅ 각 페이지 정상 작동

## 📞 추가 지원

### Vercel 로그 확인 방법
1. Vercel 프로젝트 → Deployments
2. 최신 배포 클릭
3. "Functions" 탭 → 로그 확인
4. 오류 메시지 확인

### Neon Database 연결 확인
```bash
# psql로 직접 연결 테스트
psql "postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 또는 Node.js 스크립트로 테스트
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.count().then(c => console.log('Users:', c));"
```

## 🎉 체크리스트 요약

- [ ] Vercel 대시보드에 로그인
- [ ] Environment Variables 페이지 접속
- [ ] `NEXTAUTH_URL` 추가 (Production, Preview, Development 모두 체크)
- [ ] `NEXTAUTH_SECRET` 추가 (Production, Preview, Development 모두 체크)
- [ ] `DATABASE_URL` 추가 (Production, Preview, Development 모두 체크)
- [ ] 환경 변수 저장
- [ ] Deployments → Redeploy (캐시 미사용)
- [ ] 배포 완료 대기 (2-3분)
- [ ] https://superplacestudy.vercel.app/auth/signin 접속
- [ ] 관리자 계정으로 로그인 테스트
- [ ] 대시보드 정상 작동 확인

---

**작성일:** 2026-01-21  
**상태:** 긴급 - 즉시 조치 필요  
**우선순위:** P0 (최우선)
