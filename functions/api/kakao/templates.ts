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

      // Generate unique template code if not provided
      const finalTemplateCode = templateCode || `TPL_${Date.now()}`;

      // Solapi 템플릿은 콘솔에서 등록하는 것을 권장
      // API를 통한 등록은 복잡하고 제한적이므로, 로컬 DB에만 저장
      // 실제 Solapi 템플릿은 https://console.solapi.com 에서 등록 필요

      // Save to local database only
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
        finalTemplateCode, // Use templateCode as solapiTemplateId
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
          message: `템플릿이 로컬 DB에 저장되었습니다. Solapi 콘솔(https://console.solapi.com)에서 템플릿 코드 "${finalTemplateCode}"로 실제 템플릿을 등록해주세요.`,
          warning: 'Solapi 콘솔에서 템플릿을 등록하고 검수 완료해야 발송 가능합니다.'
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
