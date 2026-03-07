// Update user role to ADMIN
// GET /api/admin/update-user-role?email=xxx&role=ADMIN

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const role = url.searchParams.get('role');

  if (!email || !role) {
    return new Response(
      JSON.stringify({ error: 'email and role parameters required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    await env.DB.prepare(`
      UPDATE users SET role = ? WHERE email = ?
    `).bind(role, email).run();

    const user = await env.DB.prepare(`
      SELECT id, email, role, name FROM users WHERE email = ?
    `).bind(email).first();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Role updated to ${role}`,
        user: user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
