/**
 * API: 상품 조회 로그 목록 조회 (관리자)
 * GET /api/admin/product-view-logs
 * 
 * 관리자가 사용자들의 상품 조회 이력을 확인
 */

export async function onRequest(context: any) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !env.JWT_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode token and verify admin role
    let isAdmin = false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = payload.role === 'ADMIN' || payload.role === 'admin';
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = `
      SELECT 
        id,
        userId,
        userEmail,
        userName,
        productId,
        productName,
        ipAddress,
        userAgent,
        createdAt
      FROM ProductViewLog
      WHERE 1=1
    `;

    const params: any[] = [];

    if (productId) {
      query += ` AND productId = ?`;
      params.push(productId);
    }

    if (userId) {
      query += ` AND userId = ?`;
      params.push(userId);
    }

    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute query
    const stmt = env.DB.prepare(query).bind(...params);
    const result = await stmt.all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ProductViewLog WHERE 1=1`;
    const countParams: any[] = [];

    if (productId) {
      countQuery += ` AND productId = ?`;
      countParams.push(productId);
    }

    if (userId) {
      countQuery += ` AND userId = ?`;
      countParams.push(userId);
    }

    const countStmt = env.DB.prepare(countQuery).bind(...countParams);
    const countResult = await countStmt.first();

    // Get stats
    const statsQuery = `
      SELECT 
        COUNT(*) as totalViews,
        COUNT(DISTINCT userId) as uniqueUsers,
        COUNT(DISTINCT productId) as uniqueProducts,
        productName,
        COUNT(*) as viewCount
      FROM ProductViewLog
      GROUP BY productId, productName
      ORDER BY viewCount DESC
      LIMIT 10
    `;
    const statsResult = await env.DB.prepare(statsQuery).all();

    return new Response(JSON.stringify({ 
      success: true,
      logs: result.results || [],
      total: countResult?.total || 0,
      limit,
      offset,
      stats: {
        totalViews: statsResult.results?.[0]?.totalViews || 0,
        uniqueUsers: statsResult.results?.[0]?.uniqueUsers || 0,
        uniqueProducts: statsResult.results?.[0]?.uniqueProducts || 0,
        topProducts: statsResult.results || []
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching product view logs:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
