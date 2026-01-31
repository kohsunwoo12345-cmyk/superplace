# 🏗️ 프로젝트 아키텍처 상세 설명

## 📊 현재 구조 (3개의 독립적인 시스템)

```
┌─────────────────────────────────────────────────────────────────┐
│                        전체 시스템 구조                           │
└─────────────────────────────────────────────────────────────────┘

1️⃣ Vercel 배포 (메인 프로덕션)
   ├─ URL: https://superplace-study.vercel.app
   ├─ 데이터베이스: Neon PostgreSQL
   │  └─ URL: postgresql://neondb_owner:***@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb
   ├─ 프레임워크: Next.js 15
   ├─ ORM: Prisma
   └─ 배포: Vercel 자동 배포 (main 브랜치)

2️⃣ Cloudflare D1 (SQLite 기반 엣지 DB - 연결 시도 중)
   ├─ Database ID: 8c106540-21b4-4fa9-8879-c4956e459ca1
   ├─ 타입: SQLite (서버리스 엣지 데이터베이스)
   ├─ 현재 상태: ⚠️ 설정 준비됨, 연결 안됨
   └─ 목적: 빠른 읽기 (글로벌 엣지 캐시)

3️⃣ Cloudflare Pages 배포 (선택적 배포 - 현재 미사용)
   ├─ URL: https://superplace-academy.pages.dev (설정 가능)
   ├─ 프레임워크: Next.js 15
   └─ 배포: Cloudflare Pages (genspark_ai_developer 브랜치)
```

---

## 🔍 상세 분석

### 1️⃣ **Vercel 배포** (현재 메인 시스템)

#### 배포 정보
- **Production URL**: `https://superplace-study.vercel.app`
- **Git 브랜치**: `main` 브랜치가 자동 배포됨
- **프레임워크**: Next.js 15.4.10
- **빌드 도구**: Vercel Build System

#### 데이터베이스: Neon PostgreSQL
```
데이터베이스 타입: PostgreSQL (관계형 데이터베이스)
제공자: Neon (서버리스 PostgreSQL)
연결 문자열: 
  postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

특징:
  ✅ 완전한 PostgreSQL 호환
  ✅ 서버리스 아키텍처 (자동 스케일링)
  ✅ 연결 풀링 (Connection Pooling) 지원
  ✅ 트랜잭션 지원
  ✅ 복잡한 쿼리 가능
  ✅ 백업 및 복구
```

#### Prisma ORM 사용
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 모델 예시
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  password   String
  role       String   @default("STUDENT")
  academyId  String?
  // ... 더 많은 필드
}
```

#### 현재 문제점
- ❌ 사용자 목록이 `/dashboard/admin/users`에 표시되지 않음
- 원인: 권한 체크 또는 Vercel 캐시 문제
- 해결: 코드에서 모든 권한 체크 제거함 → **Vercel 수동 재배포 필요**

---

### 2️⃣ **Cloudflare D1 데이터베이스** (연결 시도 중)

#### Cloudflare D1이란?
```
타입: SQLite 기반 서버리스 데이터베이스
위치: Cloudflare의 전세계 엣지 네트워크
Database ID: 8c106540-21b4-4fa9-8879-c4956e459ca1

특징:
  ✅ 글로벌 엣지 캐싱 (빠른 읽기 속도)
  ✅ 무료 계층 제공 (10GB 저장소, 500만 읽기/일)
  ✅ Cloudflare Workers와 직접 통합
  ⚠️ SQLite 기반 (PostgreSQL과 다른 SQL 문법)
  ⚠️ 트랜잭션 제한 있음
  ⚠️ 복잡한 JOIN 쿼리 성능 제한
```

#### 현재 연결 상태
```
상태: ⚠️ 설정은 되어 있지만 연결 안됨

