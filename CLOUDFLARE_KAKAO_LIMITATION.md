# ⚠️ 카카오 알림톡 기능 - CloudFlare Pages 제한 사항

## 문제

CloudFlare Pages는 **Edge Runtime만 지원**하며, Solapi SDK는 Node.js 런타임에서만 작동합니다.

Solapi SDK가 사용하는 Node.js 모듈들:
- `crypto`
- `fs`
- `url`
- 기타 Node.js 전용 모듈

이로 인해 CloudFlare Pages 배포 시 다음 오류가 발생합니다:
```
Module not found: Can't resolve 'crypto'
```

## 해결 방법

### 옵션 1: Vercel 배포 (권장 ✅)

Vercel은 Node.js 런타임을 완전히 지원하므로 카카오 알림톡 기능을 문제없이 사용할 수 있습니다.

#### 설정 방법:

1. **next.config.ts 수정**
   ```typescript
   const nextConfig: NextConfig = {
     // output: 'export', 제거 또는 주석 처리
     // ... 나머지 설정
   };
   ```

2. **Vercel에 배포**
   ```bash
   vercel --prod
   ```

3. **환경 변수 설정**
   ```env
   SOLAPI_API_KEY=your-api-key
   SOLAPI_API_SECRET=your-api-secret
   SOLAPI_CHANNEL_ID=@your-channel-id
   SOLAPI_SENDER_NUMBER=01012345678
   ```

### 옵션 2: CloudFlare Workers (복잡)

CloudFlare Workers를 사용하여 별도의 API 서버를 구축할 수 있습니다.

#### 장점:
- CloudFlare Pages 프론트엔드 유지 가능
- CloudFlare 생태계 내에서 완결

#### 단점:
- 별도의 Workers 프로젝트 필요
- Solapi SDK 재구현 필요 (Fetch API 사용)
- 복잡한 설정

### 옵션 3: 하이브리드 배포

- **프론트엔드**: CloudFlare Pages
- **API**: Vercel Serverless Functions

#### 설정:
```env
# CloudFlare Pages 환경 변수
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

프론트엔드에서 Vercel API를 호출하도록 수정:
```typescript
// 기존
const response = await fetch('/api/kakao/templates');

// 수정
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kakao/templates`);
```

## 현재 상태

현재 프로젝트는 **CloudFlare Pages 배포를 우선**으로 설정되어 있습니다.

카카오 알림톡 기능을 사용하려면:
1. 별도의 Vercel 프로젝트로 배포
2. CloudFlare Pages에서는 카카오 알림톡 메뉴를 숨김 처리

## 권장 사항

### 프로덕션 환경

**Vercel 배포**를 권장합니다:
- ✅ 모든 기능 정상 작동
- ✅ 간단한 설정
- ✅ 자동 스케일링
- ✅ 무료 티어 사용 가능

### 개발 환경

```bash
# next.config.ts에서 output: 'export' 주석 처리
npm run dev
```

로컬 개발 시에는 모든 기능이 정상 작동합니다.

## 파일 위치

### UI 컴포넌트 (CloudFlare Pages에서 사용 가능)
- `src/components/kakao/KakaoTemplatePreview.tsx`
- `src/components/kakao/KakaoTemplateForm.tsx`
- `src/components/kakao/KakaoTemplateList.tsx`

### API (Vercel에서만 사용 가능)
- ~~`src/app/api/kakao/*`~~ (CloudFlare Pages 빌드 시 제외됨)
- `src/lib/solapi.ts` (Node.js 런타임 필요)

### 페이지
- `src/app/dashboard/kakao/templates/*` (CloudFlare에서는 API 호출 실패)

## 빠른 시작 (Vercel)

```bash
# 1. next.config.ts 수정
#    output: 'export' 주석 처리

# 2. API 라우트 복원 (필요 시)
git checkout origin/genspark_ai_developer -- src/app/api/kakao

# 3. Vercel 배포
vercel login
vercel --prod

# 4. 환경 변수 설정
vercel env add SOLAPI_API_KEY
vercel env add SOLAPI_API_SECRET
vercel env add SOLAPI_CHANNEL_ID
vercel env add SOLAPI_SENDER_NUMBER

# 5. 재배포
vercel --prod
```

## 결론

**카카오 알림톡 기능은 Vercel 배포 시에만 완전히 작동합니다.**

CloudFlare Pages는 정적 사이트 호스팅에 최적화되어 있으며, Node.js 런타임이 필요한 기능은 제한적입니다.

---

**작성일**: 2026년 3월 7일  
**관련 PR**: #21
