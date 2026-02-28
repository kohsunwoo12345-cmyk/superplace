# Cloudflare Pages 배포 설정

## ⚠️ 중요: 빌드 설정 변경 필요

이 프로젝트는 Next.js API Routes를 사용하므로 **@cloudflare/next-on-pages** 어댑터를 사용해야 합니다.

## Cloudflare Pages Dashboard 설정

Cloudflare Pages 대시보드에서 다음 설정을 적용하세요:

### 1. Build Configuration
- **Framework preset**: `Next.js (Static HTML Export)` → **None** 으로 변경
- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`

### 2. Environment Variables
다음 환경 변수들을 설정해야 합니다:

```
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=https://superplacestudy.pages.dev
GOOGLE_GEMINI_API_KEY=<your-api-key>
SOLAPI_API_Key =<your-solapi-key>
SOLAPI_API_SECRET=<your-solapi-secret>
```

⚠️ **주의**: `SOLAPI_API_Key ` 변수명에 공백이 있습니다 (의도된 것임)

### 3. Node.js 버전
- **NODE_VERSION**: `20` 이상

## 빌드 프로세스

```bash
# 로컬 개발
npm run dev

# Cloudflare Pages용 빌드 (로컬 테스트)
npm run pages:build

# 빌드 결과 미리보기
npm run preview

# 수동 배포 (선택사항)
npm run deploy
```

## 문제 해결

### "Application error: a client-side exception has occurred" 오류

이 오류는 다음 원인으로 발생할 수 있습니다:

1. **잘못된 빌드 설정**
   - `output: 'export'`를 사용하면 API Routes가 작동하지 않음
   - 해결: `@cloudflare/next-on-pages` 사용

2. **잘못된 출력 디렉토리**
   - `out` 디렉토리 대신 `.vercel/output/static` 사용 필요

3. **CSS 404 에러**
   - 빌드 명령어가 `next build` 대신 `npx @cloudflare/next-on-pages` 사용 필요

### Cloudflare Pages 빌드 로그 확인

1. Cloudflare Dashboard → Pages → superplacestudy
2. 최신 배포 클릭
3. "View build log" 확인
4. 오류 메시지 확인

## 현재 설정 상태

- ✅ `next.config.ts`: `output: 'export'` 제거 완료
- ✅ `package.json`: `pages:build` 스크립트 추가 완료
- ✅ `wrangler.toml`: 출력 디렉토리 `.vercel/output/static`으로 변경 완료
- ⚠️ **Cloudflare Pages Dashboard 설정 변경 필요**

## 배포 후 확인사항

```bash
# 메인 페이지
curl -I https://superplacestudy.pages.dev/

# API 엔드포인트 테스트
curl https://superplacestudy.pages.dev/api/kakao/channels

# 카카오 채널 페이지
curl -I https://superplacestudy.pages.dev/dashboard/kakao-channel
```

모든 요청이 200 또는 적절한 상태 코드를 반환해야 합니다.

## 참고 문서

- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Cloudflare Pages with Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
