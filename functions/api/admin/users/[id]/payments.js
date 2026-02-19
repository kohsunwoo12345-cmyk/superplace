// Payments API - JavaScript version

export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const db = env.DB;
    const userId = params.id;

    console.log('💳 Payments API called for userId:', userId);

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to get payments, return empty array if table doesn't exist
    let payments = [];
    try {
      const result = await db.prepare(`
        SELECT * FROM Payment
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `).bind(userId).all();
      
      payments = result.results || [];
    } catch (error) {
      console.log('⚠️ Payment table not found or error:', error.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      payments: payments 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Payments error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      payments: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
