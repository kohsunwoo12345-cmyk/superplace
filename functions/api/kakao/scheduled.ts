// Scheduled Alimtalk Management API
export async function onRequest(context: any) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: 'userId is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // GET: Fetch scheduled sends
    if (request.method === 'GET') {
      const result = await env.DB.prepare(`
        SELECT 
          id, userId, channelName, templateName, 
          recipientCount, scheduledAt, status, createdAt
        FROM ScheduledAlimtalk
        WHERE userId = ?
        ORDER BY scheduledAt DESC
      `).bind(userId).all();

      const scheduled = result.results.map((row: any) => ({
        id: row.id,
        channelName: row.channelName,
        templateName: row.templateName,
        recipientCount: parseInt(row.recipientCount || 0),
        scheduledAt: row.scheduledAt,
        status: row.status,
        createdAt: row.createdAt
      }));

      return new Response(
        JSON.stringify({ success: true, scheduled }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE: Cancel scheduled send
    if (request.method === 'DELETE') {
      const scheduleId = url.searchParams.get('scheduleId');

      if (!scheduleId) {
        return new Response(
          JSON.stringify({ success: false, error: 'scheduleId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify ownership
      const check = await env.DB.prepare(`
        SELECT id, status FROM ScheduledAlimtalk
        WHERE id = ? AND userId = ?
      `).bind(scheduleId, userId).first();

      if (!check) {
        return new Response(
          JSON.stringify({ success: false, error: 'Schedule not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (check.status !== 'PENDING') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Only pending schedules can be cancelled' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update status to CANCELLED
      await env.DB.prepare(`
        UPDATE ScheduledAlimtalk
        SET status = 'CANCELLED', updatedAt = ?
        WHERE id = ?
      `).bind(new Date().toISOString(), scheduleId).run();

      return new Response(
        JSON.stringify({ success: true, message: 'Schedule cancelled successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Scheduled API error:', error);
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
