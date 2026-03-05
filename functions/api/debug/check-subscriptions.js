// Debug API to check subscription data directly from DB

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
    role: parts[2],
    academyId: parts[3] || null,
  };
}

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId') || user.academyId;

    if (!academyId) {
      return new Response(JSON.stringify({ 
        error: 'Missing academyId',
        user: user
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 DEBUG: Checking subscriptions for academy: ${academyId}`);

    // Raw query to see what's actually in the DB
    const rawSubscriptions = await DB.prepare(`
      SELECT *
      FROM AcademyBotSubscription
      WHERE academyId = ?
      ORDER BY createdAt DESC
    `).bind(academyId).all();

    console.log(`🔍 DEBUG: Found ${rawSubscriptions.results?.length || 0} raw subscriptions`);

    // Check ai_bots table
    const bots = await DB.prepare(`
      SELECT id, name, isActive
      FROM ai_bots
      WHERE isActive = 1
      LIMIT 10
    `).all();

    console.log(`🔍 DEBUG: Found ${bots.results?.length || 0} active bots`);

    // Check academy table
    const academy = await DB.prepare(`
      SELECT id, name, directorEmail
      FROM academy
      WHERE id = ?
    `).bind(academyId).first();

    console.log(`🔍 DEBUG: Academy found:`, academy);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          academyId: user.academyId
        },
        academy: academy,
        rawSubscriptions: rawSubscriptions.results || [],
        subscriptionCount: rawSubscriptions.results?.length || 0,
        activeBots: bots.results || [],
        botCount: bots.results?.length || 0,
        debug: {
          academyIdFromToken: user.academyId,
          academyIdFromQuery: url.searchParams.get('academyId'),
          academyIdUsed: academyId
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ DEBUG API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Debug API failed',
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
