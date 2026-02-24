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
 * PUT /api/admin/coupons/[id]
 * 쿠폰 수정
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

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
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can update coupons' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const couponId = params.id as string;
    const body = await request.json();

    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      applicableProducts,
      isActive
    } = body;

    // 쿠폰 존재 확인
    const existing = await env.DB.prepare(`
      SELECT id FROM Coupons WHERE id = ?
    `).bind(couponId).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Coupon not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 코드 중복 확인 (다른 쿠폰과)
    if (code) {
      const duplicate = await env.DB.prepare(`
        SELECT id FROM Coupons WHERE code = ? AND id != ?
      `).bind(code, couponId).first();

      if (duplicate) {
        return new Response(JSON.stringify({ error: 'Coupon code already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const now = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE Coupons
      SET 
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        discountType = COALESCE(?, discountType),
        discountValue = COALESCE(?, discountValue),
        minPurchaseAmount = COALESCE(?, minPurchaseAmount),
        maxDiscountAmount = COALESCE(?, maxDiscountAmount),
        usageLimit = COALESCE(?, usageLimit),
        userUsageLimit = COALESCE(?, userUsageLimit),
        validFrom = COALESCE(?, validFrom),
        validUntil = COALESCE(?, validUntil),
        applicableProducts = COALESCE(?, applicableProducts),
        isActive = COALESCE(?, isActive),
        updatedAt = ?
      WHERE id = ?
    `).bind(
      code,
      name,
      description,
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
      couponId
    ).run();

    console.log('✅ Coupon updated:', couponId);

    return new Response(JSON.stringify({ 
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to update coupon:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update coupon',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/admin/coupons/[id]
 * 쿠폰 삭제
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

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
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can delete coupons' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const couponId = params.id as string;

    // 쿠폰 존재 확인
    const existing = await env.DB.prepare(`
      SELECT id FROM Coupons WHERE id = ?
    `).bind(couponId).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Coupon not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`
      DELETE FROM Coupons WHERE id = ?
    `).bind(couponId).run();

    console.log('✅ Coupon deleted:', couponId);

    return new Response(JSON.stringify({ 
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to delete coupon:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete coupon',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
