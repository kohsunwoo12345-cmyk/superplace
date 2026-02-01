import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/cloudflare/import-manual
 * 
 * Cloudflare 웹사이트에서 수동으로 추출한 데이터를 가져오기
 * 
 * 사용 방법:
 * 1. Cloudflare 웹사이트 (https://superplace-academy.pages.dev)에 로그인
 * 2. 개발자 도구 콘솔에서 다음 스크립트 실행:
 * 
 * ```javascript
 * // 로그인된 상태에서 실행
 * fetch('/api/users/export', {
 *   headers: {
 *     'Authorization': 'Bearer ' + localStorage.getItem('token')
 *   }
 * })
 * .then(r => r.json())
 * .then(data => {
 *   console.log(JSON.stringify(data, null, 2));
 *   // 결과를 복사해서 이 API로 전송
 * });
 * ```
 * 
 * 3. 출력된 JSON을 복사해서 이 API로 POST:
 * 
 * ```bash
 * curl -X POST https://superplace-study.vercel.app/api/cloudflare/import-manual \
 *   -H "Content-Type: application/json" \
 *   -d @cloudflare-data.json
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    return NextResponse.json({
      success: true,
      message: '데이터 수신 완료. /api/cloudflare/sync를 사용하여 동기화하세요.',
      dataPreview: {
        usersCount: Array.isArray(data.users) ? data.users.length : 0,
        firstUser: Array.isArray(data.users) && data.users.length > 0 
          ? { email: data.users[0].email, name: data.users[0].name }
          : null,
      },
      nextStep: {
        endpoint: '/api/cloudflare/sync',
        method: 'POST',
        body: {
          apiKey: 'YOUR_CLOUDFLARE_SYNC_API_KEY',
          users: data.users,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '데이터 처리 중 오류가 발생했습니다.', details: error.message },
      { status: 400 }
    );
  }
}

/**
 * GET /api/cloudflare/import-manual
 * 
 * 가이드 표시
 */
export async function GET(request: NextRequest) {
  const guide = `
# Cloudflare 데이터 수동 가져오기 가이드

## 단계 1: Cloudflare 웹사이트에서 데이터 추출

1. https://superplace-academy.pages.dev 에 로그인
2. 브라우저 개발자 도구 열기 (F12)
3. Console 탭에서 다음 스크립트 실행:

\`\`\`javascript
// 방법 1: localStorage에서 토큰 사용
const token = localStorage.getItem('token') || sessionStorage.getItem('token');

fetch('/api/users/export', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
.then(r => r.json())
.then(data => {
  console.log('=== 데이터 추출 완료 ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('=== 위 데이터를 복사하세요 ===');
})
.catch(err => console.error('오류:', err));

// 방법 2: 테이블에서 직접 추출 (D1 쿼리)
// Cloudflare Dashboard > D1 > Query 에서 실행:
// SELECT * FROM users;
\`\`\`

## 단계 2: 데이터 형식 변환

추출한 데이터를 다음 형식으로 변환:

\`\`\`json
{
  "users": [
    {
      "email": "student@example.com",
      "password": "원본비밀번호_또는_해시",
      "name": "홍길동",
      "role": "STUDENT",
      "phone": "010-1234-5678",
      "grade": "3학년",
      "parentPhone": "010-9876-5432"
    }
  ]
}
\`\`\`

## 단계 3: 현재 웹사이트로 동기화

\`\`\`bash
curl -X POST https://superplace-study.vercel.app/api/cloudflare/sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "superplace-sync-2026-secure-key",
    "users": [...]
  }'
\`\`\`

## 단계 4: 로그인 테스트

양쪽 사이트에서 같은 이메일/비밀번호로 로그인 테스트:
- Cloudflare: https://superplace-academy.pages.dev/login
- 현재 사이트: https://superplace-study.vercel.app/login

---

## 빠른 테스트 (샘플 데이터)

\`\`\`bash
curl -X POST https://superplace-study.vercel.app/api/cloudflare/sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "superplace-sync-2026-secure-key",
    "users": [{
      "email": "cloudflare-test@superplace.com",
      "password": "test1234",
      "name": "Cloudflare 테스트 학생",
      "role": "STUDENT",
      "phone": "010-1111-2222",
      "grade": "2학년"
    }]
  }'
\`\`\`

테스트 로그인:
- 이메일: cloudflare-test@superplace.com
- 비밀번호: test1234
`;

  return new Response(guide, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
