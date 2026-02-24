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
    role: parts[2]
  };
}

/**
 * GET /api/admin/coupons
 * 쿠폰 목록 조회
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

    if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can view coupons' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📋 Fetching coupons');

    // 쿠폰 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS Coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        discountType TEXT NOT NULL,
        discountValue REAL NOT NULL,
        minPurchaseAmount REAL DEFAULT 0,
        maxDiscountAmount REAL DEFAULT 0,
        usageLimit INTEGER DEFAULT -1,
        usageCount INTEGER DEFAULT 0,
        userUsageLimit INTEGER DEFAULT 1,
        validFrom TEXT NOT NULL,
        validUntil TEXT NOT NULL,
        applicableProducts TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const { results } = await env.DB.prepare(`
      SELECT * FROM Coupons
      ORDER BY createdAt DESC
    `).all();

    console.log(`✅ Found ${results.length} coupons`);

    return new Response(JSON.stringify({ 
      coupons: results 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch coupons:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch coupons',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/admin/coupons
 * 새 쿠폰 생성
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

    if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can create coupons' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minPurchaseAmount = 0,
      maxDiscountAmount = 0,
      usageLimit = -1,
      userUsageLimit = 1,
      validFrom,
      validUntil,
      applicableProducts = "",
      isActive = 1
    } = body;

    if (!code || !name || !discountType || !discountValue || !validFrom || !validUntil) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 코드 중복 확인
    const existing = await env.DB.prepare(`
      SELECT id FROM Coupons WHERE code = ?
    `).bind(code).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Coupon code already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const couponId = `cpn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO Coupons (
        id, code, name, description, discountType, discountValue,
        minPurchaseAmount, maxDiscountAmount, usageLimit, userUsageLimit,
        validFrom, validUntil, applicableProducts, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      couponId,
      code,
      name,
      description || '',
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      applicableProducts,
      isActive,
      now,
      now
    ).run();

    console.log('✅ Coupon created:', couponId);

    return new Response(JSON.stringify({ 
      success: true,
      couponId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to create coupon:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create coupon',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
