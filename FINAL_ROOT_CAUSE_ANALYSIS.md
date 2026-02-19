# 🎯 최종 근본 원인 진단 및 해결

## 📅 작성 시간
**2026-02-19 00:37 KST**

---

## 🔍 문제 진단 과정

### 1단계: 증상 확인
```bash
# 프로덕션 테스트
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'
# 결과: 500 Internal Server Error ❌

# 프리뷰 테스트
curl -X POST https://791810fd.superplacestudy.pages.dev/api/auth/login \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'
# 결과: 200 OK, 로그인 성공 ✅
```

**발견**: 프리뷰는 정상 작동, 프로덕션만 실패

---

### 2단계: 코드 차이 분석

#### 프리뷰가 사용하는 코드
```typescript
// functions/api/auth/login.ts
import { compare } from 'bcrypt-ts';

export async function onRequestPost(context: { 
  request: Request; 
  env: Env;
}) {
  const { request, env } = context;
  const db = env.DB;  // ✅ Cloudflare D1 바인딩 정상 작동
  
  const user = await db.prepare('SELECT * FROM User WHERE email = ?')
    .bind(email)
    .first();
    
  const isValid = await compare(password, user.password);
  // ✅ bcrypt-ts로 비밀번호 검증 성공
}
```

#### 프로덕션이 시도한 코드
```typescript
// src/app/api/auth/login/route.ts (삭제됨)
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // @ts-ignore
  const env = process.env as any;
  const DB = env.DB || (globalThis as any).DB;
  // ❌ D1 바인딩을 찾을 수 없음 - Next.js API Routes는 
  //    Cloudflare Pages Functions 컨텍스트에 접근 불가
}
```

---

## 🐛 근본 원인

### **Next.js API Routes와 Cloudflare Pages Functions의 충돌**

| 항목 | Next.js API Routes | Cloudflare Functions |
|------|-------------------|----------------------|
| **경로** | `src/app/api/*/route.ts` | `functions/api/*.ts` |
| **실행 환경** | Next.js 런타임 | Cloudflare Workers 런타임 |
| **D1 바인딩** | ❌ 접근 불가 | ✅ `env.DB`로 접근 가능 |
| **정적 내보내기** | ❌ 호환 안됨 | ✅ 완벽 호환 |
| **Cloudflare 통합** | ❌ 복잡함 | ✅ 네이티브 지원 |

### 왜 프리뷰는 작동했는가?
프리뷰 배포는 **이전 커밋**(Next.js API Routes 추가 전)을 사용했고, 해당 버전은 `functions/` 디렉토리만 사용했기 때문입니다.

### 왜 프로덕션은 실패했는가?
프로덕션 배포는 **최신 커밋**을 사용했고:
1. `next.config.ts`에서 `output: 'export'`를 제거함
2. Next.js API Routes를 추가함 (`src/app/api/auth/*/route.ts`)
3. Next.js API Routes는 Cloudflare D1 바인딩에 접근할 수 없음
4. `env.DB`가 `undefined`여서 500 에러 발생

---

## ✅ 해결 방법

### 수정 사항

#### 1. Next.js API Routes 완전 제거
```bash
# 삭제된 파일들
src/app/api/auth/login/route.ts    # Next.js API Route (사용 안함)
src/app/api/auth/signup/route.ts   # Next.js API Route (사용 안함)
```

#### 2. `next.config.ts` - 정적 내보내기 활성화
```typescript
const nextConfig: NextConfig = {
  output: 'export', // ✅ 정적 HTML/CSS/JS만 생성
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

#### 3. `package.json` - 빌드 스크립트 간소화
```json
{
  "scripts": {
    "build": "next build",  // ✅ 단순 정적 빌드
    "pages:build": "next build"  // ✅ @cloudflare/next-on-pages 제거
  }
}
```

#### 4. `cloudflare-build.sh` - Functions 복사
```bash
#!/bin/bash
set -e

echo "🚀 Starting Cloudflare Pages build..."

# Next.js 정적 빌드
npm run build

# Functions 복사
cp -r functions out/functions

