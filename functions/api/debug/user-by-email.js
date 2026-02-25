// Debug API to check what's actually stored in DB
// GET /api/debug/user-by-email?email=xxx

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email parameter required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔍 Looking up user:', email);
    
    // Try with batch() to read from PRIMARY
    const stmt = db.prepare(`
      SELECT id, email, password, name, phone, role, academyId, approved, createdAt
      FROM User
      WHERE email = ?
    `).bind(email);
    
    const batchResults = await db.batch([stmt]);
    const user = batchResults[0].results[0];
    
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User not found',
        email: email
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return user data (including password hash for debugging)
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        password: user.password,
        passwordLength: user.password?.length || 0,
        passwordPrefix: user.password?.substring(0, 10) + '...',
        name: user.name,
        phone: user.phone,
        role: user.role,
        academyId: user.academyId,
        approved: user.approved,
        createdAt: user.createdAt
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Debug API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