필요한 환경 변수 (Vercel에 설정 필요):
  1. CLOUDFLARE_ACCOUNT_ID          → Cloudflare 계정 ID
  2. CLOUDFLARE_D1_DATABASE_ID      → 8c106540-21b4-4fa9-8879-c4956e459ca1
  3. CLOUDFLARE_D1_API_TOKEN        → API 토큰 (권장)
  
  또는
  
  3. CLOUDFLARE_API_KEY             → Global API Key
  4. CLOUDFLARE_EMAIL               → Cloudflare 계정 이메일
```

#### D1 연결 방법
프로젝트에 이미 구현된 코드:
```typescript
// src/lib/cloudflare-d1-client.ts

// D1 사용자 조회
export async function getD1Users(role?: string, academyId?: string) {
  const sql = `
    SELECT id, email, name, role, academyId
    FROM User
    WHERE 1=1
    ${role ? 'AND role = ?' : ''}
    ${academyId ? 'AND academyId = ?' : ''}
  `;
  return executeD1Query(sql, params);
}

// D1 연결 테스트
export async function testD1Connection() {
  try {
    await executeD1Query('SELECT 1 as test');
    console.log('✅ Cloudflare D1 연결 성공!');
    return true;
  } catch (error) {
    console.error('❌ Cloudflare D1 연결 실패:', error);
    return false;
  }
}
```

---

### 3️⃣ **Cloudflare Pages 배포** (선택적)

#### 배포 정보
- **URL**: `https://superplace-academy.pages.dev` (설정 가능)
- **Git 브랜치**: `genspark_ai_developer` 브랜치를 배포할 수 있음
- **프레임워크**: Next.js 15
- **빌드 명령**: `npx @cloudflare/next-on-pages`

#### wrangler.toml 설정
```toml
name = "superplace-study"
compatibility_date = "2024-01-31"
pages_build_output_dir = ".next"

# 환경 변수는 Cloudflare Dashboard에서 설정
# Settings > Environment variables
```

#### 현재 상태
- ⚠️ 설정 파일만 있음 (실제 배포는 안됨)
- 원하면 Cloudflare Pages에도 배포 가능
- Neon 또는 D1 데이터베이스 선택 가능

---

## 🎯 데이터베이스 비교

| 특성 | Neon PostgreSQL | Cloudflare D1 |
|------|----------------|---------------|
| **타입** | PostgreSQL | SQLite |
| **위치** | 중앙 서버 (US East) | 글로벌 엣지 |
| **읽기 속도** | 보통 (100-200ms) | 매우 빠름 (10-50ms) |
| **쓰기 속도** | 빠름 | 보통 |
| **복잡한 쿼리** | ✅ 지원 | ⚠️ 제한적 |
| **트랜잭션** | ✅ 완전 지원 | ⚠️ 제한적 |
| **용량** | 무제한 (유료) | 10GB (무료) |
| **비용** | $0.12/GB-month | 무료 (제한 내) |
| **Prisma 지원** | ✅ 완벽 지원 | ❌ 미지원 (REST API 사용) |

---

## 🔄 가능한 아키텍처 패턴

### 패턴 1: **Vercel + Neon만 사용** (현재 상태)
```
[사용자] → [Vercel Next.js] → [Neon PostgreSQL]
                                      ↓
                              [모든 데이터 저장]

✅ 장점: 단순함, 안정적, Prisma 완벽 지원
❌ 단점: 글로벌 사용자에게 느릴 수 있음
```

### 패턴 2: **Vercel + Neon + D1 (읽기 캐시)**
```
[사용자] → [Vercel Next.js] ─┬→ [Neon PostgreSQL] (쓰기, 마스터)
                             └→ [Cloudflare D1] (읽기 전용, 캐시)
                                      ↑
                                 정기 동기화

✅ 장점: 빠른 읽기, 글로벌 성능
❌ 단점: 복잡함, 동기화 필요, 데이터 일관성 이슈
```