echo "🎉 Build complete!"
```

---

## 📊 아키텍처 변경

### Before (실패한 구조)
```
프로덕션 배포
├── out/                          # Next.js 빌드 출력
│   ├── _next/                    # 정적 에셋
│   └── *.html                    # 정적 페이지
├── src/app/api/auth/*/route.ts   # ❌ Next.js API Routes (D1 접근 불가)
└── functions/api/auth/*.ts       # 사용되지 않음
```

### After (성공한 구조)
```
프로덕션 배포
├── out/                          # Next.js 빌드 출력
│   ├── _next/                    # 정적 에셋
│   ├── *.html                    # 정적 페이지
│   └── functions/                # ✅ Cloudflare Functions
│       └── api/
│           ├── auth/
│           │   ├── login.ts      # ✅ Cloudflare Function (D1 접근 가능)
│           │   └── signup.ts     # ✅ Cloudflare Function
│           ├── admin/            # 기타 API 엔드포인트
│           └── ...
```

---

## 🔧 기술적 세부사항

### Cloudflare Pages Functions 작동 방식
1. **자동 라우팅**: `functions/api/auth/login.ts` → `/api/auth/login`
2. **D1 바인딩**: `wrangler.toml`에 정의된 DB가 `env.DB`로 자동 주입
3. **Edge Runtime**: Cloudflare Workers 런타임에서 실행
4. **bcrypt 지원**: `bcrypt-ts` 패키지가 Workers에서 작동

### Next.js 정적 내보내기 (`output: 'export'`)
1. **빌드 결과**: HTML, CSS, JS 파일만 생성
2. **API Routes 제외**: 서버 사이드 코드는 빌드되지 않음
3. **완벽한 정적 호스팅**: Cloudflare Pages와 100% 호환

### 두 시스템의 조합
```
사용자 요청
    ↓
Cloudflare Pages
    ├─→ /login → Next.js 정적 HTML (out/login.html)
    ├─→ /dashboard → Next.js 정적 HTML (out/dashboard.html)
    └─→ /api/auth/login → Cloudflare Function (out/functions/api/auth/login.ts)
```

---

## 🧪 검증 방법

### Cloudflare 대시보드에서 확인
1. https://dash.cloudflare.com/ 접속
2. Workers & Pages → superplacestudy 선택
3. Deployments 탭에서 최신 배포 확인
4. "View build log" 클릭

**기대 로그**:
```
🚀 Starting Cloudflare Pages build...
📦 Node.js version: v20.19.6
🔨 Building Next.js static site...
✅ Build completed successfully!
🔧 Copying Cloudflare Pages Functions...
✅ Functions copied to out/functions/
📁 Functions structure:
  out/functions/api/auth/login.ts
  out/functions/api/auth/signup.ts
🎉 Cloudflare Pages build complete!
```

### API 엔드포인트 테스트
```bash
# 1. Login API (유효하지 않은 자격증명 - 401 기대)
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}'

# 기대 응답:
# {"success":false,"message":"이메일 또는 비밀번호가 올바르지 않습니다"}
# HTTP Status: 401

# 2. Login API (유효한 자격증명 - 200 기대)
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'

# 기대 응답:
# {"success":true,"message":"로그인 성공","data":{...}}
# HTTP Status: 200
```

### 브라우저 테스트 (최종 검증)
1. **시크릿 모드**로 브라우저 열기
2. https://superplacestudy.pages.dev/login/ 접속
3. 테스트 계정으로 로그인:
   - `admin@superplace.com` / `admin1234`
   - `director@superplace.com` / `director1234`
4. **성공 시**: 대시보드로 리다이렉트 ✅
5. **실패 시**: F12 콘솔에서 에러 확인

---

## 📈 예상 결과

### Before (커밋 109b9f6 이전)
| 테스트 | 프리뷰 | 프로덕션 |
|--------|--------|----------|
| `/api/auth/login` POST | ✅ 200 | ❌ 500 |
| `/api/auth/signup` POST | ✅ 200 | ❌ 500 |
| 브라우저 로그인 | ✅ 성공 | ❌ 실패 |

### After (커밋 c972b39 배포 후)
| 테스트 | 프리뷰 | 프로덕션 |
|--------|--------|----------|
| `/api/auth/login` POST | ✅ 200 | ✅ 200 |
| `/api/auth/signup` POST | ✅ 200 | ✅ 200 |
| 브라우저 로그인 | ✅ 성공 | ✅ 성공 |

---

## 🎯 핵심 교훈

### 1. Cloudflare Pages는 두 가지 시스템의 조합
- **정적 에셋**: Next.js `output: 'export'`로 생성
- **API 엔드포인트**: `functions/` 디렉토리의 Cloudflare Functions

### 2. Next.js API Routes는 Cloudflare와 호환되지 않음
- `src/app/api/*/route.ts`는 Cloudflare D1에 접근 불가
- `@cloudflare/next-on-pages` 어댑터도 완벽하지 않음
- **해결책**: `functions/` 디렉토리 사용

### 3. 프리뷰와 프로덕션은 다른 커밋을 사용할 수 있음
- 프리뷰: 특정 커밋 ID (예: 791810fd)
- 프로덕션: 자동 배포 (최신 main 브랜치)
- **주의**: 프리뷰가 작동한다고 프로덕션도 작동하는 것은 아님

### 4. 디버깅 방법론
```bash
# 1. 두 환경 비교
curl 프리뷰_URL
curl 프로덕션_URL

