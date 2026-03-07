// Kakao Alimtalk Send History API
export async function onRequest(context: any) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'GET') {
      // Get send history
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const channelId = url.searchParams.get('channelId');
      const templateId = url.searchParams.get('templateId');
      const status = url.searchParams.get('status');

      let query = `
        SELECT * FROM AlimtalkSendHistory 
        WHERE userId = ?
      `;
      const params: any[] = [userId];

      if (channelId) {
        query += ' AND channelId = ?';
        params.push(channelId);
      }

      if (templateId) {
        query += ' AND templateId = ?';
        params.push(templateId);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const history = await env.DB.prepare(query).bind(...params).all();

      // Get statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as totalSends,
          SUM(successCount) as totalSuccess,
          SUM(failCount) as totalFail,
          SUM(totalCost) as totalCost
        FROM AlimtalkSendHistory
        WHERE userId = ?
      `;
      const stats = await env.DB.prepare(statsQuery).bind(userId).first();

      return new Response(
        JSON.stringify({
          success: true,
          history: history.results || [],
          stats: stats || { totalSends: 0, totalSuccess: 0, totalFail: 0, totalCost: 0 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'POST') {
      // Save send history
      const body = await request.json();
      const {
        channelId,
        channelName,
        templateId,
        templateName,
        templateCode,
        recipientCount,
        successCount,
        failCount,
        totalCost,
        groupId,
        status
      } = body;

      const historyId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await env.DB.prepare(`
        INSERT INTO AlimtalkSendHistory (
          id, userId, channelId, channelName, templateId, templateName, templateCode,
          recipientCount, successCount, failCount, totalCost, groupId, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        historyId,
        userId,
        channelId,
        channelName,
        templateId,
        templateName,
        templateCode,
        recipientCount,
        successCount,
        failCount,
        totalCost,
        groupId || null,
        status || 'COMPLETED',
        new Date().toISOString()
      ).run();

      return new Response(
        JSON.stringify({
          success: true,
          historyId,
          message: 'Send history saved'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Send history error:', error);
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
