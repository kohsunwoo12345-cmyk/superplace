/**
 * NextAuth Session API for Static Export
 * GET /api/auth/session
 */

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...v] = c.split('=');
        return [key, v.join('=')];
      })
    );

    const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];

    if (!sessionToken) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Validate session token with D1 database
    // For now, return empty session
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Session API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
