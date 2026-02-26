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
 * GET /api/store/inquiries?productId=xxx
 * 제품 문의 목록 조회
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!productId) {
      return new Response(JSON.stringify({ 
        error: 'productId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build query based on permissions
    let query = `
      SELECT * FROM ProductInquiries 
      WHERE productId = ? 
    `;
    const bindings: any[] = [productId];

    // Non-secret inquiries or user's own inquiries or admin
    if (tokenData) {
      if (tokenData.role === 'SUPER_ADMIN' || tokenData.role === 'ADMIN') {
        // Admin can see all
      } else {
        // Users can see non-secret and their own
        query += ` AND (isSecret = 0 OR userId = ?)`;
        bindings.push(tokenData.id);
      }
    } else {
      // Not logged in - only non-secret
      query += ` AND isSecret = 0`;
    }

    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const { results: inquiries } = await env.DB.prepare(query).bind(...bindings).all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ProductInquiries WHERE productId = ?`;
    const countBindings: any[] = [productId];
    
    if (tokenData) {
      if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
        countQuery += ` AND (isSecret = 0 OR userId = ?)`;
        countBindings.push(tokenData.id);
      }
    } else {
      countQuery += ` AND isSecret = 0`;
    }

    const { results: countResults } = await env.DB.prepare(countQuery).bind(...countBindings).all();
    const total = (countResults[0] as any)?.total || 0;

    // Get user's inquiries if userId provided
    let userInquiries = [];
    if (userId) {
      const { results } = await env.DB.prepare(`
        SELECT * FROM ProductInquiries 
        WHERE productId = ? AND userId = ? 
        ORDER BY createdAt DESC
      `).bind(productId, userId).all();
      userInquiries = results;
    }

    return new Response(JSON.stringify({
      success: true,
      inquiries,
      total,
      userInquiries,
      pagination: {
        limit,
        offset,
        hasMore: offset + inquiries.length < total
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch inquiries:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch inquiries',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/store/inquiries
 * 문의 작성
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
    const {
      productId,
      productName,
      type = 'general',
      isSecret = 0,
      question
    } = body;

    if (!productId || !question) {
      return new Response(JSON.stringify({ 
        error: 'productId and question are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validTypes = ['general', 'shipping', 'payment', 'product', 'etc'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid inquiry type' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const inquiryId = `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO ProductInquiries (
        id, productId, productName, userId, userName, userEmail,
        type, isSecret, question, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      inquiryId, productId, productName, tokenData.id,
      tokenData.name, tokenData.email, type, isSecret ? 1 : 0,
      question, now, now
    ).run();

    console.log('✅ Inquiry created:', inquiryId);

    return new Response(JSON.stringify({
      success: true,
      inquiryId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to create inquiry:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create inquiry',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * PUT /api/store/inquiries
 * 문의 답변 (관리자만)
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
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

    if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        error: 'Only admin can answer inquiries' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { id, answer } = body;

    if (!id || !answer) {
      return new Response(JSON.stringify({ 
        error: 'id and answer are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE ProductInquiries 
      SET answer = ?, 
          answeredBy = ?, 
          answeredByEmail = ?,
          answeredAt = ?,
          status = 'answered',
          updatedAt = ?
      WHERE id = ?
    `).bind(answer, tokenData.id, tokenData.email, now, now, id).run();

    console.log('✅ Inquiry answered:', id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to answer inquiry:', error);
    return new Response(JSON.stringify({
      error: 'Failed to answer inquiry',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/store/inquiries?id=xxx
 * 문의 삭제
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
    const inquiryId = url.searchParams.get('id');

    if (!inquiryId) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check ownership or admin
    const { results: inquiries } = await env.DB.prepare(`
      SELECT userId FROM ProductInquiries WHERE id = ?
    `).bind(inquiryId).all();

    if (inquiries.length === 0) {
      return new Response(JSON.stringify({ error: 'Inquiry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const inquiry = inquiries[0] as any;
    if (inquiry.userId !== tokenData.id && 
        tokenData.role !== 'SUPER_ADMIN' && 
        tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        error: 'You can only delete your own inquiries' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`DELETE FROM ProductInquiries WHERE id = ?`).bind(inquiryId).run();

    console.log('✅ Inquiry deleted:', inquiryId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to delete inquiry:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete inquiry',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
