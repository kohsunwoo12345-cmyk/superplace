# SUPER PLACE Vercel 배포 가이드

## 📋 배포 전 체크리스트

### 1. 필수 준비사항
- [ ] GitHub 저장소: `https://github.com/kohsunwoo12345-cmyk/superplace`
- [ ] Vercel 계정
- [ ] PostgreSQL 데이터베이스 (Neon, Supabase, 또는 Vercel Postgres)
- [ ] Google Generative AI API 키

### 2. 환경 변수 목록
다음 환경 변수들이 Vercel에 설정되어야 합니다:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | 배포된 도메인 | `https://superplace.vercel.app` |
| `NEXTAUTH_SECRET` | 인증 시크릿 키 (32자 이상) | `openssl rand -base64 32` 명령으로 생성 |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API 키 | `AIza...` |

## 🚀 배포 방법

### 방법 1: Vercel 대시보드 (권장)

#### Step 1: Vercel에 프로젝트 Import
1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. **"Add New..."** → **"Project"** 클릭
3. **"Import Git Repository"** 선택
4. GitHub 저장소 연결: `kohsunwoo12345-cmyk/superplace`
5. **main** 브랜치 선택

#### Step 2: 프로젝트 설정
```
Project Name: superplace
Framework Preset: Next.js
Root Directory: ./
Build Command: prisma generate && next build (자동)
Output Directory: .next (자동)
Install Command: npm install (자동)
```

#### Step 3: 환경 변수 설정
**Environment Variables** 섹션에서 다음을 추가:

1. **DATABASE_URL**
   ```
   postgresql://username:password@host:5432/database
   ```
   - Neon, Supabase, 또는 Vercel Postgres에서 발급받은 연결 문자열
   - 모든 환경(Production, Preview, Development)에 추가

2. **NEXTAUTH_URL**
   ```
   https://superplace.vercel.app
   ```
   - 배포 후 자동 생성되는 도메인 사용
   - 또는 커스텀 도메인 설정

3. **NEXTAUTH_SECRET**
   ```bash
   # 로컬에서 생성
   openssl rand -base64 32
   ```
   - 생성된 문자열을 복사하여 입력
   - Production, Preview, Development 모두 동일한 값 사용 권장

