// Alimtalk Templates API
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

  // Handle OPTIONS
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = env.DB;

    if (method === 'GET') {
      // Get templates list
      const userId = url.searchParams.get('userId');
      const channelId = url.searchParams.get('channelId');

      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = `
        SELECT 
          t.*,
          c.channelName,
          c.solapiChannelId as channelSolapiId
        FROM AlimtalkTemplate t
        LEFT JOIN KakaoChannel c ON t.channelId = c.id
        WHERE t.userId = ?
      `;
      const params = [userId];

      if (channelId) {
        query += ' AND t.channelId = ?';
        params.push(channelId);
      }

      query += ' ORDER BY t.createdAt DESC';

      const result = await db.prepare(query).bind(...params).all();

      return new Response(
        JSON.stringify({ success: true, templates: result.results || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (method === 'POST') {
      // Create new template and register with Solapi
      const body = await request.json();
      const {
        userId,
        channelId,
        solapiChannelId,
        templateCode,
        templateName,
        content,
        extra,
        messageType,
        emphasizeType,
        securityFlag,
        buttons,
        inspectorComment,
        variables
      } = body;

      if (!userId || !channelId || !solapiChannelId || !templateName || !content) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: userId, channelId, solapiChannelId, templateName, content' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get Solapi credentials
      const SOLAPI_API_KEY = env['SOLAPI_API_Key '] || env.SOLAPI_API_Key || env.SOLAPI_API_KEY;
      const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET;

      if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
        return new Response(
          JSON.stringify({ success: false, error: 'Solapi credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique template code if not provided
      const finalTemplateCode = templateCode || `TPL_${Date.now()}`;

      // Create HMAC signature for Solapi API
      const dateTime = new Date().toISOString();
      const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hmacData = dateTime + salt;
      
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

      // Prepare Solapi request body
      const solapiBody: any = {
        plusFriendId: solapiChannelId,
        templateCode: finalTemplateCode,
        templateName,
        content,
        messageType: messageType || 'BA',
        securityFlag: securityFlag || false
      };

      if (extra) solapiBody.extra = extra;
      if (emphasizeType && emphasizeType !== 'NONE') solapiBody.emphasizeType = emphasizeType;
      if (buttons && buttons.length > 0) solapiBody.buttons = buttons;
      if (inspectorComment) solapiBody.comments = [{ name: '검수자 참고', content: inspectorComment }];

      console.log('📤 Registering template with Solapi:', {
        ...solapiBody,
        plusFriendId: solapiChannelId.substring(0, 10) + '...'
      });

      // Register template with Solapi
      const solapiResponse = await fetch('https://api.solapi.com/kakao/v1/alimtalk/templates', {
        method: 'POST',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${dateTime}, salt=${salt}, signature=${signatureHex}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(solapiBody)
      });

      const solapiData = await solapiResponse.json();

      console.log('📥 Solapi template registration response:', {
        status: solapiResponse.status,
        ok: solapiResponse.ok,
        data: solapiData
      });

      if (!solapiResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: solapiData.errorMessage || 'Failed to register template with Solapi',
            details: solapiData
          }),
          { status: solapiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save to database
      const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO AlimtalkTemplate (
          id, userId, channelId, templateCode, templateName, content,
          categoryCode, messageType, emphasizeType, buttons, quickReplies, variables,
          solapiTemplateId, status, inspectionStatus, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'PENDING', ?, ?)
      `).bind(
        id,
        userId,
        channelId,
        finalTemplateCode,
        templateName,
        content,
        null,
        messageType || 'BA',
        emphasizeType || 'NONE',
        buttons ? JSON.stringify(buttons) : null,
        null,
        variables ? JSON.stringify(variables) : null,
        solapiData.templateId || solapiData.id || null,
        now,
        now
      ).run();

      // Fetch the created template
      const template = await db.prepare(`
        SELECT * FROM AlimtalkTemplate WHERE id = ?
      `).bind(id).first();

      return new Response(
        JSON.stringify({ 
          success: true, 
          template,
          solapiData,
          message: '템플릿이 Solapi에 등록되었습니다. 카카오 검수 완료 후 사용 가능합니다.' 
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (method === 'DELETE') {
      // Delete template
      const templateId = url.searchParams.get('templateId');
      const userId = url.searchParams.get('userId');

      if (!templateId || !userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'templateId and userId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify ownership
      const template = await db.prepare(`
        SELECT * FROM AlimtalkTemplate WHERE id = ? AND userId = ?
      `).bind(templateId, userId).first();

      if (!template) {
        return new Response(
          JSON.stringify({ success: false, error: 'Template not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete template
      await db.prepare(`
        DELETE FROM AlimtalkTemplate WHERE id = ? AND userId = ?
      `).bind(templateId, userId).run();

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '템플릿이 삭제되었습니다.' 
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
    console.error('Templates API error:', error);
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
