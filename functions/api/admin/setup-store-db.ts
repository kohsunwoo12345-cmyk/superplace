import { Env } from '../types';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    // store_products 테이블 생성 (쇼핑몰 제품)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS store_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price INTEGER,
        discount_price INTEGER,
        image_url TEXT,
        featured INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        detail_html TEXT,
        bot_id TEXT,
        keywords TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // bot_purchases 테이블 생성 (봇 구매 신청)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS bot_purchases (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        academy_id TEXT,
        director_name TEXT NOT NULL,
        director_phone TEXT NOT NULL,
        director_email TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        subscription_period INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        approved_by TEXT,
        approved_at DATETIME,
        bot_assigned INTEGER DEFAULT 0,
        bot_assignment_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES store_products(id)
      )
    `);

    // 인덱스 생성
    await env.DB.exec(`
      CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
      CREATE INDEX IF NOT EXISTS idx_store_products_featured ON store_products(featured);
      CREATE INDEX IF NOT EXISTS idx_store_products_active ON store_products(active);
      CREATE INDEX IF NOT EXISTS idx_bot_purchases_status ON bot_purchases(status);
      CREATE INDEX IF NOT EXISTS idx_bot_purchases_academy ON bot_purchases(academy_id);
    `);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'AI 봇 쇼핑몰 테이블이 생성되었습니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
