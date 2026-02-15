import { Env } from '../types';

// POST: 봇 구매 신청
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const data = await request.json();
    const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 제품 정보 조회
    const product = await env.DB.prepare(`
      SELECT * FROM store_products WHERE id = ?
    `).bind(data.product_id).first();

    if (!product) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '제품을 찾을 수 없습니다.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 구매 신청 저장
    await env.DB.prepare(`
      INSERT INTO bot_purchases (
        id, product_id, product_name, academy_id,
        director_name, director_phone, director_email,
        payment_method, subscription_period, total_amount,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      purchaseId,
      data.product_id,
      product.name,
      data.academy_id || '',
      data.director_name,
      data.director_phone,
      data.director_email,
      data.payment_method,
      data.subscription_period,
      data.total_amount,
      data.notes || ''
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      purchaseId,
      message: '구매 신청이 완료되었습니다. 관리자 승인 후 봇이 할당됩니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Purchase error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
