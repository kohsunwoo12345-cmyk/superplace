import { Env } from '../types';

// GET: 모든 제품 조회
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM store_products 
      ORDER BY display_order ASC, created_at DESC
    `).all();

    return new Response(JSON.stringify({ 
      success: true, 
      products: results || [] 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: 새 제품 추가
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const data = await request.json();
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await env.DB.prepare(`
      INSERT INTO store_products (
        id, name, category, description, price, discount_price,
        image_url, featured, active, display_order, detail_html,
        bot_id, keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      productId,
      data.name,
      data.category,
      data.description || '',
      data.price || 0,
      data.discount_price || 0,
      data.image_url || '',
      data.featured ? 1 : 0,
      data.active ? 1 : 0,
      data.display_order || 0,
      data.detail_html || '',
      data.bot_id || '',
      data.keywords || ''
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      productId,
      message: '제품이 추가되었습니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT: 제품 수정
export const onRequestPut = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { id, ...updates } = data;

    await env.DB.prepare(`
      UPDATE store_products 
      SET name = ?, category = ?, description = ?, price = ?, 
          discount_price = ?, image_url = ?, featured = ?, active = ?,
          display_order = ?, detail_html = ?, bot_id = ?, keywords = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      updates.name,
      updates.category,
      updates.description,
      updates.price,
      updates.discount_price,
      updates.image_url,
      updates.featured ? 1 : 0,
      updates.active ? 1 : 0,
      updates.display_order,
      updates.detail_html,
      updates.bot_id,
      updates.keywords,
      id
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: '제품이 수정되었습니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: 제품 삭제
export const onRequestDelete = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '제품 ID가 필요합니다.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`DELETE FROM store_products WHERE id = ?`).bind(id).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: '제품이 삭제되었습니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
