# 카카오 알림톡 기능 사용을 위한 배포 가이드

카카오 알림톡 템플릿 관리 시스템은 API 라우트를 사용하므로, 다음 두 가지 방법 중 하나를 선택해야 합니다:

## 옵션 1: Vercel 배포 (권장)

API 라우트를 완전히 지원하는 Vercel에 배포하세요.

### 설정 방법

1. **next.config.ts 수정**
   ```typescript
   // output: 'export' 제거 또는 주석 처리
   const nextConfig: NextConfig = {
     // output: 'export', // 이 줄을 제거하거나 주석 처리
     trailingSlash: true,
     images: {
       unoptimized: true,
     },
     // ... 나머지 설정
   };
   ```

2. **Vercel에 배포**
   ```bash
   vercel --prod
   ```

3. **환경 변수 설정**
   Vercel Dashboard에서 다음 환경 변수 추가:
   - `SOLAPI_API_KEY`
   - `SOLAPI_API_SECRET`
   - `SOLAPI_CHANNEL_ID`
   - `SOLAPI_SENDER_NUMBER`

## 옵션 2: 하이브리드 배포

CloudFlare Pages (프론트엔드) + Vercel Serverless Functions (API)

### 설정 방법

1. **프론트엔드**: CloudFlare Pages에 배포 (현재 설정 유지)
2. **API**: 별도의 Vercel 프로젝트로 배포
3. **API URL 설정**: 프론트엔드에서 API URL 환경 변수 설정

```typescript
// .env
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

## 옵션 3: Cloudflare Workers 사용

Cloudflare Workers를 사용하여 API를 구현할 수 있습니다.

### 설정 방법

1. **functions 디렉토리 생성**
   ```bash
   mkdir -p functions/api/kakao
   ```

2. **Cloudflare Workers 함수 작성**
   각 API 엔드포인트를 `functions/api/...` 경로에 작성

3. **환경 변수 설정**
   CloudFlare Pages Dashboard > Settings > Environment variables

## 빠른 시작 (Vercel 사용)

가장 간단한 방법은 Vercel을 사용하는 것입니다:

```bash
# 1. next.config.ts에서 output: 'export' 제거
# 2. Vercel에 배포
npm install -g vercel
vercel login
vercel --prod

# 3. 환경 변수 설정
vercel env add SOLAPI_API_KEY
vercel env add SOLAPI_API_SECRET
vercel env add SOLAPI_CHANNEL_ID
vercel env add SOLAPI_SENDER_NUMBER

# 4. 재배포
vercel --prod
```

## 로컬 개발

로컬에서 테스트할 때는 `.env.local` 파일에 솔라피 API 키를 설정하고 개발 서버를 실행하세요:

```bash
# .env.local 파일 생성
cat > .env.local << EOF
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_CHANNEL_ID=@your-channel-id
SOLAPI_SENDER_NUMBER=01012345678
EOF

# output: 'export' 주석 처리 후 개발 서버 실행
npm run dev
```

---

**권장 사항**: 카카오 알림톡 기능을 사용하려면 **Vercel 배포**를 권장합니다.
