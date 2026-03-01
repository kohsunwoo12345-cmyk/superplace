// Solapi Create Channel API
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
    const { 
      userId, 
      userName, 
      channelName, 
      searchId, 
      phoneNumber, 
      categoryCode, 
      token 
    } = body;

    if (!searchId || !phoneNumber || !categoryCode || !token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: searchId, phoneNumber, categoryCode, token' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle trailing spaces in env var names
    const SOLAPI_API_KEY = env['SOLAPI_API_Key '] || env.SOLAPI_API_Key || env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET;
    const ENABLE_TEST_MODE = env.ENABLE_KAKAO_TEST_MODE === 'true';

    // Test mode: Skip Solapi and save directly to DB
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      if (!ENABLE_TEST_MODE) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Solapi credentials not configured. Set ENABLE_KAKAO_TEST_MODE=true to test without Solapi.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Test mode: Save directly to database
      console.log('⚠️ TEST MODE: Skipping Solapi, saving directly to DB');
      
      const db = env.DB;
      const channelId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Parse categoryCode
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
        userId || 'anonymous',
        userName || '',
        phoneNumber,
        channelName || searchId,
        searchId,
        categoryCode,
        mainCategory,
        middleCategory,
        subCategory,
        `test_${searchId}`,
        now,
        now
      ).run();

      // Fetch the created channel
      const channel = await db.prepare(`
        SELECT * FROM KakaoChannel WHERE id = ?
      `).bind(channelId).first();

      return new Response(
        JSON.stringify({ 
          success: true,
          channel,
          testMode: true,
          message: '테스트 모드: 카카오 채널이 등록되었습니다. (Solapi 연동 없음)'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📤 Creating channel with Solapi v2 API:', {
      searchId,
      phoneNumber: phoneNumber.substring(0, 3) + '****',
      categoryCode,
      token: '****'
    });

    // Create channel on Solapi
    const response = await fetch('https://api.solapi.com/kakao/v2/plus-friends', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${SOLAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plusFriendId: searchId,
        phoneNumber: phoneNumber,
        categoryCode: categoryCode,
        token: parseInt(token, 10)
      })
    });

    const data = await response.json();

    console.log('📥 Solapi create channel response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.errorMessage || data.message || 'Failed to create channel on Solapi',
          details: data,
          debug: {
            status: response.status,
            searchId,
            phoneNumberLength: phoneNumber.length,
            categoryCode,
            categoryCodeLength: categoryCode.length
          }
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to database
    const db = env.DB;
    const channelId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Parse categoryCode (format: 00200020001)
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
      userId || 'anonymous',
      userName || '',
      phoneNumber,
      channelName || searchId,
      searchId,
      categoryCode,
      mainCategory,
      middleCategory,
      subCategory,
      data.plusFriendId || data.id || null,
      now,
      now
    ).run();

    // Fetch the created channel
    const channel = await db.prepare(`
      SELECT * FROM KakaoChannel WHERE id = ?
    `).bind(channelId).first();

    return new Response(
      JSON.stringify({ 
        success: true,
        channel,
        solapiData: data,
        message: '카카오 채널이 성공적으로 등록되었습니다.'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Create channel error:', error);
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
