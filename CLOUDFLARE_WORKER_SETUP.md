# 🚀 Cloudflare Worker + D1 Database 설정 가이드

## 📋 개요

이 시스템은 **Cloudflare Worker를 DB 프록시**로 사용하여 D1 데이터베이스에 접근합니다.  
D1 REST API보다 **훨씬 빠르고 효율적**입니다.

### 아키텍처
```
Next.js (Vercel)
    ↓ fetch
Cloudflare Worker (DB Proxy)
    ↓ D1 Binding (fast!)
Cloudflare D1 Database
```

---

## 🛠️ 설정 방법

### 1. Cloudflare 계정 및 Wrangler 설치

```bash
# Wrangler CLI 설치 (전역)
npm install -g wrangler

# Cloudflare 로그인
wrangler login
```

---

### 2. D1 데이터베이스 생성

```bash
cd cloudflare-worker

# D1 데이터베이스 생성
wrangler d1 create superplace-db
```

**출력 예시:**
```
✅ Successfully created DB 'superplace-db'

[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**⚠️ 중요:** `database_id`를 복사하여 `wrangler.toml`에 입력하세요!

---

### 3. wrangler.toml 수정

```toml
name = "superplace-db-worker"
main = "src/index.ts"
compatibility_date = "2024-01-15"
node_compat = true

# D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "여기에_복사한_database_id_입력"  # ✅ 여기!

# Environment Variables
[vars]
API_SECRET_TOKEN = "your-super-secret-token-here-change-this"  # ✅ 변경 필수!
ALLOWED_ORIGINS = "https://your-domain.vercel.app,http://localhost:3000"
```

**보안 토큰 생성:**
```bash
# 안전한 랜덤 토큰 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 4. 데이터베이스 스키마 적용

```bash
# 로컬에서 테스트
wrangler d1 execute superplace-db --local --file=./schema.sql

# 프로덕션에 적용
wrangler d1 execute superplace-db --file=./schema.sql
```

**확인:**
```bash
# 테이블 목록 확인
wrangler d1 execute superplace-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

### 5. Worker 배포

```bash
# 로컬 개발 서버 (테스트용)
npm run dev

# 프로덕션 배포
npm run deploy
```

**출력 예시:**
```
✨ Successfully published your script to
   https://superplace-db-worker.your-subdomain.workers.dev
```

**⚠️ Worker URL 저장:** 이 URL을 Next.js 환경 변수에 사용합니다!

---

## ⚙️ Next.js 환경 변수 설정

### Vercel 환경 변수 추가

1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables

2. 다음 변수 추가:

```bash
# Cloudflare Worker DB Proxy
CLOUDFLARE_WORKER_URL="https://superplace-db-worker.your-subdomain.workers.dev"
CLOUDFLARE_WORKER_TOKEN="여기에_wrangler.toml의_API_SECRET_TOKEN_입력"
```

3. Production, Preview, Development 모두 체크

4. Save → Redeploy

---

## 🧪 테스트

### 1. Worker Health Check

```bash
# 로컬 테스트
curl -X GET "http://localhost:8787/health" \
  -H "Authorization: Bearer your-token"

# 프로덕션 테스트
curl -X GET "https://your-worker.workers.dev/health" \
  -H "Authorization: Bearer your-token"
```

**응답:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. SQL 쿼리 테스트

```bash
curl -X POST "https://your-worker.workers.dev/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "sql": "SELECT * FROM User WHERE role = ? LIMIT 5",
    "params": ["STUDENT"]
  }'
```

### 3. CRUD 테스트

```bash
# CREATE
curl -X POST "https://your-worker.workers.dev/crud" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "operation": "CREATE",
    "table": "User",
    "data": {
      "email": "test@test.com",
      "name": "Test User",
      "password": "hashed_password",
      "role": "STUDENT"
    }
  }'

# READ
curl -X POST "https://your-worker.workers.dev/crud" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "operation": "READ",
    "table": "User",
    "where": { "role": "STUDENT" },
    "limit": 10
  }'
```

---

## 💻 Next.js에서 사용

### 기본 사용법

```typescript
import { createWorkerDBClient } from '@/lib/worker-db-client';

// 클라이언트 생성
const db = createWorkerDBClient();

// SQL 쿼리
const students = await db.query(
  'SELECT * FROM User WHERE role = ? AND academyId = ?',
  ['STUDENT', academyId]
);

// 단일 결과 조회
const student = await db.queryFirst(
  'SELECT * FROM User WHERE id = ?',
  [studentId]
);

// Write 작업
await db.write(
  'INSERT INTO User (email, name, role) VALUES (?, ?, ?)',
  ['test@test.com', 'Test', 'STUDENT']
);

