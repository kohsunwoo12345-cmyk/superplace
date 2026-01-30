# 🔧 Cloudflare D1 데이터베이스 연결 설정 가이드

## ⚠️ 현재 문제

Cloudflare D1 데이터베이스와 연결이 안 되어 있습니다.
각 사용자들의 데이터베이스를 연결하려면 Cloudflare Worker를 설정해야 합니다.

---

## 📋 필요한 정보

### 1. Cloudflare D1 데이터베이스 정보
- **Database ID**: `8c106540-21b4-4fa9-8879-c4956e459ca1` (문서에서 확인됨)
- **Site URL**: `https://superplace-academy.pages.dev`

### 2. 필요한 환경 변수
Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

```bash
# Cloudflare Worker URL (필수)
CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev

# Cloudflare Worker API Token (필수)
CLOUDFLARE_WORKER_TOKEN=your-secret-token-here

# Cloudflare Pages 사이트 URL
CLOUDFLARE_SITE_URL=https://superplace-academy.pages.dev

# Cloudflare D1 API Key
CLOUDFLARE_D1_API_KEY=your-d1-api-key

# Webhook Secret Key
CLOUDFLARE_WEBHOOK_SECRET=your-webhook-secret-key
```

---

## 🚀 설정 방법

### Step 1: Cloudflare Worker 생성

1. **Cloudflare Dashboard** 접속
   - https://dash.cloudflare.com

2. **Workers & Pages** 메뉴 클릭

3. **Create Application** → **Create Worker**

4. **Worker 이름 설정** (예: `superplace-d1-proxy`)

5. **Deploy** 클릭

### Step 2: D1 Database 바인딩

1. Worker 설정 페이지에서 **Settings** 탭

2. **Variables and Secrets** 섹션

3. **D1 Database Bindings** 추가
   - Variable name: `DB`
   - D1 database: `superplace` (기존 D1 데이터베이스 선택)

### Step 3: Worker 코드 배포

Worker에 다음 코드를 배포하세요:

```javascript
// Cloudflare Worker Code
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Token',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API 토큰 검증
    const apiToken = request.headers.get('Authorization')?.replace('Bearer ', '') ||
                     request.headers.get('X-API-Token');
    
    const validToken = env.API_TOKEN || 'your-secret-token-here';
    if (apiToken !== validToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Health check
      if (pathname === '/health') {
        return new Response(JSON.stringify({
          success: true,
          status: 'ok',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Query endpoint
      if (pathname === '/query' && request.method === 'POST') {
        const { sql, params = [] } = await request.json();
        const results = await env.DB.prepare(sql).bind(...params).all();
        
        return new Response(JSON.stringify({
          success: true,
          data: { results: results.results },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Query first endpoint
      if (pathname === '/query-first' && request.method === 'POST') {
        const { sql, params = [] } = await request.json();
        const result = await env.DB.prepare(sql).bind(...params).first();
        
        return new Response(JSON.stringify({
          success: true,
          data: { result },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Write endpoint
      if (pathname === '/write' && request.method === 'POST') {
        const { sql, params = [] } = await request.json();
        const result = await env.DB.prepare(sql).bind(...params).run();
        
        return new Response(JSON.stringify({
          success: true,
          data: { 
            success: result.success,
            meta: result.meta 
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Batch endpoint
      if (pathname === '/batch' && request.method === 'POST') {
        const { queries } = await request.json();
        const statements = queries.map(q => env.DB.prepare(q.sql).bind(...(q.params || [])));
        const results = await env.DB.batch(statements);
        
        return new Response(JSON.stringify({
          success: true,
          data: { results },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Students endpoint
      if (pathname === '/students' && request.method === 'GET') {
        const academyId = url.searchParams.get('academyId');
        let sql = 'SELECT * FROM User WHERE role = ?';
        const params = ['STUDENT'];
        
        if (academyId) {
          sql += ' AND academyId = ?';
          params.push(academyId);
        }
        
        sql += ' ORDER BY createdAt DESC';
        
        const results = await env.DB.prepare(sql).bind(...params).all();
        
        return new Response(JSON.stringify({
          success: true,
          data: { students: results.results },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
```

### Step 4: Worker 환경 변수 설정

Worker 설정에서 **Environment Variables** 추가:

