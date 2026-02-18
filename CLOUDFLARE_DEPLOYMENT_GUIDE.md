# Cloudflare Pages 배포 가이드

## 🎯 배포 목표

**사이트 URL**: https://superplacestudy.pages.dev

---

## 📦 빌드 설정

현재 프로젝트는 Cloudflare Pages 배포를 위해 다음과 같이 설정되어 있습니다:

- **빌드 커맨드**: `npm run pages:build`
- **빌드 출력 디렉토리**: `.vercel/output/static`
- **패키지**: `@cloudflare/next-on-pages@1.13.16`
- **Edge Functions**: 14개 (API 라우트)
- **정적 라우트**: 128개

---

## 🚀 배포 방법 1: Cloudflare Pages 대시보드 (추천)

### 1단계: Cloudflare Pages 접속
1. Cloudflare 대시보드로 이동: https://dash.cloudflare.com/
2. 왼쪽 메뉴에서 **Workers & Pages** 클릭
3. **Create application** → **Pages** → **Connect to Git** 클릭

### 2단계: GitHub 저장소 연결
1. **GitHub 계정 연결** (처음이라면)
2. 저장소 선택: `kohsunwoo12345-cmyk/superplace`
3. **Begin setup** 클릭

### 3단계: 빌드 설정
프로젝트 이름과 빌드 설정을 입력합니다:

```
Project name: superplacestudy
Production branch: main (또는 genspark_ai_developer)

Build settings:
  Framework preset: Next.js
  Build command: npm run pages:build
  Build output directory: .vercel/output/static
```

### 4단계: 환경 변수 설정 (선택)
환경 변수가 필요한 경우 추가합니다:

```
GOOGLE_GEMINI_API_KEY: (Gemini API 키)
DATABASE_URL: (데이터베이스 URL, 필요시)
NEXT_PUBLIC_API_URL: https://superplacestudy.pages.dev
```

### 5단계: 배포
**Save and Deploy** 버튼을 클릭하면 자동으로 빌드 및 배포가 시작됩니다.

빌드 시간: 약 1-2분  
완료 후 URL: https://superplacestudy.pages.dev

---

## 🚀 배포 방법 2: Wrangler CLI (고급)

Wrangler CLI를 사용하여 직접 배포하려면 Cloudflare API 토큰이 필요합니다.

### 1단계: API 토큰 생성
1. Cloudflare 대시보드: https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** 클릭
3. **Edit Cloudflare Workers** 템플릿 선택 (또는 Custom Token)
4. 권한 설정:
   - Account → Cloudflare Pages → Edit
5. **Continue to summary** → **Create Token**
6. 생성된 토큰을 복사

### 2단계: 환경 변수 설정
```bash
export CLOUDFLARE_API_TOKEN=your_token_here
export CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### 3단계: 배포 실행
```bash
cd /home/user/webapp
npm run deploy
```

또는 직접:
```bash
wrangler pages deploy .vercel/output/static --project-name=superplacestudy
```

---

## 📋 배포 체크리스트

### 빌드 전 확인사항
- [x] `@cloudflare/next-on-pages` 패키지 설치됨
- [x] 모든 API 라우트에 `export const runtime = 'edge';` 추가됨
- [x] `next.config.ts`에서 `output: 'export'` 제거됨
- [x] 빌드 스크립트 업데이트 (`pages:build`, `deploy`)
- [x] 빌드 성공 (`.vercel/output/static` 생성됨)

### 배포 후 확인사항
- [ ] 메인 페이지 접속 확인 (https://superplacestudy.pages.dev)
- [ ] 관리자 페이지 접속 확인 (/dashboard/admin)
- [ ] 랜딩페이지 기능 테스트 (/dashboard/admin/landing-pages)
- [ ] SMS 발송 기능 테스트 (/dashboard/admin/sms)
- [ ] API 엔드포인트 작동 확인 (/api/*)

---

## ⚠️ 알려진 제한사항

### 1. Report 페이지 비활성화
`/report/[id]` 페이지는 동적 라우트 문제로 인해 임시로 비활성화되었습니다.

**해결 방법**:
1. 정적 생성 (generateStaticParams) 추가
2. 클라이언트 사이드 렌더링으로 전환
3. 별도의 서버리스 함수로 분리

**파일 위치**: `src/app/_report_disabled/[id]/page.tsx`

### 2. 메모리 기반 데이터 저장
현재 API는 메모리에 데이터를 저장하므로, 배포 후 데이터가 유지되지 않습니다.

**프로덕션 배포 전 필수 작업**:
- Cloudflare D1 데이터베이스 연동
- Prisma 스키마 마이그레이션
- API 라우트 데이터베이스 연결

### 3. SMS API 시뮬레이션
실제 SMS는 발송되지 않으며, 시뮬레이션 모드로 동작합니다.

**실제 SMS 발송을 위해**:
- Aligo, NHN Cloud 등 SMS 서비스 API 연동
- 환경 변수에 API 키 설정
- API 라우트에 실제 발송 로직 추가

---

## 🔄 자동 배포 설정

GitHub 저장소에 푸시할 때마다 자동으로 배포되도록 설정하려면:

### Cloudflare Pages 대시보드에서:
1. 프로젝트 선택: **superplacestudy**
2. **Settings** → **Builds & deployments**
3. **Enable automatic deployments** 활성화
4. 배포할 브랜치 선택: `main` 또는 `genspark_ai_developer`

이제 GitHub에 푸시할 때마다 자동으로 빌드 및 배포됩니다!

---

## 🐛 문제 해결

### 빌드 실패
```
Error: Failed to produce a Cloudflare Pages build
```

**해결방법**:
- 모든 API 라우트에 `export const runtime = 'edge';`가 있는지 확인
- `npm run pages:build` 로컬에서 빌드 테스트
- 빌드 로그 확인: `.vercel/output/static/_worker.js/nop-build-log.json`

### 배포 후 404 오류
```
404 Not Found
```

**해결방법**:
- `_routes.json` 파일이 올바르게 설정되었는지 확인
- Build output directory가 `.vercel/output/static`인지 확인
- Cloudflare Pages 대시보드에서 Functions 로그 확인

### API 라우트 작동 안 함
```
500 Internal Server Error
```

**해결방법**:
- Cloudflare Pages Functions 로그 확인
- Edge Runtime 호환성 확인 (Node.js API 사용 시 문제 발생 가능)
- 환경 변수 설정 확인

---

## 📞 지원

- **Cloudflare 문서**: https://developers.cloudflare.com/pages/
- **Next.js on Cloudflare**: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- **@cloudflare/next-on-pages**: https://github.com/cloudflare/next-on-pages

---

## ✅ 배포 완료 후

배포가 완료되면 다음 URL에서 서비스에 접속할 수 있습니다:

- **프로덕션**: https://superplacestudy.pages.dev
- **관리자**: https://superplacestudy.pages.dev/dashboard/admin
- **랜딩페이지**: https://superplacestudy.pages.dev/dashboard/admin/landing-pages
- **SMS 발송**: https://superplacestudy.pages.dev/dashboard/admin/sms

**커스텀 도메인 설정** (선택):
1. Cloudflare Pages 대시보드 → **Custom domains**
2. **Set up a custom domain** 클릭
3. 도메인 입력 및 DNS 설정 완료

---

**작성일**: 2026-02-17  
**버전**: v1.0.0  
**빌드 상태**: ✅ 성공 (14 edge functions, 128 static routes)
