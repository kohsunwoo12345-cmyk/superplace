// Activity Logs API - JavaScript version

export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const db = env.DB;
    const userId = params.id;

    console.log('📋 Activity logs API called for userId:', userId);

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to get activity logs, return empty array if table doesn't exist
    let logs = [];
    try {
      const result = await db.prepare(`
        SELECT * FROM ActivityLog
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `).bind(userId).all();
      
      logs = result.results || [];
    } catch (error) {
      console.log('⚠️ ActivityLog table not found or error:', error.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      logs: logs 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Activity logs error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      logs: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