```
API_TOKEN=your-strong-random-token-here-min-32-chars
```

**토큰 생성 예시**:
```bash
# 랜덤 토큰 생성
openssl rand -base64 32
```

### Step 5: Worker URL 확인

Worker 배포 후 URL 확인:
- 형식: `https://superplace-d1-proxy.your-subdomain.workers.dev`
- 또는 Custom Domain 사용 가능

### Step 6: Vercel 환경 변수 설정

**Vercel Dashboard** → **프로젝트** → **Settings** → **Environment Variables**

다음 변수들을 추가하세요:

```bash
CLOUDFLARE_WORKER_URL=https://superplace-d1-proxy.your-subdomain.workers.dev
CLOUDFLARE_WORKER_TOKEN=your-strong-random-token-here-min-32-chars
CLOUDFLARE_SITE_URL=https://superplace-academy.pages.dev
CLOUDFLARE_D1_API_KEY=your-d1-api-key
CLOUDFLARE_WEBHOOK_SECRET=another-random-token
```

**모든 환경에 적용**:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 7: Vercel 재배포

환경 변수 설정 후 Vercel에서 재배포:

1. **Deployments** 탭
2. 최신 배포 선택
3. **Redeploy** 클릭
4. ✅ **Use existing Build Cache** 체크 해제
5. **Redeploy** 확인

---

## ✅ 연결 테스트

### 1. Worker 연결 테스트

```bash
curl -X GET "https://your-worker.workers.dev/health" \
  -H "X-API-Token: your-token"
```

**예상 응답**:
```json
{
  "success": true,
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-30T12:00:00.000Z"
}
```

### 2. 사이트에서 연결 확인

1. https://superplace-study.vercel.app/dashboard/sync 접속
2. **연결 상태** 카드 확인
3. **Cloudflare D1** 상태가 "연결됨"으로 표시되어야 함

### 3. 동기화 테스트

1. https://superplace-study.vercel.app/dashboard/admin/users 접속
2. "Cloudflare 동기화" 버튼 클릭
3. 사용자 목록에 D1 사용자들이 표시되는지 확인

---

## 🔍 문제 해결

### "CLOUDFLARE_WORKER_URL is not set" 오류

✅ **해결 방법**:
1. Vercel 환경 변수가 올바르게 설정되었는지 확인
2. 모든 환경(Production/Preview/Development)에 적용되었는지 확인
3. Vercel 재배포 실행

### "Worker request failed" 오류

✅ **해결 방법**:
1. Worker URL이 올바른지 확인
2. API Token이 일치하는지 확인
3. Worker가 정상적으로 실행 중인지 확인
4. Worker 로그 확인 (Cloudflare Dashboard → Worker → Logs)

### "Unauthorized" 오류

✅ **해결 방법**:
1. CLOUDFLARE_WORKER_TOKEN이 정확한지 확인
2. Worker의 API_TOKEN 환경 변수와 일치하는지 확인
3. 토큰에 특수문자가 있다면 URL 인코딩 확인

### D1 Database 연결 오류

✅ **해결 방법**:
1. Worker 설정에서 D1 바인딩 확인
2. D1 Database가 존재하는지 확인
3. 바인딩 변수명이 `DB`인지 확인

---

## 📞 추가 지원

문제가 계속되면 다음 정보를 제공해주세요:

1. ✅ Cloudflare Worker URL
2. ✅ Worker 배포 상태
3. ✅ Vercel 환경 변수 스크린샷
4. ✅ 브라우저 콘솔 오류 메시지
5. ✅ Vercel Function Logs
6. ✅ Cloudflare Worker Logs

---

## 🎯 완료 체크리스트

- [ ] Cloudflare Worker 생성 및 배포
- [ ] D1 Database 바인딩 설정
- [ ] Worker API_TOKEN 환경 변수 설정
- [ ] Worker URL 확인
- [ ] Vercel 환경 변수 설정 (5개)
- [ ] Vercel 재배포
- [ ] Worker 연결 테스트
- [ ] 동기화 대시보드 연결 확인
- [ ] 사용자 동기화 테스트

---

**작성일**: 2026-01-30
**버전**: 1.0.0
**상태**: Cloudflare D1 연결 설정 필요
