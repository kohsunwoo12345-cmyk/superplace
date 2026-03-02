// Simple debug endpoint to check director count
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // Count all directors
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM User
      WHERE role = 'DIRECTOR'
    `).first();
    
    // Get sample directors
    const sample = await env.DB.prepare(`
      SELECT id, name, email, academyId, createdAt
      FROM User
      WHERE role = 'DIRECTOR'
      ORDER BY createdAt DESC
      LIMIT 20
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      totalDirectors: result.count,
      sampleDirectors: sample.results || []
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
