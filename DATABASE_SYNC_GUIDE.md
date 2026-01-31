# Vercel과 CloudFlare Pages 데이터베이스 동기화 가이드

## 🎯 목표

Vercel 배포 (https://superplace-study.vercel.app)와 CloudFlare Pages 배포가 **동일한 PostgreSQL 데이터베이스**를 공유하여 사용자 데이터를 동기화합니다.

## 📊 현재 상황

- **Vercel 배포**: https://superplace-study.vercel.app/dashboard/admin/users
- **CloudFlare Pages 배포**: 준비 중
- **데이터베이스**: PostgreSQL (Vercel Postgres, Neon, 또는 Supabase)

---

## 🔍 1단계: Vercel 데이터베이스 정보 확인

### 방법 1: Vercel Dashboard에서 확인

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard 로그인
   - `superplace` 프로젝트 선택

2. **Storage 탭 확인**
   - 좌측 메뉴 **Storage** 클릭
   - 연결된 데이터베이스 확인 (Vercel Postgres, Neon, Supabase 등)

3. **환경 변수 확인**
   - **Settings** > **Environment Variables** 클릭
   - `DATABASE_URL` 값 확인 및 복사

### 방법 2: Vercel CLI로 확인

```bash
# Vercel CLI 설치 (이미 설치되어 있음)
npm install -g vercel

# Vercel 로그인
vercel login

# 프로젝트 환경 변수 확인
vercel env pull .env.vercel
cat .env.vercel | grep DATABASE_URL
```

### 예상 DATABASE_URL 형식

```env
# Vercel Postgres
DATABASE_URL="postgres://default:xxx@xxx-pooler.xxx.vercel-storage.com:5432/verceldb?sslmode=require"

# Neon
DATABASE_URL="postgresql://user:pass@xxx.region.neon.tech:5432/database?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:pass@xxx.supabase.co:5432/postgres?sslmode=require"
```

---

## 🔗 2단계: CloudFlare Pages에 동일한 DATABASE_URL 설정

### 2.1 CloudFlare Dashboard 설정

1. **CloudFlare Dashboard 접속**
   - https://dash.cloudflare.com/
   - **Workers & Pages** > **superplace-study** 선택

2. **환경 변수 추가**
   - **Settings** 탭 클릭
   - **Environment variables** 섹션으로 이동
   - **Add variable** 클릭

3. **DATABASE_URL 설정**
   ```
   Variable name: DATABASE_URL
   Value: [Vercel에서 복사한 DATABASE_URL 값 붙여넣기]
   Environment: Production ✅
   ```

4. **저장 및 재배포**
   - **Save** 클릭
   - **Deployments** 탭에서 **Retry deployment** 클릭

### 2.2 동일한 데이터베이스 사용 확인

두 배포가 같은 `DATABASE_URL`을 사용하면 자동으로 동기화됩니다:

```
Vercel 배포    →  DATABASE_URL  ←  CloudFlare Pages 배포
                      ↓
              동일한 PostgreSQL
              (Vercel Postgres/Neon/Supabase)
```

---

## ✅ 3단계: 데이터베이스 연결 확인

### 3.1 Vercel 배포 확인
```
URL: https://superplace-study.vercel.app/dashboard/admin/users
확인: 기존 사용자 데이터가 표시되는지 확인
```

### 3.2 CloudFlare Pages 배포 확인
```
URL: https://superplace-study.pages.dev/dashboard/admin/users
확인: Vercel과 동일한 사용자 데이터가 표시되는지 확인
```

### 3.3 테스트 시나리오

**시나리오 1: Vercel에서 사용자 생성**
1. Vercel 배포에서 회원가입
2. CloudFlare Pages 배포에서 로그인 확인
3. ✅ 성공: 두 배포가 같은 DB 사용 중

**시나리오 2: CloudFlare에서 사용자 생성**
1. CloudFlare Pages 배포에서 회원가입
2. Vercel 배포에서 로그인 확인
3. ✅ 성공: 데이터베이스 동기화 완료

---

## 🔐 4단계: 환경 변수 전체 동기화

CloudFlare Pages에 Vercel과 동일한 환경 변수를 모두 설정해야 합니다.

### 필수 환경 변수

| 변수 이름 | Vercel 설정 | CloudFlare Pages 설정 |
|----------|-------------|---------------------|
| `DATABASE_URL` | ✅ 복사 | ✅ 동일하게 설정 |
| `NEXTAUTH_URL` | `https://superplace-study.vercel.app` | `https://superplace-study.pages.dev` |
| `NEXTAUTH_SECRET` | ✅ 복사 | ✅ 동일하게 설정 |
| `GOOGLE_GEMINI_API_KEY` | ✅ 복사 | ✅ 동일하게 설정 |
| `GEMINI_API_KEY` | ✅ 복사 | ✅ 동일하게 설정 |

### 환경 변수 복사 스크립트

**Vercel에서 환경 변수 내보내기**:
```bash
# Vercel 환경 변수를 로컬 파일로 저장
vercel env pull .env.production
cat .env.production
```

**CloudFlare Pages에 설정**:
```bash
# .env.production 파일의 내용을 CloudFlare Dashboard에 수동으로 입력
# 또는 Wrangler CLI 사용 (고급)
```

---

## 🛠️ 5단계: Vercel Postgres 사용 시 추가 설정

Vercel Postgres를 사용 중이라면 CloudFlare Pages에서도 접근 가능하도록 설정합니다.

### 5.1 Vercel Postgres 연결 풀링 URL 사용

Vercel Postgres는 두 가지 연결 문자열을 제공합니다:

**Direct Connection** (직접 연결):
```
postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb
```

**Pooled Connection** (풀링 연결, 권장):
```
postgres://default:xxx@xxx-pooler.postgres.vercel-storage.com:5432/verceldb
```

CloudFlare Pages에서는 **Pooled Connection**을 사용하세요:
```env
DATABASE_URL="postgres://default:xxx@xxx-pooler.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

### 5.2 연결 제한 확인

Vercel Postgres 무료 플랜:
- 동시 연결: 최대 10개
- 스토리지: 256MB

두 배포가 같은 DB를 사용하므로 연결 수를 모니터링하세요.

---

## 📦 6단계: 데이터베이스 마이그레이션 (필요 시)

이미 Vercel에 데이터베이스가 설정되어 있다면 마이그레이션이 필요 없습니다.

### 현재 데이터베이스 스키마 확인

```bash
# Vercel DATABASE_URL을 .env에 설정
echo "DATABASE_URL=your-vercel-database-url" > .env

# Prisma Studio로 확인
npx prisma studio

# 또는 스키마 비교
npx prisma db pull
```

### 스키마 업데이트가 필요한 경우

```bash
# Prisma 스키마를 데이터베이스에 적용
npx prisma db push

# 또는 마이그레이션 생성
npx prisma migrate dev --name sync_schema
npx prisma migrate deploy
```

---

## 🚨 주의사항

### 1. NEXTAUTH_URL 차이
```env
# Vercel
NEXTAUTH_URL=https://superplace-study.vercel.app

# CloudFlare Pages
NEXTAUTH_URL=https://superplace-study.pages.dev
```
- 각 배포는 자신의 도메인을 `NEXTAUTH_URL`로 설정해야 합니다
- 데이터베이스는 공유하지만, 인증 콜백 URL은 다릅니다

### 2. 세션 관리
- NextAuth.js JWT 세션을 사용하므로 데이터베이스 공유만으로 충분
- 두 배포에서 동일한 `NEXTAUTH_SECRET` 사용 권장

### 3. 데이터베이스 연결 풀
- 두 배포가 동시에 DB에 접근하므로 연결 풀 설정 최적화:
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 연결 풀 설정
  connection_limit = 5
}
```

---

## 🔍 7단계: 동기화 확인 테스트

### 테스트 체크리스트

#### Vercel 배포 테스트
- [ ] https://superplace-study.vercel.app 접속
- [ ] 로그인 정상 작동
- [ ] 관리자 페이지 접근: /dashboard/admin/users
- [ ] 기존 사용자 목록 표시 확인
- [ ] 새 사용자 생성 테스트

#### CloudFlare Pages 배포 테스트
- [ ] https://superplace-study.pages.dev 접속
- [ ] 로그인 정상 작동
- [ ] 관리자 페이지 접근: /dashboard/admin/users
- [ ] Vercel과 동일한 사용자 목록 표시 확인
- [ ] Vercel에서 생성한 사용자로 로그인 확인

#### 실시간 동기화 테스트
1. **Vercel에서 사용자 생성**
   - 회원가입: test-user-1@example.com
   
2. **CloudFlare Pages에서 확인**
   - 로그인 시도: test-user-1@example.com
   - ✅ 성공 = 동기화 완료

3. **CloudFlare Pages에서 사용자 생성**
   - 회원가입: test-user-2@example.com
   
4. **Vercel에서 확인**
   - 로그인 시도: test-user-2@example.com
   - ✅ 성공 = 동기화 완료

---

## 🐛 문제 해결

### 데이터베이스 연결 실패

**증상**: CloudFlare Pages에서 데이터베이스 연결 오류
```
Error: P1001: Can't reach database server
```

**해결**:
1. DATABASE_URL 형식 확인
2. `?sslmode=require` 파라미터 추가
3. Pooled Connection URL 사용 (Vercel Postgres)
4. IP 화이트리스트 확인 (Neon/Supabase)

### 사용자 데이터 불일치

**증상**: Vercel과 CloudFlare에서 다른 사용자 목록 표시

**원인**: 다른 DATABASE_URL 사용 중

**해결**:
1. 두 배포의 DATABASE_URL이 정확히 동일한지 확인
2. 환경 변수 재설정 후 재배포
3. 브라우저 캐시 클리어

### 로그인 실패

**증상**: 한 배포에서 로그인 후 다른 배포에서 로그인 안 됨

**원인**: NEXTAUTH_SECRET 불일치 또는 세션 문제

**해결**:
1. 두 배포에 동일한 NEXTAUTH_SECRET 설정
2. JWT 세션 모드 확인 (데이터베이스 세션 아님)
3. 각 배포의 NEXTAUTH_URL이 올바른지 확인

---

## 📊 모니터링

### 데이터베이스 연결 모니터링

**Vercel Postgres**:
- Vercel Dashboard > Storage > Vercel Postgres
- Usage 탭에서 연결 수, 쿼리 수 확인

**Neon**:
- Neon Console > Project > Monitoring
- 연결 수, CPU 사용량 확인

**Supabase**:
- Supabase Dashboard > Database > Pooler
- 연결 풀 상태 확인

---

## ✅ 동기화 완료 체크리스트

### 설정 완료
- [ ] Vercel DATABASE_URL 확인 완료
- [ ] CloudFlare Pages에 동일한 DATABASE_URL 설정
- [ ] 모든 환경 변수 동기화 (NEXTAUTH_SECRET, GEMINI_API_KEY 등)
- [ ] 두 배포에서 각각 NEXTAUTH_URL 올바르게 설정

### 테스트 완료
- [ ] Vercel 배포 정상 작동
- [ ] CloudFlare Pages 배포 정상 작동
- [ ] 관리자 페이지 접근 성공 (두 배포 모두)
- [ ] 동일한 사용자 목록 표시 확인
- [ ] 실시간 동기화 테스트 성공

### 모니터링 설정
- [ ] 데이터베이스 연결 수 모니터링
- [ ] 성능 메트릭 확인
- [ ] 에러 로그 모니터링

---

## 🎉 완료!

이제 Vercel과 CloudFlare Pages 배포가 동일한 PostgreSQL 데이터베이스를 공유합니다.

### 동기화 방식
```
                  동일한 DATABASE_URL
                          ↓
┌─────────────────────────────────────────────────┐
│                                                 │
│          PostgreSQL Database (공유)              │
│  - 사용자 데이터                                   │
│  - 학원 데이터                                     │
│  - 수업 데이터                                     │
│  - AI 사용 기록                                   │
│                                                 │
└─────────────────────────────────────────────────┘
                ↓                   ↓
         Vercel 배포       CloudFlare Pages 배포
  superplace-study      superplace-study
     .vercel.app           .pages.dev
```

### 주요 장점
✅ 실시간 데이터 동기화  
✅ 단일 데이터베이스 관리  
✅ 비용 절감 (하나의 DB만 사용)  
✅ 일관된 사용자 경험  
✅ 백업 및 마이그레이션 간소화  

---

**작성자**: GenSpark AI Developer  
**날짜**: 2025-01-31  
**관련 문서**: CLOUDFLARE_PAGES_DEPLOYMENT.md
