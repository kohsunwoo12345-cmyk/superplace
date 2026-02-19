// Bot Assignments API - JavaScript version

export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const db = env.DB;
    const userId = params.id;

    console.log('🤖 Bot assignments API called for userId:', userId);

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to get bot assignments, return empty array if table doesn't exist
    let assignments = [];
    try {
      const result = await db.prepare(`
        SELECT * FROM BotAssignment
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `).bind(userId).all();
      
      assignments = result.results || [];
    } catch (error) {
      console.log('⚠️ BotAssignment table not found or error:', error.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      assignments: assignments 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Bot assignments error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      assignments: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
