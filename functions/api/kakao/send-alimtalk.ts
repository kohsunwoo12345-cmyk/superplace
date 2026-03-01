// Solapi Send Alimtalk API
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
    const { userId, channelId, solapiChannelId, templateCode, messages } = body;

    if (!userId || !channelId || !solapiChannelId || !templateCode || !messages) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: userId, channelId, solapiChannelId, templateCode, messages' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'messages must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SOLAPI_API_KEY = env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solapi credentials not configured' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Authorization header
    const authString = Buffer.from(`${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`).toString('base64');

    console.log('📤 Sending alimtalk:', {
      channelId: solapiChannelId,
      templateCode,
      messageCount: messages.length
    });

    // Send messages via Solapi
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const message of messages) {
      try {
        const response = await fetch('https://api.solapi.com/messages/v4/send', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              to: message.to,
              from: solapiChannelId, // 발신번호 (채널 ID)
              type: 'ATA', // Alimtalk
              kakaoOptions: {
                pfId: solapiChannelId,
                templateId: templateCode,
                variables: message.variables || {},
                buttons: message.buttons || []
              },
              text: message.content
            }
          })
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          results.push({
            to: message.to,
            success: true,
            messageId: data.messageId || data.groupId
          });
        } else {
          failCount++;
          results.push({
            to: message.to,
            success: false,
            error: data.errorMessage || data.message
          });
        }

      } catch (error: any) {
        failCount++;
        results.push({
          to: message.to,
          success: false,
          error: error.message
        });
      }
    }

    // Update user points (deduct cost)
    const totalCost = successCount * 15; // 15 points per message
    if (totalCost > 0) {
      const db = env.DB;
      
      // Get current points
      const user = await db.prepare(`
        SELECT points FROM User WHERE id = ?
      `).bind(userId).first();

      if (user && user.points >= totalCost) {
        // Deduct points
        await db.prepare(`
          UPDATE User SET points = points - ? WHERE id = ?
        `).bind(totalCost, userId).run();
      }
    }

    console.log('📥 Alimtalk send result:', {
      total: messages.length,
      success: successCount,
      fail: failCount,
      cost: totalCost
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        successCount,
        failCount,
        totalCost,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Send alimtalk error:', error);
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
