// Solapi Kakao Channels Sync API
export async function onRequest(context: any) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Solapi credentials
    const SOLAPI_API_KEY = env['SOLAPI_API_Key '] || env.SOLAPI_API_Key || env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solapi credentials not configured' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📡 Fetching Kakao channels from Solapi...');

    // Create HMAC signature for Solapi API
    const dateTime = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hmacData = dateTime + salt;
    
    // Create signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SOLAPI_API_SECRET);
    const messageData = encoder.encode(hmacData);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Fetch channels from Solapi
    const response = await fetch('https://api.solapi.com/kakao/v1/plus-friends?limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${dateTime}, salt=${salt}, signature=${signatureHex}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Solapi API error:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch channels from Solapi',
          details: errorData
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const solapiData = await response.json();
    const solapiChannels = solapiData.list || [];

    console.log(`📥 Found ${solapiChannels.length} channels in Solapi`);

    // Get existing channels from DB
    const db = env.DB;
    const existingChannels = await db.prepare(`
      SELECT searchId FROM KakaoChannel WHERE userId = ?
    `).bind(userId).all();

    const existingSearchIds = new Set(
      (existingChannels.results || []).map((ch: any) => ch.searchId)
    );

    // Sync channels to DB
    let syncedCount = 0;
    let skippedCount = 0;

    for (const solapiChannel of solapiChannels) {
      const searchId = solapiChannel.plusFriendId || solapiChannel.searchId;
      
      if (!searchId || existingSearchIds.has(searchId)) {
        skippedCount++;
        continue;
      }

      const channelId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      // Parse categoryCode if available
      const categoryCode = solapiChannel.categoryCode || '00000000000';
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
        channelId,
        userId,
        '',
        solapiChannel.phoneNumber || '',
        solapiChannel.channelName || searchId,
        searchId,
        categoryCode,
        mainCategory,
        middleCategory,
        subCategory,
        solapiChannel.plusFriendId || searchId,
        now,
        now
      ).run();

      syncedCount++;
      console.log(`✅ Synced channel: ${searchId}`);
    }

    console.log(`✨ Sync complete: ${syncedCount} synced, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedCount,
        skippedCount,
        totalSolapiChannels: solapiChannels.length,
        message: `${syncedCount}개의 채널이 동기화되었습니다.`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Sync channels error:', error);
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
