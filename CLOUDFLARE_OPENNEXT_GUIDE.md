# Cloudflare Pages 배포 가이드 (OpenNext 사용)

## 🎯 이 프로젝트는 OpenNext를 사용하여 Cloudflare Pages에 배포됩니다

### 📦 설치된 패키지
- `@opennextjs/cloudflare`: Next.js를 Cloudflare Workers로 변환
- Prisma: 외부 PostgreSQL 데이터베이스 사용 (Neon/Supabase)
- NextAuth: 그대로 작동

### 🔧 빌드 명령
```bash
npm run build
```

이 명령은 다음을 수행합니다:
1. `prisma generate` - Prisma 클라이언트 생성
2. `next build` - Next.js 빌드
3. `npx @opennextjs/cloudflare` - Cloudflare Workers 형식으로 변환

빌드 결과는 `.open-next/worker` 디렉토리에 생성됩니다.

### 🌐 Cloudflare Pages 설정

#### 1. 프로젝트 설정
- **Build command**: `npm run build`
- **Build output directory**: `.open-next/worker`
- **Root directory**: `/`
- **Node version**: `20`

#### 2. 환경 변수 (Environment Variables)

다음 환경 변수를 Cloudflare Pages 설정에 추가하세요:

```
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
NEXTAUTH_URL=https://your-project.pages.dev
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_GEMINI_API_KEY=your-api-key
GOOGLE_API_KEY=your-api-key
```

⚠️ **중요**: 
- `DATABASE_URL`은 Neon 또는 Supabase의 외부 연결 URL을 사용하세요
- Cloudflare D1은 이 프로젝트와 호환되지 않습니다 (Prisma 사용 중)

#### 3. Node.js 호환성 플래그

Cloudflare에서 Node.js API를 사용하려면 호환성 플래그가 필요합니다.
`wrangler.toml` 파일에 이미 설정되어 있습니다:

```toml
compatibility_flags = ["nodejs_compat"]
```

### 🚀 배포 방법

#### 방법 1: GitHub 자동 배포 (권장)
1. Cloudflare Pages에서 GitHub 저장소 연결
2. 위의 빌드 설정 입력
3. 환경 변수 설정
4. GitHub에 푸시하면 자동 배포

#### 방법 2: Wrangler CLI로 수동 배포
```bash
npm run build
npx wrangler pages deploy .open-next/worker --project-name=superplace
```

### 📊 지원되는 기능

✅ **완벽 지원**:
- Next.js App Router
- React Server Components
- API Routes
- Static 페이지
- Dynamic 페이지
- Image Optimization (unoptimized)
- 환경 변수

⚠️ **제한적 지원**:
- Prisma (외부 DB 연결로 작동)
- NextAuth (세션 저장소 필요시 외부 DB 사용)
- Middleware (Edge Runtime에서 작동)

❌ **지원 안 됨**:
- Cloudflare D1 (Prisma 대신 사용하려면 전체 재작성 필요)
- 로컬 파일 시스템 접근
- Node.js 네이티브 모듈 (bcrypt 등)

### 🔍 로컬 테스트

```bash
npm run preview
```

이 명령은 Cloudflare Workers 환경을 로컬에서 시뮬레이션합니다.

### ⚡ 성능 최적화

1. **Edge Runtime 사용**: API Routes에서 `export const runtime = 'edge'` 추가
2. **정적 페이지**: 가능한 페이지는 Static으로 빌드
3. **이미지 최적화**: 이미 `unoptimized: true`로 설정됨
4. **코드 스플리팅**: Next.js가 자동으로 처리

### 🐛 트러블슈팅

#### 빌드 실패
- `npm run build` 로컬에서 먼저 테스트
- 빌드 로그에서 에러 메시지 확인
- Node.js 버전 20 사용 확인

#### 런타임 에러
- Cloudflare Pages 대시보드에서 실시간 로그 확인
- `wrangler pages deployment tail` 명령으로 로그 모니터링

#### 데이터베이스 연결 실패
- DATABASE_URL이 올바른지 확인
- Neon/Supabase에서 외부 연결 허용 확인
- 방화벽 규칙 확인

### 📚 참고 자료

- OpenNext 문서: https://opennext.js.org/cloudflare
- Cloudflare Pages 문서: https://developers.cloudflare.com/pages
- Next.js on Cloudflare: https://developers.cloudflare.com/pages/framework-guides/nextjs/

### ⚠️ 주의사항

1. **데이터베이스**: 반드시 외부 PostgreSQL 사용 (Neon/Supabase 권장)
2. **세션**: NextAuth 세션도 데이터베이스에 저장
3. **파일 업로드**: Cloudflare R2 또는 외부 스토리지 사용
4. **환경 변수**: Production과 Preview 환경 모두 설정 필요
