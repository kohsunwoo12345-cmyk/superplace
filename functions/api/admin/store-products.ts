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
 * GET /api/admin/store-products
 * 쇼핑몰 제품 목록 조회
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly') === 'true';

    console.log('🛒 Fetching store products, activeOnly:', activeOnly);

    // StoreProducts 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS StoreProducts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        section TEXT,
        description TEXT,
        shortDescription TEXT,
        price REAL DEFAULT 0,
        monthlyPrice REAL DEFAULT 0,
        yearlyPrice REAL DEFAULT 0,
        pricePerStudent REAL DEFAULT 0,
        originalPrice REAL DEFAULT 0,
        discountType TEXT DEFAULT 'none',
        discountValue REAL DEFAULT 0,
        promotionType TEXT DEFAULT 'none',
        promotionDescription TEXT,
        promotionStartDate TEXT,
        promotionEndDate TEXT,
        badges TEXT,
        isTimeDeal INTEGER DEFAULT 0,
        stockQuantity INTEGER DEFAULT -1,
        maxPurchasePerUser INTEGER DEFAULT -1,
        features TEXT,
        detailHtml TEXT,
        imageUrl TEXT,
        botId TEXT,
        isActive INTEGER DEFAULT 1,
        isFeatured INTEGER DEFAULT 0,
        displayOrder INTEGER DEFAULT 0,
        keywords TEXT,
        createdById TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    let query = 'SELECT * FROM StoreProducts';
    if (activeOnly) {
      query += ' WHERE isActive = 1';
    }
    query += ' ORDER BY displayOrder ASC, createdAt DESC';

    const { results } = await env.DB.prepare(query).all();

    console.log(`✅ Found ${results.length} products`);

    return new Response(JSON.stringify({ 
      products: results 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch products:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch products',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/admin/store-products
 * 새 제품 생성
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
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can create products' }), {
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

    if (!name || !category) {
      return new Response(JSON.stringify({ error: 'Name and category are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // StoreProducts 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS StoreProducts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        section TEXT,
        description TEXT,
        shortDescription TEXT,
        price REAL DEFAULT 0,
        monthlyPrice REAL DEFAULT 0,
        yearlyPrice REAL DEFAULT 0,
        pricePerStudent REAL DEFAULT 0,
        originalPrice REAL DEFAULT 0,
        discountType TEXT DEFAULT 'none',
        discountValue REAL DEFAULT 0,
        promotionType TEXT DEFAULT 'none',
        promotionDescription TEXT,
        promotionStartDate TEXT,
        promotionEndDate TEXT,
        badges TEXT,
        isTimeDeal INTEGER DEFAULT 0,
        stockQuantity INTEGER DEFAULT -1,
        maxPurchasePerUser INTEGER DEFAULT -1,
        features TEXT,
        detailHtml TEXT,
        imageUrl TEXT,
        botId TEXT,
        isActive INTEGER DEFAULT 1,
        isFeatured INTEGER DEFAULT 0,
        displayOrder INTEGER DEFAULT 0,
        keywords TEXT,
        createdById TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO StoreProducts (
        id, name, category, section, description, shortDescription,
        price, monthlyPrice, yearlyPrice, pricePerStudent,
        originalPrice, discountType, discountValue,
        promotionType, promotionDescription, promotionStartDate, promotionEndDate,
        badges, isTimeDeal, stockQuantity, maxPurchasePerUser,
        features, detailHtml, imageUrl, botId,
        isActive, isFeatured, displayOrder, keywords,
        createdById, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      productId,
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
      tokenData.id,
      now,
      now
    ).run();

    console.log('✅ Product created:', productId);

    return new Response(JSON.stringify({ 
      success: true,
      productId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to create product:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create product',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
