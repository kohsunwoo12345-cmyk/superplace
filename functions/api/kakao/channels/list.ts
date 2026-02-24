/**
 * 카카오 채널 목록 조회 API
 * GET /api/kakao/channels/list
 */

interface Env {
  DB: any;
}

export async function onRequestGet(context: { env: Env }) {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DB에서 채널 목록 조회
    const result = await DB.prepare(`
      SELECT searchId, phoneNumber, categoryCode, pfId, status, createdAt, updatedAt
      FROM KakaoChannels
      WHERE status = 'active'
      ORDER BY createdAt DESC
    `).all();

    return new Response(
      JSON.stringify({ 
        success: true, 
        channels: result.results || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching channels:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch channels' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