# 2. 응답 차이 확인
- 프리뷰: 200 OK + JSON 데이터
- 프로덕션: 500 Error

# 3. 코드 차이 분석
- 프리뷰가 사용하는 코드 확인
- 프로덕션이 사용하는 코드 확인

# 4. 근본 원인 파악
- 환경 차이 (런타임, 바인딩 등)
- 아키텍처 선택 (API Routes vs Functions)
```

---

## 📦 최종 배포 상태

### Git 커밋 정보
```
Commit: c972b39
Branch: main
Time: 2026-02-19 00:37 KST
Message: fix: 정적 내보내기 + Cloudflare Functions로 완전 전환
```

### 변경된 파일
```
✅ Modified:
- next.config.ts (output: 'export' 추가)
- package.json (빌드 스크립트 간소화)
- cloudflare-build.sh (정적 빌드 + Functions 복사)

❌ Deleted:
- src/app/api/auth/login/route.ts
- src/app/api/auth/signup/route.ts

✅ Kept (핵심):
- functions/api/auth/login.ts
- functions/api/auth/signup.ts
- functions/api/admin/*.ts
- functions/api/classes/*.ts
- ... (모든 API 엔드포인트)
```

### Cloudflare Pages 빌드 설정
```
프레임워크 미리 설정: Next.js
빌드 명령: bash cloudflare-build.sh
빌드 출력 디렉터리: out
루트 디렉터리: /
```

### 환경 변수 (Cloudflare 대시보드)
```
GOOGLE_GEMINI_API_KEY=<your-key>
```

### D1 바인딩 (wrangler.toml)
```toml
[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "8c106540-21b4-4fa9-8879-c4956e459ca1"
```

---

## ⏰ 타임라인

| 시간 | 이벤트 |
|------|--------|
| 00:35 | 문제 진단 시작 - 프로덕션 500 에러 확인 |
| 00:36 | 프리뷰와 프로덕션 비교 - 코드 차이 발견 |
| 00:37 | 근본 원인 파악 - Next.js API Routes와 Functions 충돌 |
| 00:37 | 해결책 적용 - Next.js API Routes 제거, 정적 내보내기 |
| 00:37 | Git 커밋 및 푸시 (c972b39) |
| 00:39 | **Cloudflare Pages 빌드 시작 (예상)** |
| 00:41 | **배포 완료 (예상)** ✅ |

---

## 🚀 다음 단계

### 즉시 (00:41 KST 이후)
1. **Cloudflare 대시보드 확인**
   - https://dash.cloudflare.com/
   - Workers & Pages → superplacestudy
   - Deployments 탭에서 빌드 로그 확인

2. **API 테스트**
   ```bash
   cd /home/user/webapp
   node check_deployment_diff.js
   ```

3. **브라우저 로그인 테스트**
   - 시크릿 모드로 https://superplacestudy.pages.dev/login 접속
   - `admin@superplace.com` / `admin1234` 로그인
   - 대시보드 정상 표시 확인

### 성공 시
- ✅ 문제 완전 해결
- ✅ 프리뷰와 프로덕션 동일하게 작동
- ✅ 모든 API 엔드포인트 정상

### 실패 시
- Cloudflare 빌드 로그 확인
- F12 콘솔 에러 메시지 확인
- `wrangler.toml` D1 바인딩 확인

---

## 📚 참고 문서

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare D1 Database](https://developers.cloudflare.com/d1/)
- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [bcrypt-ts Package](https://www.npmjs.com/package/bcrypt-ts)

---

**작성자**: AI Assistant  
**최종 수정**: 2026-02-19 00:37 KST  
**상태**: 🟡 배포 진행 중 → 🟢 00:41 KST 테스트 가능

---

## 💡 요약

**문제**: 프로덕션에서 Next.js API Routes가 Cloudflare D1에 접근하지 못해 500 에러 발생

**원인**: Next.js API Routes와 Cloudflare Pages Functions는 다른 런타임 환경

**해결**: Next.js는 정적 페이지만 생성하고, 모든 API는 Cloudflare Functions로 처리

**결과**: 프리뷰와 프로덕션 모두 `functions/` 디렉토리 사용 → 완전히 동일한 동작

**핵심**: **Cloudflare Pages에서는 functions/ 디렉토리만 사용하라!** 🎯