4. **GOOGLE_GENERATIVE_AI_API_KEY**
   ```
   AIzaSy...
   ```
   - [Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급

#### Step 4: 배포
1. **"Deploy"** 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 대기 (약 2-3분)

#### Step 5: 데이터베이스 마이그레이션
배포 완료 후, Vercel CLI나 대시보드에서:

```bash
# Vercel 프로젝트 연결
npx vercel link

# Production 환경 변수 가져오기
npx vercel env pull .env.production

# Prisma 마이그레이션
npx prisma db push
```

또는 Vercel 대시보드의 **"Deployments"** → **"..."** → **"Redeploy"** 선택

---

### 방법 2: Vercel CLI

#### Step 1: Vercel CLI 로그인
```bash
npx vercel login
```

#### Step 2: 프로젝트 링크
```bash
cd /path/to/superplace
npx vercel link
```

#### Step 3: 환경 변수 설정
```bash
npx vercel env add DATABASE_URL production
npx vercel env add NEXTAUTH_URL production
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
```

각 명령 실행 시 값을 입력하세요.

#### Step 4: 배포
```bash
# Preview 배포
npx vercel

# Production 배포
npx vercel --prod
```

---

## 🗄️ 데이터베이스 설정

### 옵션 1: Neon (추천)

**특징:**
- ✅ 무료 플랜 제공
- ✅ Serverless PostgreSQL
- ✅ 자동 스케일링
- ✅ 빠른 속도

**설정 방법:**
1. [Neon Console](https://console.neon.tech/) 접속
2. **"Create a project"** 클릭
3. 프로젝트 이름: `superplace`
4. 리전: **Asia Pacific (Singapore)** 선택 (한국과 가까움)
5. PostgreSQL 버전: 최신 버전
6. **"Create Project"** 클릭
7. **"Connection String"** 복사
   ```
   postgresql://user:password@endpoint.region.neon.tech/database?sslmode=require
   ```
8. Vercel 환경 변수에 `DATABASE_URL`로 추가

### 옵션 2: Supabase

**특징:**
- ✅ 무료 플랜 제공
- ✅ PostgreSQL + 백엔드 서비스
- ✅ Real-time 기능
- ✅ 대시보드 제공

**설정 방법:**
1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. **"New project"** 클릭
3. Organization 선택 또는 생성
4. 프로젝트 이름: `superplace`
5. Database Password 설정 (강력한 비밀번호)
6. Region: **Northeast Asia (Seoul)** 선택
7. **"Create new project"** 클릭 (약 2분 소요)
8. 좌측 메뉴 **"Settings"** → **"Database"**
9. **"Connection string"** → **"URI"** 탭
10. 연결 문자열 복사 (비밀번호는 수동으로 입력)
    ```
    postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
    ```
11. Vercel 환경 변수에 `DATABASE_URL`로 추가

### 옵션 3: Vercel Postgres

**특징:**
- ✅ Vercel 통합
- ✅ 자동 설정
- ⚠️ 유료 플랜 필요

**설정 방법:**
1. Vercel 프로젝트 대시보드
2. **"Storage"** 탭
3. **"Create Database"** → **"Postgres"**
4. 자동으로 환경 변수 설정됨

---

## ✅ 배포 확인

### 1. 배포 URL 확인
```
https://superplace.vercel.app
또는
https://superplace-xxxx.vercel.app
```

### 2. 필수 체크 항목
- [ ] 홈페이지 정상 로드
- [ ] 로그인 페이지 접근 가능 (`/auth/signin`)
- [ ] 회원가입 페이지 접근 가능 (`/auth/signup`)
- [ ] 데이터베이스 연결 확인 (회원가입 테스트)

### 3. 테스트 시나리오
```
1. 회원가입 (학원장)
   → 역할: DIRECTOR 선택
   → 이메일, 비밀번호, 이름 입력
   → 학원 자동 생성 확인

2. 로그인
   → 생성한 계정으로 로그인
   → 대시보드 접근 확인

3. 학원 설정
   → 학원 정보 확인
   → 초대 코드 확인

4. 초대 코드로 선생님/학생 가입
   → 새 브라우저 또는 시크릿 모드
   → 선생님 또는 학생으로 가입
   → 학원 코드 입력
   → 학원장 승인 대기 상태 확인

5. 학원장이 승인
   → 선생님/학생 관리 페이지
   → 대기 중인 사용자 승인

6. 수업 생성
   → 수업 관리 페이지
   → 수업 생성 및 학생 등록

7. 출석 체크
   → 출석 관리 페이지
   → 수업 선택 및 출석 체크
```

---

## 🐛 문제 해결

### 빌드 오류

**증상:** "Build failed" 메시지
```bash
# 로컬에서 빌드 테스트
npm run build
```

**해결 방법:**
- TypeScript 오류 확인
- 환경 변수 누락 확인
- Prisma 스키마 확인

### 데이터베이스 연결 오류

**증상:** "Can't reach database server" 또는 "P1001"

**해결 방법:**
1. `DATABASE_URL` 환경 변수 확인
2. 연결 문자열 형식 확인
   ```
   postgresql://USER:PASSWORD@HOST:5432/DATABASE
   ```
3. 데이터베이스 서버 상태 확인 (Neon/Supabase 대시보드)
4. IP 화이트리스트 확인 (필요 시)

### NextAuth 오류

**증상:** "NEXTAUTH_URL" 관련 오류

**해결 방법:**
1. `NEXTAUTH_URL` 환경 변수 확인
2. 프로덕션 도메인 사용
   ```
   https://superplace.vercel.app
   ```
3. `NEXTAUTH_SECRET` 설정 확인
   ```bash
   openssl rand -base64 32
   ```

### Prisma 마이그레이션 오류

**증상:** "Migration failed" 또는 "Table already exists"

**해결 방법:**
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
npx prisma db push --force-reset

# 또는 마이그레이션 재실행
npx prisma db push
```

---

## 🔄 재배포 및 업데이트

### 코드 변경 후 재배포
```bash
# 1. 변경사항 커밋
git add .
git commit -m "Update: 변경 내용"
git push origin main

# 2. Vercel이 자동으로 재배포 (약 2-3분)
# 또는 대시보드에서 수동 재배포
```

### 환경 변수 변경
1. Vercel 대시보드 → **Settings** → **Environment Variables**
2. 변수 수정 또는 추가
3. **Save** 후 **Redeploy** 필요

### 데이터베이스 스키마 변경
```bash
# 1. schema.prisma 수정
# 2. 커밋 및 푸시
# 3. Vercel 배포 후
npx vercel env pull .env.production
npx prisma db push
```

---

## 📊 모니터링

### Vercel Analytics
- 자동으로 트래픽 모니터링
- 페이지 로드 시간 확인
- 오류 추적

### Vercel Logs
```bash
# 실시간 로그 확인
npx vercel logs https://superplace.vercel.app
```

또는 대시보드:
**Deployments** → **Logs** → **Runtime Logs**

---

## 🎉 배포 완료!

축하합니다! SUPER PLACE가 성공적으로 배포되었습니다.

**다음 단계:**
1. 커스텀 도메인 설정 (선택)
2. SSL 인증서 자동 설정 확인
3. 사용자 초대 및 테스트
4. 모니터링 및 로그 확인

**지원:**
- Vercel 문서: https://vercel.com/docs
- Next.js 문서: https://nextjs.org/docs
- Prisma 문서: https://www.prisma.io/docs

---

**버전**: 1.0  
**작성일**: 2025-01-19  
**작성자**: SUPER PLACE Team
