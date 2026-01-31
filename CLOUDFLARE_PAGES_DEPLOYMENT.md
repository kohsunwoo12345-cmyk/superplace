# CloudFlare Pages 배포 가이드 (2025년 최신)

## 🎯 배포 개요

이 문서는 SUPER PLACE 학원 관리 시스템을 CloudFlare Pages에 배포하는 전체 과정을 설명합니다.

### 프로젝트 정보
- **프로젝트 이름**: `superplace-study`
- **프레임워크**: Next.js 15
- **데이터베이스**: PostgreSQL (Prisma ORM)
- **GitHub 저장소**: kohsunwoo12345-cmyk/superplace
- **기본 브랜치**: genspark_ai_developer 또는 main

---

## 📋 사전 준비사항

### 1. 필수 계정
- ✅ CloudFlare 계정 (https://dash.cloudflare.com/)
- ✅ GitHub 계정 (저장소 연동용)
- ✅ PostgreSQL 데이터베이스 (Neon, Supabase, 또는 Railway 권장)

### 2. 필수 API 키
- ✅ Google Gemini API 키 (https://aistudio.google.com/app/apikey)
- ⚠️ NEXTAUTH_SECRET (생성 방법: `openssl rand -base64 32`)

### 3. 선택적 API 키
- 네이버 API (클라이언트 ID 및 시크릿)
- OpenAI API 키

---

## 🚀 1단계: CloudFlare Pages 프로젝트 생성

### 1.1 CloudFlare Dashboard 접속
1. https://dash.cloudflare.com/ 로그인
2. 왼쪽 메뉴에서 **Workers & Pages** 선택
3. **Create application** 버튼 클릭
4. **Pages** 탭 선택
5. **Connect to Git** 선택

### 1.2 GitHub 저장소 연결
1. GitHub 계정 연결 (처음이라면 GitHub 인증 필요)
2. **kohsunwoo12345-cmyk/superplace** 저장소 선택
3. 배포할 브랜치 선택:
   - Production: `main`
   - 또는 개발용: `genspark_ai_developer`

### 1.3 빌드 설정 구성

#### 프로젝트 이름
```
superplace-study
```

#### 프레임워크 프리셋
```
Next.js (Static & SSR)
```

#### 빌드 명령 (Build command)
```bash
npm run build
```

#### 빌드 출력 디렉토리 (Build output directory)
```
.next
```

#### 루트 디렉토리 (Root directory)
```
/
```
(기본값 유지)

#### Node.js 버전
```
18 또는 20
```
(CloudFlare Pages는 자동으로 최신 Node.js 버전 사용)

---

## 🔐 2단계: 환경 변수 설정

배포 후 반드시 CloudFlare Dashboard에서 환경 변수를 설정해야 합니다.

### 2.1 환경 변수 설정 방법
1. CloudFlare Dashboard > **Workers & Pages** 선택
2. 생성한 프로젝트 (**superplace-study**) 선택
3. **Settings** 탭 클릭
4. **Environment variables** 섹션으로 이동
5. **Add variable** 버튼 클릭

### 2.2 필수 환경 변수

#### DATABASE_URL
**설명**: PostgreSQL 데이터베이스 연결 문자열  
**값 예시**:
```
postgresql://username:password@host.region.neon.tech:5432/database?sslmode=require
```

**데이터베이스 추천 서비스**:
- **Neon** (무료 티어 제공): https://neon.tech
- **Supabase** (무료 티어 제공): https://supabase.com
- **Railway** (무료 티어 제공): https://railway.app

#### NEXTAUTH_URL
**설명**: NextAuth.js 인증 URL  
**값 예시**:
```
https://superplace-study.pages.dev
```
또는 커스텀 도메인:
```
https://your-domain.com
```

#### NEXTAUTH_SECRET
**설명**: NextAuth.js 비밀 키 (최소 32자)  
**생성 방법**:
```bash
openssl rand -base64 32
```
또는 온라인 생성기: https://generate-secret.vercel.app/32

**값 예시**:
```
1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
```

#### GOOGLE_GEMINI_API_KEY
**설명**: Google Gemini AI API 키  
**발급 방법**:
1. https://aistudio.google.com/app/apikey 접속
2. **Create API Key** 클릭
3. 생성된 키 복사

**값 예시**:
```
AIzaSyD1234567890abcdefghijklmnopqrstuvwx
```

#### GEMINI_API_KEY
**설명**: Google Gemini AI API 키 (GOOGLE_GEMINI_API_KEY와 동일)  
**값**: GOOGLE_GEMINI_API_KEY와 동일한 값 입력

### 2.3 선택적 환경 변수

#### OPENAI_API_KEY (선택)
**설명**: OpenAI API 키  
**값 예시**:
```
sk-1234567890abcdefghijklmnopqrstuvwxyz
```

#### NAVER_CLIENT_ID (선택)
**설명**: 네이버 API 클라이언트 ID  
**발급 방법**: https://developers.naver.com/apps/#/register

#### NAVER_CLIENT_SECRET (선택)
**설명**: 네이버 API 클라이언트 시크릿  
**발급 방법**: NAVER_CLIENT_ID와 함께 발급됨

### 2.4 환경 변수 적용 범위
각 환경 변수 추가 시 다음 환경에 적용할지 선택:
- ✅ **Production** (프로덕션 환경)
- ✅ **Preview** (프리뷰 환경, 선택사항)

---

## 🗄️ 3단계: PostgreSQL 데이터베이스 설정

CloudFlare Pages는 SQLite를 직접 지원하지 않으므로 PostgreSQL 데이터베이스를 사용해야 합니다.

### 3.1 Neon 데이터베이스 생성 (권장)

**장점**: 무료 티어, 빠른 설정, 자동 백업

1. https://neon.tech 접속
2. **Sign up** 또는 로그인
3. **Create Project** 클릭
4. 프로젝트 이름 입력: `superplace-study`
5. 리전 선택: 가장 가까운 리전 (예: Asia Pacific - Seoul)
6. **Create Project** 클릭
7. **Connection String** 복사
   - 형식: `postgresql://user:password@host.region.neon.tech:5432/database?sslmode=require`
8. CloudFlare Pages 환경 변수에 `DATABASE_URL`로 추가

### 3.2 Supabase 데이터베이스 생성 (대안)

1. https://supabase.com 접속
2. **New project** 클릭
3. 프로젝트 설정:
   - Name: `superplace-study`
   - Database Password: 강력한 비밀번호 생성
   - Region: 가장 가까운 리전 선택
4. **Create new project** 클릭 (약 2분 소요)
5. 좌측 메뉴 **Settings** > **Database** 선택
6. **Connection string** 섹션에서 **Nodejs** 선택
7. 연결 문자열 복사
8. CloudFlare Pages 환경 변수에 `DATABASE_URL`로 추가

### 3.3 데이터베이스 마이그레이션

배포 후 데이터베이스 스키마를 설정해야 합니다.

**방법 1: 로컬에서 마이그레이션**
```bash
# 프로덕션 DATABASE_URL을 .env에 추가
echo "DATABASE_URL=your-production-database-url" > .env

# Prisma 마이그레이션 실행
npx prisma db push

# 또는 Prisma Studio로 확인
npx prisma studio
```

**방법 2: CloudFlare Pages Function으로 마이그레이션 (고급)**
- `/api/setup` 엔드포인트를 생성하여 최초 1회 실행
- 보안을 위해 API 키 인증 추가 권장

---

## ✅ 4단계: 배포 확인

### 4.1 빌드 로그 확인
1. CloudFlare Dashboard > **Workers & Pages**
2. **superplace-study** 프로젝트 선택
3. **Deployments** 탭 클릭
4. 최신 배포의 **View build log** 클릭
5. 빌드가 성공적으로 완료되었는지 확인

**빌드 시간**: 약 2-5분

### 4.2 배포 URL 확인
빌드가 성공하면 다음 URL로 접속 가능:
```
https://superplace-study.pages.dev
```

### 4.3 기능 테스트 체크리스트
- [ ] 메인 페이지 로드 확인
- [ ] 로그인 페이지 접근 (`/auth/signin`)
- [ ] 회원가입 페이지 접근 (`/auth/signup`)
- [ ] 회원가입 테스트 (학원장, 선생님, 학생)
- [ ] 로그인 테스트
- [ ] 대시보드 접근 확인
- [ ] 데이터베이스 연결 확인 (사용자 생성 후 DB 확인)
- [ ] AI 기능 테스트 (Gemini API 연결 확인)

---

## 🌐 5단계: 커스텀 도메인 설정 (선택사항)

### 5.1 도메인 추가
1. CloudFlare Dashboard > **superplace-study** 프로젝트
2. **Custom domains** 탭 클릭
3. **Set up a custom domain** 클릭
4. 도메인 입력 (예: `superplace.com`)
5. **Continue** 클릭

### 5.2 DNS 레코드 추가
CloudFlare가 자동으로 DNS 레코드를 생성합니다.
- CNAME 레코드: `superplace-study.pages.dev`

### 5.3 환경 변수 업데이트
커스텀 도메인 설정 후 `NEXTAUTH_URL` 업데이트:
```
NEXTAUTH_URL=https://your-domain.com
```

---

## 🔄 자동 배포 설정

### Git 기반 자동 배포
GitHub 저장소에 푸시하면 자동으로 배포됩니다.

**프로덕션 배포**:
- `main` 브랜치에 푸시 → 자동 배포
- URL: `https://superplace-study.pages.dev`

**프리뷰 배포**:
- 다른 브랜치 또는 Pull Request → 프리뷰 URL 생성
- 예: `https://abc123.superplace-study.pages.dev`

---

## 🐛 문제 해결

### 빌드 실패 시

#### 1. 환경 변수 누락 오류
**증상**: `DATABASE_URL 환경 변수가 설정되지 않았습니다`  
**해결**:
- CloudFlare Dashboard > Settings > Environment variables
- 필수 환경 변수 모두 추가 확인
- 배포 재시도

#### 2. Node.js 버전 오류
**증상**: `Unsupported Node.js version`  
**해결**:
- `package.json`에 엔진 버전 명시:
```json
"engines": {
  "node": ">=18.0.0"
}
```

#### 3. 빌드 타임아웃
**증상**: 빌드 시간 초과  
**해결**:
- 불필요한 의존성 제거
- `.vercelignore` 또는 `.gitignore`에 불필요한 파일 추가

### 데이터베이스 연결 오류

#### 1. Connection timeout
**증상**: `connect ETIMEDOUT`  
**해결**:
- DATABASE_URL에 `?sslmode=require` 파라미터 추가
- 방화벽 설정 확인 (Neon/Supabase는 일반적으로 문제 없음)

#### 2. Authentication failed
**증상**: `password authentication failed`  
**해결**:
- DATABASE_URL의 사용자명과 비밀번호 확인
- 특수문자가 포함된 경우 URL 인코딩 필요

#### 3. Too many connections
**증상**: `too many clients already`  
**해결**:
- Prisma 연결 풀 설정 최적화
- 데이터베이스 플랜 업그레이드 고려

### API 호출 오류

#### 1. Gemini API 오류
**증상**: `API key not valid`  
**해결**:
- Google AI Studio에서 API 키 재생성
- `GOOGLE_GEMINI_API_KEY`와 `GEMINI_API_KEY` 모두 설정 확인

#### 2. NextAuth 인증 오류
**증상**: `[next-auth][error][JWT_SESSION_ERROR]`  
**해결**:
- `NEXTAUTH_SECRET` 재생성 (최소 32자)
- `NEXTAUTH_URL`이 배포된 도메인과 일치하는지 확인

---

## 📊 배포 후 모니터링

### CloudFlare Analytics
- CloudFlare Dashboard > **Analytics** 탭
- 페이지 뷰, 요청 수, 대역폭 사용량 확인

### 로그 확인
- CloudFlare Dashboard > **Deployments** 탭
- 각 배포의 **View logs** 클릭
- 런타임 오류 및 경고 확인

---

## 🔐 보안 체크리스트

배포 후 반드시 확인:
- [ ] 모든 환경 변수가 안전하게 설정됨
- [ ] API 키가 코드에 하드코딩되지 않음
- [ ] DATABASE_URL이 SSL 연결 사용 (`?sslmode=require`)
- [ ] NEXTAUTH_SECRET이 충분히 강력함 (최소 32자)
- [ ] 관리자 계정 비밀번호 변경
- [ ] 불필요한 API 엔드포인트 비활성화
- [ ] CORS 설정 확인

---

## 📚 추가 리소스

### 공식 문서
- [CloudFlare Pages 문서](https://developers.cloudflare.com/pages/)
- [Next.js on CloudFlare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Prisma 문서](https://www.prisma.io/docs)
- [NextAuth.js 문서](https://next-auth.js.org/)

### 데이터베이스 문서
- [Neon 문서](https://neon.tech/docs)
- [Supabase 문서](https://supabase.com/docs)

### API 문서
- [Google Gemini API](https://ai.google.dev/docs)
- [OpenAI API](https://platform.openai.com/docs)

---

## 📞 지원

### 문제 발생 시
1. 빌드 로그 확인
2. 환경 변수 설정 재확인
3. 데이터베이스 연결 테스트
4. GitHub Issues에 문의

### 연락처
- **개발팀**: GenSpark AI Developer
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **이메일**: support@superplace.com

---

## ✨ 배포 성공!

축하합니다! SUPER PLACE가 CloudFlare Pages에 성공적으로 배포되었습니다.

### 다음 단계
1. 관리자 계정 생성
2. 학원 정보 설정
3. 선생님 및 학생 초대
4. AI 봇 권한 부여
5. 마케팅 기능 활용

---

**마지막 업데이트**: 2025-01-31  
**작성자**: GenSpark AI Developer  
**버전**: 2.0.0
