// Debug: Check user ID
// GET /api/debug/user-info

interface Env {
  DB: D1Database;
}

// Token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);
    
    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'No valid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userId = parseInt(tokenData.id);
    
    // User 테이블에서 사용자 정보 조회
    const user = await env.DB.prepare(`
      SELECT id, email, role FROM users WHERE id = ?
    `).bind(userId).first();
    
    // 이메일로도 조회
    const userByEmail = await env.DB.prepare(`
      SELECT id, email, role FROM users WHERE email = ?
    `).bind(tokenData.email).first();
    
    return new Response(JSON.stringify({
      tokenData: {
        id: tokenData.id,
        parsedId: userId,
        email: tokenData.email,
        role: tokenData.role
      },
      userById: user,
      userByEmail: userByEmail,
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
