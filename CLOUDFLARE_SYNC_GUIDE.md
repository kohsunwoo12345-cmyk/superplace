# Cloudflare 데이터 동기화 가이드

## 🔄 Cloudflare → 현재 웹사이트 데이터 동기화

### Cloudflare 웹사이트 정보
- **URL**: https://superplace-academy.pages.dev
- **D1 Database ID**: 8c106540-21b4-4fa9-8879-c4956e459ca1

---

## 방법 1: 수동 데이터 동기화 (권장)

### 1단계: Cloudflare에서 데이터 추출

Cloudflare 웹사이트 또는 D1 대시보드에서 사용자 데이터를 다음 형식으로 추출:

```json
{
  "users": [
    {
      "email": "student1@example.com",
      "password": "password123",
      "name": "홍길동",
      "role": "STUDENT",
      "phone": "010-1234-5678",
      "grade": "3학년",
      "parentPhone": "010-9876-5432",
      "academyId": null
    },
    {
      "email": "teacher1@example.com",
      "password": "teacher123",
      "name": "김선생",
      "role": "TEACHER",
      "phone": "010-1111-2222"
    }
  ]
}
```

### 2단계: 동기화 API 호출

```bash
curl -X POST https://superplace-study.vercel.app/api/cloudflare/sync \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_SYNC_API_KEY",
    "users": [
      {
        "email": "student@example.com",
        "password": "password123",
        "name": "학생이름",
        "role": "STUDENT"
      }
    ]
  }'
```

### 3단계: 결과 확인

응답 예시:
```json
{
  "success": true,
  "message": "동기화 완료: 생성 5명, 업데이트 2명, 실패 0명",
  "results": {
    "created": ["student1@example.com", "student2@example.com"],
    "updated": ["teacher1@example.com"],
    "failed": []
  }
}
```

---

## 방법 2: Cloudflare Worker를 통한 자동 동기화

Cloudflare Workers에 다음 코드를 배포하여 D1 데이터를 API로 노출:

```javascript
// Cloudflare Worker 코드
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // API 키 검증
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (apiKey !== env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 사용자 목록 조회
    if (url.pathname === '/api/users') {
      const { results } = await env.DB.prepare(
        'SELECT id, email, password, name, role, phone, grade FROM users'
      ).all();
      
      return new Response(JSON.stringify({ users: results }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

---

## 방법 3: Cloudflare D1 직접 쿼리 (Cloudflare API 사용)

Cloudflare 계정 API 토큰이 있다면:

```bash
# D1 데이터베이스 쿼리
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query" \
  -H "Authorization: Bearer {cloudflare_api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM users"
  }'
```

---

## 🔐 보안 설정

### 환경 변수 추가 (.env.local)

```env
# Cloudflare 동기화 API 키 (직접 설정)
CLOUDFLARE_SYNC_API_KEY=your-secure-random-key-here

# Cloudflare D1 데이터베이스 정보
CLOUDFLARE_D1_DATABASE_ID=8c106540-21b4-4fa9-8879-c4956e459ca1
CLOUDFLARE_D1_API_URL=https://superplace-academy.pages.dev

# Cloudflare 계정 정보 (선택사항)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 단일 사용자 동기화

```bash
curl -X POST http://localhost:3000/api/cloudflare/sync \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "test-key",
    "users": [{
      "email": "test@superplace.com",
      "password": "test1234",
      "name": "테스트학생",
      "role": "STUDENT",
      "phone": "010-1234-5678",
      "grade": "3학년"
    }]
  }'
```

### 시나리오 2: 로그인 테스트

1. **현재 웹사이트에서 로그인**
   - URL: https://superplace-study.vercel.app/login
   - 이메일: test@superplace.com
   - 비밀번호: test1234

2. **Cloudflare 웹사이트에서 로그인**
   - URL: https://superplace-academy.pages.dev/login
   - 같은 이메일/비밀번호 사용

### 시나리오 3: 동기화 상태 확인

```bash
curl https://superplace-study.vercel.app/api/cloudflare/sync
```

---

## 📊 데이터 매핑

| Cloudflare | 현재 웹사이트 | 비고 |
|-----------|------------|-----|
| email | email | 고유 키 |
| password | password | 해시되어 저장 |
| name | name | |
| role | role | STUDENT, TEACHER, DIRECTOR |
| phone | phone | |
| grade | grade | 학생만 |
| parent_phone | parentPhone | 학생만 |
| academy_id | academyId | 학원 연결 |

---

## ⚡ 자동화 옵션

### Vercel Cron Job으로 주기적 동기화

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cloudflare/sync/auto",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

매 6시간마다 자동으로 Cloudflare 데이터를 동기화합니다.

---

## 🆘 문제 해결

### 문제: API 키 오류
**해결**: `.env.local`에 `CLOUDFLARE_SYNC_API_KEY` 설정

### 문제: 비밀번호가 맞지 않음
**원인**: Cloudflare와 현재 사이트의 비밀번호 해시 방식이 다를 수 있음
**해결**: 평문 비밀번호를 동기화 API로 전송하여 재해싱

### 문제: 이메일 중복
**해결**: 기존 사용자는 업데이트되고 새 사용자만 생성됨

---

## 📞 다음 단계

1. **Cloudflare 데이터 확인**
   - D1 대시보드에서 사용자 테이블 구조 확인
   - 샘플 데이터 추출

2. **테스트 사용자 동기화**
   - 1-2명의 테스트 계정으로 동기화 테스트

3. **로그인 테스트**
   - 양쪽 사이트에서 같은 계정으로 로그인 확인

4. **전체 동기화**
   - 모든 사용자 데이터 동기화

5. **자동화 설정** (선택사항)
   - 주기적 자동 동기화 구성
