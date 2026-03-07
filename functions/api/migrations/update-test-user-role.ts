// Update specific user role
// GET /api/migrations/update-test-user-role

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    console.log('🔧 Updating test user role to ADMIN');

    // Update wangholy1@naver.com role to ADMIN
    await env.DB.prepare(`
      UPDATE users SET role = 'ADMIN' WHERE email = 'wangholy1@naver.com'
    `).run();

    console.log('✅ User role updated');

    // Verify
    const user = await env.DB.prepare(`
      SELECT id, email, role, name FROM users WHERE email = 'wangholy1@naver.com'
    `).first();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User role updated to ADMIN',
        user: user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Update error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Update failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
