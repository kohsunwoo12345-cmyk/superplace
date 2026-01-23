# Cloudflare Worker DB Proxy 빠른 시작

## 🚀 5분 안에 설정하기

### 1. Worker 설치 및 배포

```bash
cd cloudflare-worker

# 패키지 설치
npm install

# Cloudflare 로그인
wrangler login

# D1 데이터베이스 생성
wrangler d1 create superplace-db

# ✅ database_id 복사 → wrangler.toml에 입력

# API 토큰 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ✅ 토큰 복사 → wrangler.toml의 API_SECRET_TOKEN에 입력

# 스키마 적용
wrangler d1 execute superplace-db --file=./schema.sql

# 배포
npm run deploy

# ✅ Worker URL 저장
```

### 2. Vercel 환경 변수

```
CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev
CLOUDFLARE_WORKER_TOKEN=your-token-here
```

### 3. Next.js에서 사용

```typescript
import { createWorkerDBClient } from '@/lib/worker-db-client';

const db = createWorkerDBClient();
const students = await db.getStudents(academyId);
```

## ✅ 완료!

자세한 내용은 `CLOUDFLARE_WORKER_SETUP.md`를 참고하세요.
