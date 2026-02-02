# 🐘 기존 PostgreSQL 데이터베이스 연결 가이드

## 🎯 개요
Vercel 프로젝트의 PostgreSQL을 Cloudflare Pages에서도 사용합니다.
→ **두 프로젝트에서 같은 사용자로 로그인 가능!**

---

## 📋 필수 정보

### **1. DATABASE_URL 확인**

Vercel Dashboard에서:
1. 프로젝트 선택 (superplace-study)
2. **Settings** → **Environment Variables**
3. `DATABASE_URL` 값 복사

형식 예시:
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

---

## 🚀 Cloudflare Pages 설정

### **Step 1: Environment Variable 추가**

#### **1-1. Cloudflare Dashboard**
👉 https://dash.cloudflare.com/

#### **1-2. 프로젝트 설정**
1. **Workers & Pages** → **superplacestudy**
2. **Settings** → **Environment variables**
3. **Add variable** 클릭:
   - **Variable name**: `DATABASE_URL`
   - **Value**: (Vercel에서 복사한 값)
   - **Environment**: Production + Preview 체크
4. **Save** 클릭

---

### **Step 2: PostgreSQL 클라이언트 설치**

Cloudflare Functions에서 PostgreSQL 연결:

```bash
npm install postgres
```

---

### **Step 3: API Function 수정**

`functions/api/test.ts` 수정:

```typescript
// Cloudflare Pages Function with PostgreSQL
import postgres from 'postgres';

interface Env {
  DATABASE_URL: string;
}

export async function onRequest(context: { env: Env }) {
  const { DATABASE_URL } = context.env;
  
  try {
    // PostgreSQL 연결
    const sql = postgres(DATABASE_URL, {
      ssl: 'require',
      max: 1, // Cloudflare Functions는 connection pool 1개 권장
    });
    
    // 테스트 쿼리
    const result = await sql`SELECT 1 as test`;
    
    // 연결 종료
    await sql.end();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "PostgreSQL connected!",
        result: result[0]
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
```

---

### **Step 4: 사용자 조회 API 예시**

`functions/api/users/[id].ts`:

```typescript
import postgres from 'postgres';

interface Env {
  DATABASE_URL: string;
}

export async function onRequest(context: { 
  env: Env; 
  params: { id: string } 
}) {
  const { DATABASE_URL } = context.env;
  const { id } = context.params;
  
  try {
    const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 });
    
    // 사용자 조회 (Vercel 프로젝트와 같은 테이블)
    const users = await sql`
      SELECT id, email, name, role
      FROM "User"
      WHERE id = ${id}
    `;
    
    await sql.end();
    
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, user: users[0] }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

---

## 🔐 Single Sign-On (SSO) 구현

### **개념:**
```
사용자가 Vercel 사이트에 로그인
    ↓
JWT 토큰 생성
    ↓
Cloudflare 사이트에서 같은 JWT 검증
    ↓
자동 로그인!
```

### **구현 방법:**

#### **1. 공유 JWT Secret**

두 프로젝트에서 같은 `JWT_SECRET` 사용:

**Vercel:**
```
JWT_SECRET=your-super-secret-key-here
```

**Cloudflare:**
```
JWT_SECRET=your-super-secret-key-here (동일한 값)
```

#### **2. JWT 검증 미들웨어**

`functions/_middleware.ts`:

```typescript
import jwt from '@tsndr/cloudflare-worker-jwt';

interface Env {
  JWT_SECRET: string;
}

export async function onRequest(context: { 
  request: Request; 
  env: Env; 
  next: () => Promise<Response> 
}) {
  const { request, env, next } = context;
  
  // 인증이 필요한 경로
  if (request.url.includes('/api/protected')) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.substring(7);
    
    try {
      const isValid = await jwt.verify(token, env.JWT_SECRET);
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // 토큰 유효 → 다음 핸들러로
      return next();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Token verification failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // 인증 불필요한 경로 → 다음 핸들러로
  return next();
}
```

---

## 📊 두 프로젝트 비교

| 항목 | Vercel 프로젝트 | Cloudflare 프로젝트 |
|------|----------------|-------------------|
| **용도** | 학습 관리 (Full Stack) | 마케팅/홈페이지 (Static) |
| **데이터베이스** | PostgreSQL (Neon) | PostgreSQL (공유) |
| **인증** | NextAuth | JWT (공유 Secret) |
| **API** | Next.js API Routes | Cloudflare Functions |
| **배포** | Vercel | Cloudflare Pages |

---

## ✅ 장점

1. **Single Sign-On**
   - 한 번 로그인하면 두 사이트 모두 사용 가능
   
2. **데이터 일관성**
   - 사용자 정보 한 곳에서 관리
   
3. **유지보수 간편**
   - DB 스키마 변경 시 한 번만 수정

---

## ⚠️ 주의사항

1. **Connection Pooling**
   - Cloudflare Functions는 connection pool 크기 1 권장
   - 많은 요청 시 connection 관리 필요

2. **Cold Start**
   - 첫 요청 시 DB 연결 시간 소요 (1-2초)

3. **비용**
   - PostgreSQL 무료 플랜 제한 (Neon: 0.5GB, 연결 수 제한)

---

## 🎯 다음 단계

1. **DATABASE_URL 추가** (Cloudflare Environment Variables)
2. **postgres 패키지 설치**
3. **API Functions 작성**
4. **JWT 인증 구현**
5. **프론트엔드 연결**

---

## 💡 FAQ

### **Q: 두 프로젝트가 동시에 같은 DB 사용해도 괜찮아?**
A: ✅ 네! PostgreSQL은 여러 클라이언트 동시 접속을 지원합니다.

### **Q: Prisma를 Cloudflare에서도 사용할 수 있어?**
A: ⚠️ Cloudflare Functions에서는 Prisma 사용이 제한적입니다. 
   `postgres` 패키지로 SQL 직접 작성을 권장합니다.

### **Q: DB 스키마가 다르면?**
A: 공통 테이블(users, academy)만 공유하고, 
   각 프로젝트 전용 테이블은 별도로 관리할 수 있습니다.

---

**준비되셨나요?** DATABASE_URL을 알려주시면 설정을 도와드리겠습니다! 🚀
