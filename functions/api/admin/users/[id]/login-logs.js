// Login Logs API - JavaScript version

export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const db = env.DB;
    const userId = params.id;

    console.log('📋 Login logs API called for userId:', userId);

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to get login logs, return empty array if table doesn't exist
    let logs = [];
    try {
      const result = await db.prepare(`
        SELECT * FROM LoginLog
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `).bind(userId).all();
      
      logs = result.results || [];
    } catch (error) {
      console.log('⚠️ LoginLog table not found or error:', error.message);
      // Return empty logs if table doesn't exist
    }

    return new Response(JSON.stringify({ 
      success: true,
      logs: logs 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Login logs error:', error);
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
