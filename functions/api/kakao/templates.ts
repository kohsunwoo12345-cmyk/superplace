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

      let query = 'SELECT * FROM AlimtalkTemplate WHERE userId = ?';
      const params = [userId];

      if (channelId) {
        query += ' AND channelId = ?';
        params.push(channelId);
      }

      query += ' ORDER BY createdAt DESC';

      const result = await db.prepare(query).bind(...params).all();

      return new Response(
        JSON.stringify({ success: true, templates: result.results || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (method === 'POST') {
      // Create new template
      const body = await request.json();
      const {
        userId,
        channelId,
        templateName,
        content,
        categoryCode,
        messageType,
        emphasizeType,
        buttons,
        quickReplies,
        variables
      } = body;

      if (!userId || !channelId || !templateName || !content) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: userId, channelId, templateName, content' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique ID and template code
      const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const templateCode = `TPL_${Date.now()}`;
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO AlimtalkTemplate (
          id, userId, channelId, templateCode, templateName, content,
          categoryCode, messageType, emphasizeType, buttons, quickReplies, variables,
          status, inspectionStatus, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', ?, ?)
      `).bind(
        id,
        userId,
        channelId,
        templateCode,
        templateName,
        content,
        categoryCode || null,
        messageType || 'BA',
        emphasizeType || 'NONE',
        buttons ? JSON.stringify(buttons) : null,
        quickReplies ? JSON.stringify(quickReplies) : null,
        variables ? JSON.stringify(variables) : null,
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
          message: '템플릿이 생성되었습니다.' 
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
