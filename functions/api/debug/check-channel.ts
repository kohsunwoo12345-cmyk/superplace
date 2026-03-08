// Debug endpoint to check channel data
// GET /api/debug/check-channel?channelId=ch_xxx

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const channelId = url.searchParams.get('channelId') || 'ch_1772359215883_fk4otb5hv';
  
  try {
    // 특정 채널 조회
    const channel = await env.DB.prepare(`
      SELECT 
        id,
        channelName,
        solapiChannelId,
        LENGTH(solapiChannelId) as pfIdLength,
        phoneNumber,
        userId,
        createdAt
      FROM KakaoChannel 
      WHERE id = ?
    `).bind(channelId).first();
    
    // 모든 채널 조회
    const allChannels = await env.DB.prepare(`
      SELECT 
        id,
        channelName,
        solapiChannelId,
        LENGTH(solapiChannelId) as pfIdLength,
        phoneNumber
      FROM KakaoChannel 
      ORDER BY createdAt DESC 
      LIMIT 10
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      searchedChannelId: channelId,
      channel: channel,
      allChannels: allChannels.results,
      analysis: {
        channelExists: !!channel,
        hasSolapiChannelId: !!channel?.solapiChannelId,
        pfIdLength: channel?.solapiChannelId?.length,
        isValidPfId: (channel?.solapiChannelId?.length >= 30 && channel?.solapiChannelId?.length <= 40),
      }
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