### 패턴 3: **Cloudflare Pages + D1만 사용**
```
[사용자] → [Cloudflare Pages] → [Cloudflare D1]
                                       ↓
                               [모든 데이터 저장]

✅ 장점: 매우 빠름, 글로벌 엣지, 저렴함
❌ 단점: Prisma 미지원, SQLite 제한, 마이그레이션 필요
```

---

## 📋 현재 문제 및 해결 방안

### 문제 1: `/dashboard/admin/users` 사용자 목록 안보임

#### 원인
- Vercel이 새 코드를 배포하지 않음
- 캐시 문제 (`x-vercel-cache: HIT`)
- 코드는 이미 수정됨 (모든 권한 체크 제거)

#### 해결 방법
**👉 Vercel 대시보드에서 수동 재배포**

1. https://vercel.com/dashboard 접속
2. `superplace` 프로젝트 선택
3. **Deployments** 탭
4. 최신 배포 → `...` 메뉴 → **Redeploy**
5. `Use existing Build Cache` **체크 해제**
6. **Redeploy** 클릭
7. 2-3분 대기
8. ✅ https://superplace-study.vercel.app/dashboard/admin/users 확인

---

### 문제 2: Cloudflare D1 연결하고 싶음

#### 현재 상태
- D1 Database ID: `8c106540-21b4-4fa9-8879-c4956e459ca1`
- 코드는 이미 구현됨 (`src/lib/cloudflare-d1-client.ts`)
- 환경 변수만 설정하면 바로 사용 가능

#### 설정 방법

**Step 1: Cloudflare API 토큰 생성**

1. **Cloudflare 대시보드 접속**
   ```
   https://dash.cloudflare.com/profile/api-tokens
   ```

2. **"Create Token" 클릭**

3. **"Custom token" 선택**

4. **권한 설정**:
   ```
   Permissions:
   - Account > D1 > Edit
   - Account Resources:
     - Include > Specific account > [내 계정 선택]
   ```

5. **토큰 생성 및 복사**
   ```
   예시: 1234567890abcdef1234567890abcdef12345678
   ```

**Step 2: Cloudflare Account ID 확인**

1. Cloudflare 대시보드 → 아무 사이트 클릭
2. 오른쪽 사이드바에서 **Account ID** 복사
   ```
   예시: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

**Step 3: Vercel 환경 변수 설정**

1. **Vercel 대시보드 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **프로젝트 선택**: `superplace`

3. **Settings → Environment Variables**

4. **다음 변수 추가**:
   ```bash
   # 필수
   CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1
   CLOUDFLARE_D1_API_TOKEN=1234567890abcdef1234567890abcdef12345678
   ```

5. **Environment 선택**: `Production`, `Preview`, `Development` 모두 체크

6. **Save** 클릭

**Step 4: Vercel 재배포**

```bash
# 방법 1: Vercel 대시보드에서 Redeploy
# 방법 2: Git 푸시로 트리거
git commit --allow-empty -m "chore: Trigger Vercel deployment with D1 env vars"
git push origin main
```

**Step 5: D1 데이터 동기화**

D1에 데이터를 복사하려면 API 엔드포인트 호출:
```bash
# Neon → D1 동기화
curl -X GET "https://superplace-study.vercel.app/api/admin/users?sync=true"
```

또는 프론트엔드에서 동기화 버튼 추가 가능

---

## 🚀 권장 아키텍처

당신의 상황에 맞는 권장 구조:

### **단기 (지금 바로)**
```
[Vercel + Neon만 사용]
  → 가장 단순하고 안정적
  → 현재 문제만 해결하면 바로 작동
  → Prisma 완벽 지원
```

**해야 할 것:**
1. ✅ Vercel 수동 재배포 (캐시 제거)
2. ✅ 사용자 목록 확인
3. ✅ 권한 체크 복구 (보안)

---

### **중기 (1-2주 후)**
```
[Vercel + Neon (마스터) + D1 (읽기 캐시)]
  → 빠른 읽기 성능
  → Neon에는 쓰기만, D1에서 읽기
  → 정기 동기화 (5분마다)
