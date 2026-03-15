// SMS 발신번호 목록 조회 API - Cloudflare Pages Functions
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const db = env.DB;

    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    
    // 토큰 파싱 (id|email|role 형식)
    let userId, role;
    try {
      const parts = token.split('|');
      if (parts.length >= 3) {
        userId = parts[0];
        role = parts[2];
      } else {
        // JWT 형식 시도
        const decoded = JSON.parse(atob(token.split('.')[1]));
        userId = decoded.userId || decoded.sub;
        role = decoded.role;
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 확인
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'DIRECTOR') {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SMSSender 테이블이 없을 수 있으므로 안전하게 처리
    let senders = [];
    try {
      const result = await db
        .prepare('SELECT * FROM SMSSender WHERE verified = 1 ORDER BY createdAt DESC')
        .all();
      senders = result.results || [];
    } catch (tableError) {
      // SMSSender 테이블이 없으면 빈 배열 반환
      console.log('SMSSender 테이블 없음 또는 조회 실패:', tableError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        senders: senders,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('발신번호 조회 오류:', error);
    return new Response(
      JSON.stringify({ 
        error: '발신번호 조회 중 오류가 발생했습니다',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
