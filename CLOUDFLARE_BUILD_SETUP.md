# Cloudflare Pages 빌드 설정 가이드

## 🚨 중요: 빌드 명령 설정

현재 로그인 API가 작동하지 않는 이유는 **Cloudflare Pages 대시보드의 빌드 설정**이 잘못되어 있기 때문입니다.

### 현재 문제

- **현재 빌드 명령**: `npm run build`
- **현재 출력 디렉터리**: `.next`
- **결과**: Next.js API Routes가 정적 빌드되어 작동하지 않음 (404 에러)

### 해결 방법

Cloudflare Pages Dashboard에서 빌드 설정을 변경해야 합니다.

#### 1단계: Cloudflare Dashboard 접속

1. https://dash.cloudflare.com/ 로그인
2. **Workers & Pages** 선택
3. **superplacestudy** 프로젝트 선택
4. **Settings** 탭 클릭
5. **Builds & deployments** 섹션으로 이동

#### 2단계: 빌드 설정 변경

**변경 전:**
```
Build command: npm run build
Build output directory: .next
```

**변경 후 (옵션 1 - 권장):**
```
Build command: npx @cloudflare/next-on-pages
Build output directory: .vercel/output/static
```

**변경 후 (옵션 2 - 간단):**
```
Build command: echo "Using functions only" && mkdir -p .vercel/output/static && cp -r functions .vercel/output/static/_functions
Build output directory: .vercel/output/static
```

#### 3단계: 재배포

1. **Settings** > **Builds & deployments**에서 설정 저장
2. **Deployments** 탭으로 이동
3. 최신 배포 옆의 **Retry deployment** 버튼 클릭
4. 또는 새 커밋을 푸시하여 자동 배포 트리거

### 현재 API 엔드포인트

로그인 API는 **Cloudflare Pages Functions**로 구현되어 있습니다:

```
functions/api/auth/login.ts  -> /api/auth/login
functions/api/auth/signup.ts -> /api/auth/signup
```

### 테스트 계정

빌드 설정 변경 후 다음 계정으로 로그인 가능합니다:

1. **관리자**: admin@superplace.com / admin1234
2. **원장**: director@superplace.com / director1234  
3. **선생님**: teacher@superplace.com / teacher1234
4. **테스트**: test@test.com / test1234

### 테스트 방법

빌드 설정 변경 및 재배포 후:

```bash
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'
```

예상 응답:
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "token": "1.admin@superplace.com.SUPER_ADMIN.1234567890",
    "user": {
      "id": "1",
      "email": "admin@superplace.com",
      "name": "슈퍼플레이스 관리자",
      "role": "SUPER_ADMIN",
      "academyId": null
    }
  }
}
```

## 📝 추가 정보

### Cloudflare Pages Functions 작동 방식

- `functions/` 디렉터리의 파일이 자동으로 API 엔드포인트로 매핑됩니다
- `functions/api/auth/login.ts` → `/api/auth/login`
- TypeScript 파일이 자동으로 컴파일됩니다
- 별도의 빌드 과정 없이 작동합니다

### Next.js API Routes vs Cloudflare Functions

| 항목 | Next.js API Routes | Cloudflare Functions |
|------|-------------------|---------------------|
| 위치 | `src/app/api/` | `functions/` |
| 런타임 | Node.js | Cloudflare Workers |
| 배포 | 서버 필요 | 서버리스 |
| Cloudflare Pages | ❌ 작동 안 함 | ✅ 네이티브 지원 |

### 현재 상태

- ✅ Cloudflare Functions: 준비 완료 (하드코딩 테스트 계정)
- ❌ Cloudflare Pages 빌드 설정: 변경 필요
- ⏳ 로그인 기능: 빌드 설정 변경 후 작동

## 🔧 문제 해결

### 여전히 404 에러가 발생하는 경우

1. Cloudflare Dashboard에서 최신 배포 로그 확인
2. `functions/` 디렉터리가 배포에 포함되었는지 확인
3. 빌드 출력 디렉터리에 `_functions/` 폴더가 있는지 확인

### 500 에러가 발생하는 경우

1. Cloudflare Dashboard > 해당 프로젝트 > **Functions** 탭
2. 실시간 로그 확인
3. TypeScript 컴파일 오류 확인

## 📞 지원

빌드 설정 변경 후에도 문제가 지속되면:

1. Cloudflare Dashboard의 배포 로그 확인
2. Functions 탭에서 실시간 로그 확인
3. 이 문서의 설정과 현재 설정 비교