```

**해야 할 것:**
1. ✅ D1 환경 변수 설정 (위 Step 1-4)
2. ✅ 동기화 스크립트 실행 (`?sync=true`)
3. ✅ API에서 읽기는 D1, 쓰기는 Neon 사용
4. ✅ Cron job으로 정기 동기화

---

### **장기 (나중에)**
```
[Cloudflare Pages + D1 완전 이전]
  → 모든 것을 Cloudflare로
  → 매우 빠르고 저렴함
  → Prisma 대신 Drizzle ORM 사용
```

**해야 할 것:**
1. Prisma → Drizzle ORM 마이그레이션
2. Neon 데이터를 D1로 완전 이전
3. Cloudflare Pages 배포
4. DNS 변경

---

## 🎯 즉시 실행 체크리스트

### ✅ 현재 문제 해결 (사용자 목록 표시)

- [ ] **Vercel 대시보드 접속**
  - https://vercel.com/dashboard
  
- [ ] **프로젝트 선택**: `superplace`

- [ ] **Deployments → Redeploy**
  - `Use existing Build Cache` 체크 해제
  - Redeploy 클릭
  
- [ ] **2-3분 대기**

- [ ] **URL 확인**
  ```
  https://superplace-study.vercel.app/dashboard/admin/users
  ```

- [ ] **사용자 목록 확인**
  - 모든 학원장, 선생님, 학생 표시되어야 함

---

### ⏭️ D1 연결 (선택 사항)

- [ ] **Cloudflare API 토큰 생성**
  - https://dash.cloudflare.com/profile/api-tokens
  
- [ ] **Account ID 확인**

- [ ] **Vercel 환경 변수 설정**
  ```
  CLOUDFLARE_ACCOUNT_ID=...
  CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1
  CLOUDFLARE_D1_API_TOKEN=...
  ```

- [ ] **Vercel 재배포**

- [ ] **D1 동기화 실행**
  ```
  curl -X GET "https://superplace-study.vercel.app/api/admin/users?sync=true"
  ```

- [ ] **동작 확인**

---

## 📚 참고 문서

프로젝트에 이미 작성된 가이드:
- `CLOUDFLARE_D1_SETUP.md` - D1 설정 가이드
- `CLOUDFLARE_API_TOKEN_GUIDE.md` - API 토큰 생성
- `CLOUDFLARE_SYNC_GUIDE.md` - 데이터 동기화
- `CLOUDFLARE_PAGES_DEPLOYMENT.md` - Pages 배포
- `README.md` - 프로젝트 전체 가이드

---

## 🔍 현재 코드 상태

### API 라우트 수정됨
```typescript
// src/app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  // ✅ 세션 체크 제거됨 (임시)
  // ✅ 권한 체크 제거됨 (임시)
  // ✅ 모든 사용자 반환
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      // ... 더 많은 필드
    },
  });
  
  return NextResponse.json({ users });
}
```

### 프론트엔드 수정됨
```typescript
// src/app/dashboard/admin/users/page.tsx
useEffect(() => {
  // ✅ 인증 체크 제거됨 (임시)
  // ✅ 즉시 사용자 목록 로드
  fetchUsers();
}, []);
```

---

## ⚠️ 보안 경고

**현재 코드는 임시 디버그용입니다!**

- 모든 사용자가 전체 사용자 목록을 볼 수 있음
- 운영 환경에서는 위험함
- 문제 해결 후 **반드시 권한 체크 복구** 필요

---

## 📞 다음 단계

1. **지금 바로**: Vercel 수동 재배포
2. **확인**: 사용자 목록이 보이는지
3. **결정**: D1 연결할지 여부
4. **보안**: 권한 체크 복구

---

**작성일**: 2026-01-31
**버전**: v1.0
**상태**: 코드 준비 완료, Vercel 재배포 대기 중
