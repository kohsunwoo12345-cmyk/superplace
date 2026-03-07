// Admin API: Get user by email
// GET /api/admin/get-user-by-email?email=xxx

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  try {
    const email = url.searchParams.get('email');
    
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'email parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Searching for user with email:', email);

    // Search users table
    const user = await env.DB.prepare(`
      SELECT id, name, email, role, academyId, created_at as createdAt
      FROM users 
      WHERE email = ?
      LIMIT 1
    `).bind(email).first();

    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found',
          email: email 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also get KakaoChannel info for this user
    const channels = await env.DB.prepare(`
      SELECT id, channelName, searchId, solapiChannelId, status, created_at as createdAt
      FROM KakaoChannel
      WHERE userId = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    console.log('✅ Found user:', user.id, user.name, user.email);
    console.log('📱 Channels:', channels.results?.length || 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: user,
        channels: channels.results || [],
        channelCount: channels.results?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Get user by email error:', error);
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
