import type { PagesFunction } from '@cloudflare/workers-types';

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
    role: parts[2],
    name: parts[3] || ''
  };
}

/**
 * GET /api/store/wishlist
 * 찜하기 목록 조회
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results: wishlist } = await env.DB.prepare(`
      SELECT w.*, p.name, p.imageUrl, p.pricePerStudent, p.monthlyPrice
      FROM Wishlist w
      LEFT JOIN StoreProducts p ON w.productId = p.id
      WHERE w.userId = ?
      ORDER BY w.addedAt DESC
    `).bind(tokenData.id).all();

    return new Response(JSON.stringify({
      success: true,
      wishlist
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch wishlist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch wishlist',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/store/wishlist
 * 찜하기 추가
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return new Response(JSON.stringify({ error: 'productId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already in wishlist
    const { results: existing } = await env.DB.prepare(`
      SELECT id FROM Wishlist WHERE userId = ? AND productId = ?
    `).bind(tokenData.id, productId).all();

    if (existing.length > 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Already in wishlist' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const wishlistId = `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO Wishlist (id, userId, productId, addedAt)
      VALUES (?, ?, ?, ?)
    `).bind(wishlistId, tokenData.id, productId, now).run();

    console.log('✅ Added to wishlist:', wishlistId);

    return new Response(JSON.stringify({
      success: true,
      wishlistId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to add to wishlist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to add to wishlist',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/store/wishlist?productId=xxx
 * 찜하기 제거
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');

    if (!productId) {
      return new Response(JSON.stringify({ error: 'productId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`
      DELETE FROM Wishlist WHERE userId = ? AND productId = ?
    `).bind(tokenData.id, productId).run();

    console.log('✅ Removed from wishlist:', productId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to remove from wishlist:', error);
    return new Response(JSON.stringify({
      error: 'Failed to remove from wishlist',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
