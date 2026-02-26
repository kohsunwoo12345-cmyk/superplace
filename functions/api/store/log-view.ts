/**
 * API: 상품 조회 로그 기록
 * POST /api/store/log-view
 * 
 * 사용자가 상품 상세 페이지를 조회할 때마다 로그 기록
 */

export async function onRequest(context: any) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Get user from token (optional - can log anonymous views)
    let userId = null;
    let userEmail = null;
    let userName = null;

    if (token && env.JWT_SECRET) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || payload.id;
        userEmail = payload.email;
        userName = payload.name;
      } catch (e) {
        console.log('Token decode failed, logging as anonymous');
      }
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get product info
    const product = await env.DB.prepare(
      `SELECT id, name FROM StoreProduct WHERE id = ?`
    ).bind(productId).first();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get IP address
    const ipAddress = request.headers.get('cf-connecting-ip') || 
                      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the view
    await env.DB.prepare(
      `INSERT INTO ProductViewLog 
       (id, userId, userEmail, userName, productId, productName, ipAddress, userAgent, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      crypto.randomUUID(),
      userId,
      userEmail,
      userName,
      productId,
      product.name,
      ipAddress,
      userAgent
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'View logged successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error logging product view:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
