/**
 * 카카오톡 채널 목록 조회 API
 * GET /api/kakao/channels?userId={userId}
 */

interface Env {
  DB: any;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const DB = context.env.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'userId parameter is required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 사용자의 카카오 채널 목록 조회
    const channels = await DB.prepare(`
      SELECT 
        id, userId, userName, phoneNumber, channelName, searchId,
        categoryCode, mainCategory, middleCategory, subCategory,
        businessNumber, solapiChannelId, status,
        createdAt, updatedAt
      FROM KakaoChannel
      WHERE userId = ?
      ORDER BY createdAt DESC
    `).bind(userId).all();

    console.log(`✅ Found ${channels.results.length} channels for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        channels: channels.results || []
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

/**
 * 카카오톡 채널 삭제 API
 * DELETE /api/kakao/channels?channelId={channelId}&userId={userId}
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
  try {
    const DB = context.env.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(context.request.url);
    const channelId = url.searchParams.get('channelId');
    const userId = url.searchParams.get('userId');

    if (!channelId || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'channelId and userId parameters are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 해당 채널이 사용자의 것인지 확인
    const channel = await DB.prepare(`
      SELECT id FROM KakaoChannel
      WHERE id = ? AND userId = ?
    `).bind(channelId, userId).first();

    if (!channel) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Channel not found or access denied' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 채널 삭제 (실제로는 status를 DELETED로 변경)
    await DB.prepare(`
      UPDATE KakaoChannel
      SET status = 'DELETED', updatedAt = datetime('now')
      WHERE id = ? AND userId = ?
    `).bind(channelId, userId).run();

    console.log(`✅ Channel ${channelId} deleted for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Channel deleted successfully' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting channel:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to delete channel' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