// CRUD 헬퍼
const result = await db.crud({
  operation: 'CREATE',
  table: 'User',
  data: {
    email: 'test@test.com',
    name: 'Test User',
    role: 'STUDENT',
  },
});

// 편의 메서드
const allStudents = await db.getStudents(academyId);
const oneStudent = await db.getStudent(studentId);
```

### 동기화 시스템에서 사용

```typescript
import { syncStudent } from '@/lib/sync-utils-worker';

// 학생 생성 + 자동 동기화
const result = await syncStudent('CREATE', {
  email: 'student@test.com',
  name: '홍길동',
  password: 'hashed_password',
  grade: '고1',
  academyId: 'academy123',
  approved: true,
});

console.log(result);
// {
//   success: true,
//   operation: 'CREATE',
//   entity: 'STUDENT',
//   localId: 'local_id',
//   externalId: 'worker_db_id',
//   timestamp: Date
// }
```

---

## 🔐 보안

### 1. API 토큰 보호

- ✅ 환경 변수에만 저장
- ✅ Git에 커밋하지 않기
- ✅ 주기적으로 변경
- ❌ 클라이언트 코드에 노출 금지

### 2. CORS 설정

`wrangler.toml`에서 허용할 도메인 지정:
```toml
ALLOWED_ORIGINS = "https://your-domain.vercel.app,http://localhost:3000"
```

### 3. 요청 검증

Worker는 다음을 확인합니다:
- ✅ Authorization 헤더
- ✅ X-API-Token 헤더
- ✅ Origin 헤더 (CORS)

---

## 📊 API 엔드포인트

### Worker API

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/health` | GET | 헬스 체크 |
| `/query` | POST | SQL 쿼리 실행 |
| `/query-first` | POST | 첫 번째 결과만 반환 |
| `/write` | POST | INSERT/UPDATE/DELETE |
| `/batch` | POST | 배치 쿼리 |
| `/crud` | POST | CRUD 헬퍼 |
| `/students` | GET | 학생 목록 |
| `/student/:id` | GET | 특정 학생 |

### 요청 형식

```typescript
// /query
{
  "sql": "SELECT * FROM User WHERE role = ?",
  "params": ["STUDENT"]
}

// /crud
{
  "operation": "CREATE" | "READ" | "UPDATE" | "DELETE",
  "table": "User",
  "data": { ... },
  "where": { ... },
  "select": ["id", "name"],
  "limit": 10,
  "orderBy": { "column": "createdAt", "direction": "DESC" }
}
```

---

## 🚀 배포 체크리스트

- [ ] D1 데이터베이스 생성
- [ ] `database_id`를 `wrangler.toml`에 입력
- [ ] `API_SECRET_TOKEN` 생성 및 입력
- [ ] `ALLOWED_ORIGINS` 설정
- [ ] 스키마 적용 (`schema.sql`)
- [ ] Worker 배포 (`npm run deploy`)
- [ ] Worker URL 저장
- [ ] Vercel 환경 변수 설정
  - `CLOUDFLARE_WORKER_URL`
  - `CLOUDFLARE_WORKER_TOKEN`
- [ ] Vercel 재배포
- [ ] Health check 테스트
- [ ] 동기화 테스트

---

## 🎯 장점

### D1 REST API vs Worker + D1 Binding

| 항목 | D1 REST API | Worker + Binding |
|------|-------------|------------------|
| **속도** | 느림 (HTTP 오버헤드) | ⚡ 빠름 (직접 연결) |
| **지연시간** | ~200-500ms | ~10-50ms |
| **비용** | 요청당 과금 | Worker 요청 + D1 쿼리 |
| **보안** | API 키 노출 위험 | Worker에서 처리 |
| **유연성** | 제한적 | ✅ 커스텀 로직 가능 |

---

## 🔄 동기화 플로우

```
Next.js API Route
    ↓
syncStudent('CREATE', data)
    ↓
1. Prisma → PostgreSQL (로컬 DB) ✅
    ↓
2. Worker Client → Cloudflare Worker
    ↓
3. Worker → D1 Database ✅
    ↓
✅ 두 DB 모두 업데이트 완료!
```

---

## 📝 다음 단계

1. **D1 대시보드 확인**
   ```bash
   wrangler d1 info superplace-db
   ```

2. **데이터 확인**
   ```bash
   wrangler d1 execute superplace-db --command="SELECT COUNT(*) as count FROM User;"
   ```

3. **로그 확인**
   ```bash
   wrangler tail superplace-db-worker
   ```

---

## 🎉 완료!

이제 Next.js에서 Cloudflare Worker를 통해 D1 데이터베이스에 빠르게 접근할 수 있습니다!

**속도:** D1 REST API 대비 **5-10배 빠름** ⚡  
**보안:** API 토큰으로 안전하게 보호됨 🔐  
**확장성:** 커스텀 엔드포인트 추가 가능 🚀
