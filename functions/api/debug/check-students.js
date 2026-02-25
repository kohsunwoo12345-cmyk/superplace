// Debug API to check student data directly
export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    
    if (!DB) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 1. Get table schema
    const schemaResult = await DB.prepare('PRAGMA table_info(User)').all();
    
    // 2. Get all students (no filter)
    const allStudentsResult = await DB.prepare(`
      SELECT id, name, email, phone, academyId, role, createdAt 
      FROM User 
      WHERE role = 'STUDENT' 
      ORDER BY createdAt DESC 
      LIMIT 20
    `).all();
    
    // 3. If academyId provided, filter by it
    let filteredStudents = [];
    if (academyId) {
      const filteredResult = await DB.prepare(`
        SELECT id, name, email, phone, academyId, role, createdAt 
        FROM User 
        WHERE role = 'STUDENT' AND academyId = ?
        ORDER BY createdAt DESC
      `).bind(academyId).all();
      filteredStudents = filteredResult.results || [];
    }
    
    // 4. Get all academy IDs
    const academyIdsResult = await DB.prepare(`
      SELECT DISTINCT academyId 
      FROM User 
      WHERE role = 'STUDENT' AND academyId IS NOT NULL
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      schema: schemaResult.results,
      totalStudents: allStudentsResult.results?.length || 0,
      allStudents: allStudentsResult.results || [],
      filteredBy: academyId || 'none',
      filteredStudents: filteredStudents,
      uniqueAcademyIds: academyIdsResult.results || []
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
