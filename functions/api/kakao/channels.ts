// Kakao Channel Management API
export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS (preflight)
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = env.DB;

    if (method === 'GET') {
      // Get channels list
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await db.prepare(`
        SELECT * FROM KakaoChannel 
        WHERE userId = ? 
        ORDER BY createdAt DESC
      `).bind(userId).all();

      return new Response(
        JSON.stringify({ success: true, channels: result.results || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (method === 'POST') {
      // Create new channel
      const body = await request.json();
      const {
        userId,
        userName,
        channelName,
        searchId,
        phoneNumber,
        categoryCode,
        solapiChannelId
      } = body;

      if (!userId || !channelName || !searchId || !phoneNumber || !categoryCode) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: userId, channelName, searchId, phoneNumber, categoryCode' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique ID
      const id = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Parse categoryCode (format: 00200020001)
      // First 3 digits: main, next 3: middle, last 5: sub
      const mainCategory = categoryCode.substring(0, 3);
      const middleCategory = categoryCode.substring(3, 6);
      const subCategory = categoryCode.substring(6, 11);

      await db.prepare(`
        INSERT INTO KakaoChannel (
          id, userId, userName, phoneNumber, channelName, searchId,
          categoryCode, mainCategory, middleCategory, subCategory,
          solapiChannelId, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).bind(
        id, userId, userName || '', phoneNumber, channelName, searchId,
        categoryCode, mainCategory, middleCategory, subCategory,
        solapiChannelId || null, now, now
      ).run();

      // Fetch the created channel
      const channel = await db.prepare(`
        SELECT * FROM KakaoChannel WHERE id = ?
      `).bind(id).first();

      return new Response(
        JSON.stringify({ 
          success: true, 
          channel,
          message: '카카오 채널이 등록되었습니다.' 
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (method === 'DELETE') {
      // Delete channel
      const channelId = url.searchParams.get('channelId');
      const userId = url.searchParams.get('userId');

      if (!channelId || !userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'channelId and userId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify ownership
      const channel = await db.prepare(`
        SELECT * FROM KakaoChannel WHERE id = ? AND userId = ?
      `).bind(channelId, userId).first();

      if (!channel) {
        return new Response(
          JSON.stringify({ success: false, error: 'Channel not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete channel
      await db.prepare(`
        DELETE FROM KakaoChannel WHERE id = ? AND userId = ?
      `).bind(channelId, userId).run();

      // Also delete related templates
      await db.prepare(`
        DELETE FROM AlimtalkTemplate WHERE channelId = ?
      `).bind(channelId).run();

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '채널이 삭제되었습니다.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Kakao channels API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
