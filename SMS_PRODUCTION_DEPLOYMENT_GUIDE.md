# SMS 시스템 프로덕션 배포 가이드

## 🚨 중요 알림

현재 Next.js가 `output: 'export'` 모드로 설정되어 있어, `src/app/api` 디렉토리의 API 라우트가 빌드되지 않습니다.
API 기능을 사용하려면 Cloudflare Functions로 마이그레이션해야 합니다.

## ✅ 완료된 작업

1. ✅ SMS 발신번호 등록 시스템 프론트엔드
2. ✅ 관리자 승인 페이지 프론트엔드
3. ✅ SOLAPI 통합 API 로직
4. ✅ 모든 필요한 API 엔드포인트 구현

## 🔧 배포를 위한 선택지

### 옵션 1: Cloudflare Functions로 마이그레이션 (권장)

API 라우트를 `functions/api/` 디렉토리로 이동:

```
functions/api/admin/sms/
├── balance.ts
├── history.ts
├── send.ts
├── senders.ts
├── stats.ts
├── templates.ts
└── registration/
    ├── index.ts
    ├── all.ts
    └── [id]/
        ├── approve.ts
        └── reject.ts
```

Cloudflare Functions는 파일 기반 라우팅을 사용하므로 각 파일이 엔드포인트가 됩니다.

### 옵션 2: Next.js API Routes 사용

`next.config.ts`에서 `output: 'export'`를 제거하고 일반 Next.js 배포:

```typescript
const nextConfig: NextConfig = {
  // output: 'export', // 이 줄 제거
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

그러나 이 경우 Cloudflare Pages의 정적 호스팅 이점을 잃게 됩니다.

## 📦 현재 상태

- ✅ 프론트엔드 페이지: 완성
- ✅ API 로직: 완성
- ⚠️  API 배포: Cloudflare Functions로 마이그레이션 필요

## 🚀 즉시 배포 방법

### 방법 1: 프론트엔드만 먼저 배포

```bash
# API routes를 임시로 제외하고 빌드
mv src/app/api src/app/_api_temp
npm run build
npx wrangler pages deploy out --project-name=superplacestudy --branch=main
mv src/app/_api_temp src/app/api
```

이렇게 하면 프론트엔드 페이지는 정상적으로 배포되며, API는 나중에 Cloudflare Functions로 추가할 수 있습니다.

### 방법 2: 전체 마이그레이션

1. `src/app/api/` 의 모든 파일을 `functions/api/`로 이동
2. 파일 구조 조정 (Cloudflare Functions 형식에 맞춤)
3. 빌드 및 배포

## 🔑 환경 변수 설정

Cloudflare Pages 설정에서 다음 환경 변수를 추가해야 합니다:

```
SOLAPI_API_KEY=your_solapi_key
SOLAPI_API_SECRET=your_solapi_secret
```

## 📝 다음 단계

1. API 라우트를 Cloudflare Functions로 마이그레이션
2. R2 바인딩 설정 (SMS_DOCUMENTS)
3. D1 데이터베이스 스키마 적용
4. 환경 변수 설정
5. 프로덕션 배포

## 💡 추천 방법

가장 빠르게 배포하려면:

1. **지금 당장**: 프론트엔드만 배포 (UI 확인 가능)
2. **다음 단계**: API를 Cloudflare Functions로 마이그레이션
3. **최종**: 전체 시스템 통합 테스트

---

**작성일**: 2026-02-19
**작성자**: AI Assistant
