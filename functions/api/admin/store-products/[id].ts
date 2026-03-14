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
    academyId: parts[3] || null
  };
}

// Check if user has admin privileges
function isAdmin(role: string): boolean {
  const adminRoles = ['SUPER_ADMIN', 'SUPER_AD', 'ADMIN'];
  return adminRoles.includes(role);
}

/**
 * DELETE /api/admin/store-products/[id]
 * 제품 삭제
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const productId = params.id as string;

  try {
    // 권한 체크
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!isAdmin(tokenData.role)) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions',
        message: `Only ADMIN or SUPER_ADMIN can delete products` 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🗑️ Deleting product:', productId);

    await env.DB.prepare(`DELETE FROM StoreProducts WHERE id = ?`).bind(productId).run();

    console.log('✅ Product deleted:', productId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Product deleted successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to delete product:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete product',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * PUT /api/admin/store-products/[id]
 * 제품 수정
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const productId = params.id as string;

  try {
    // 권한 체크
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!isAdmin(tokenData.role)) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions',
        message: `Only ADMIN or SUPER_ADMIN can update products` 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      name,
      category,
      section,
      description,
      shortDescription,
      price = 0,
      monthlyPrice = 0,
      yearlyPrice = 0,
      pricePerStudent = 0,
      dailyChatLimit = 15,
      originalPrice = 0,
      discountType = 'none',
      discountValue = 0,
      promotionType = 'none',
      promotionDescription = '',
      promotionStartDate = '',
      promotionEndDate = '',
      badges = '',
      isTimeDeal = 0,
      stockQuantity = -1,
      maxPurchasePerUser = -1,
      features = '',
      detailHtml = '',
      imageUrl = '',
      botId = '',
      isActive = 1,
      isFeatured = 0,
      displayOrder = 0,
      keywords = ''
    } = body;

    console.log('✏️ Updating product:', productId);

    const now = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE StoreProducts SET
        name = ?,
        category = ?,
        section = ?,
        description = ?,
        shortDescription = ?,
        price = ?,
        monthlyPrice = ?,
        yearlyPrice = ?,
        pricePerStudent = ?,
        originalPrice = ?,
        discountType = ?,
        discountValue = ?,
        promotionType = ?,
        promotionDescription = ?,
        promotionStartDate = ?,
        promotionEndDate = ?,
        badges = ?,
        isTimeDeal = ?,
        stockQuantity = ?,
        maxPurchasePerUser = ?,
        features = ?,
        detailHtml = ?,
        imageUrl = ?,
        botId = ?,
        isActive = ?,
        isFeatured = ?,
        displayOrder = ?,
        keywords = ?,
        updatedAt = ?,
        dailyChatLimit = ?
      WHERE id = ?
    `).bind(
      name,
      category,
      section || '',
      description || '',
      shortDescription || '',
      price,
      monthlyPrice,
      yearlyPrice,
      pricePerStudent,
      originalPrice,
      discountType,
      discountValue,
      promotionType,
      promotionDescription,
      promotionStartDate,
      promotionEndDate,
      badges,
      isTimeDeal,
      stockQuantity,
      maxPurchasePerUser,
      features,
      detailHtml,
      imageUrl,
      botId,
      isActive,
      isFeatured,
      displayOrder,
      keywords,
      now,
      dailyChatLimit,
      productId
    ).run();

    console.log('✅ Product updated:', productId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Product updated successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to update product:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update product',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
