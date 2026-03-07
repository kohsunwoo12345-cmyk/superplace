// Solapi 설정 API
// GET, PUT /api/admin/sms/solapi-config

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Solapi 설정 조회
export async function GET(request: Request) {
  try {
    const { env } = getRequestContext();
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
    let userId: string;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.userId || decoded.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 사용자 권한 확인 (SUPER_ADMIN만)
    const user = await db
      .prepare('SELECT role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    if (!user || user.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Solapi 설정 조회
    const config = await db
      .prepare('SELECT * FROM SolapiConfig WHERE id = ?')
      .bind('default')
      .first();

    // API 키는 마스킹하여 반환
    const maskedConfig = config ? {
      id: config.id,
      api_key: config.api_key ? `${(config.api_key as string).substring(0, 8)}...` : '',
      api_secret: config.api_secret ? '********' : '',
      sender_phone: config.sender_phone,
      isActive: config.isActive,
      hasConfig: !!(config.api_key && config.api_secret),
    } : {
      id: 'default',
      api_key: '',
      api_secret: '',
      sender_phone: '',
      isActive: 0,
      hasConfig: false,
    };

    return new Response(
      JSON.stringify({
        success: true,
        config: maskedConfig,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Solapi 설정 조회 오류:', error);
    return new Response(
      JSON.stringify({ error: 'Solapi 설정 조회 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Solapi 설정 업데이트
export async function PUT(request: Request) {
  try {
    const { env } = getRequestContext();
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
    let userId: string;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.userId || decoded.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 사용자 권한 확인 (SUPER_ADMIN만)
    const user = await db
      .prepare('SELECT role FROM User WHERE id = ?')
      .bind(userId)
      .first();

    if (!user || user.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { api_key, api_secret, sender_phone, isActive } = body;

    if (!api_key || !api_secret || !sender_phone) {
      return new Response(
        JSON.stringify({ error: 'API 키, API Secret, 발신번호는 필수입니다' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const now = new Date().toISOString();

    // 기존 설정 확인
    const existing = await db
      .prepare('SELECT id FROM SolapiConfig WHERE id = ?')
      .bind('default')
      .first();

    if (existing) {
      // 업데이트
      await db
        .prepare(
          `UPDATE SolapiConfig 
           SET api_key = ?, api_secret = ?, sender_phone = ?, isActive = ?, updatedAt = ?
           WHERE id = ?`
        )
        .bind(api_key, api_secret, sender_phone, isActive ? 1 : 0, now, 'default')
        .run();
    } else {
      // 생성
      await db
        .prepare(
          `INSERT INTO SolapiConfig (id, api_key, api_secret, sender_phone, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind('default', api_key, api_secret, sender_phone, isActive ? 1 : 0, now, now)
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solapi 설정이 저장되었습니다',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Solapi 설정 업데이트 오류:', error);
    return new Response(
      JSON.stringify({ error: 'Solapi 설정 업데이트 중 오류가 발생했습니다', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
