// Debug API - Get ALL classes in database (no filtering)

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('🔍 DEBUG: Get all classes API called');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token (for authentication only)
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get ALL classes without filtering
    console.log('🔍 DEBUG: Fetching ALL classes from database...');
    
    const result = await db.prepare(`
      SELECT 
        c.id,
        c.academy_id,
        c.class_name,
        c.grade,
        c.description,
        c.teacher_id,
        c.color,
        c.created_at
      FROM classes c
      ORDER BY c.created_at DESC
      LIMIT 50
    `).all();

    const classes = result.results || [];

    console.log(`🔍 DEBUG: Found ${classes.length} total classes in database`);
    
    // Log first few for debugging
    if (classes.length > 0) {
      console.log('🔍 DEBUG: First 3 classes:', JSON.stringify(classes.slice(0, 3), null, 2));
    }

    return new Response(JSON.stringify({
      success: true,
      classes: classes,
      count: classes.length,
      message: `Total ${classes.length} classes in database`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ DEBUG API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      classes: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
