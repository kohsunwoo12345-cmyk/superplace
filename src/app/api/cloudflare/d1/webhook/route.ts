import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/cloudflare/d1/webhook
 * 
 * Cloudflare D1에서 데이터 변경 시 호출되는 웹훅
 * 
 * Body:
 * {
 *   "event": "USER_CREATED" | "USER_UPDATED" | "USER_DELETED",
 *   "userId": "user_id",
 *   "data": { user object },
 *   "timestamp": "2024-01-30T10:00:00Z",
 *   "apiKey": "webhook_secret_key"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, userId, data, timestamp, apiKey } = body;

    // API 키 검증
    const webhookApiKey = process.env.CLOUDFLARE_WEBHOOK_SECRET;
    if (!webhookApiKey || apiKey !== webhookApiKey) {
      return NextResponse.json(
        { error: '유효하지 않은 API 키입니다.' },
        { status: 403 }
      );
    }

    console.log(`📨 Webhook 수신: ${event} - User ID: ${userId}`);

    // 동기화 API 호출
    const syncResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/cloudflare/d1/sync?direction=from-d1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 내부 요청임을 표시
          'X-Internal-Request': 'true',
          'X-Webhook-Event': event,
          'X-Webhook-Timestamp': timestamp,
        },
        body: JSON.stringify({
          dryRun: false,
          specificUser: userId, // 특정 사용자만 동기화 (선택사항)
        }),
      }
    );

    if (!syncResponse.ok) {
      throw new Error(`동기화 실패: ${syncResponse.status}`);
    }

    const syncResult = await syncResponse.json();

    return NextResponse.json({
      success: true,
      message: `웹훅 처리 완료: ${event}`,
      event,
      userId,
      syncResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Webhook 처리 오류:', error);
    return NextResponse.json(
      { 
        error: 'Webhook 처리 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cloudflare/d1/webhook
 * 
 * Webhook 연결 테스트
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Cloudflare D1 Webhook 엔드포인트가 활성화되었습니다.',
    webhookUrl: `${process.env.NEXTAUTH_URL}/api/cloudflare/d1/webhook`,
    supportedEvents: [
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
    ],
    instructions: {
      url: `${process.env.NEXTAUTH_URL}/api/cloudflare/d1/webhook`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        event: 'USER_CREATED | USER_UPDATED | USER_DELETED',
        userId: 'user_id',
        data: '{ user object }',
        timestamp: 'ISO timestamp',
        apiKey: 'CLOUDFLARE_WEBHOOK_SECRET',
      },
    },
    timestamp: new Date().toISOString(),
  });
}
