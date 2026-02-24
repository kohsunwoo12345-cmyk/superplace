import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

/**
 * POST /api/admin/seed-products
 * 테스트용 제품 데이터 생성
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    console.log('🌱 Seeding store products...');

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

    const now = new Date().toISOString();
    const products = [
      {
        id: 'product_001',
        name: '학교/학년 별 내신 대비 봇',
        category: 'academy_operation',
        section: 'academy_bots',
        description: '학년별로 맞춤화된 내신 대비 학습을 지원하는 AI 봇입니다. 학생 개개인의 학습 수준에 맞춘 문제 제공과 해설을 통해 효과적인 내신 준비가 가능합니다.',
        shortDescription: '학년별 맞춤 내신 대비 학습 지원',
        monthlyPrice: 50000,
        pricePerStudent: 990,
        keywords: '내신,학교,학년,시험,학습',
        isActive: 1,
        isFeatured: 0,
        displayOrder: 1
      },
      {
        id: 'product_002',
        name: '영어 내신 클리닉 마스터 봇',
        category: 'academy_operation',
        section: 'academy_bots',
        description: '학년별 영어내신 클리닉 마스터 - 24시간 AI 숙제 도우미 & 음성 튜터입니다. 듣기, 말하기, 읽기, 쓰기 모든 영역을 커버하며 실시간 피드백을 제공합니다.',
        shortDescription: '24시간 AI 영어 숙제 도우미 & 음성 튜터',
        monthlyPrice: 70000,
        pricePerStudent: 1200,
        keywords: '영어,내신,클리닉,숙제,튜터,음성',
        isActive: 1,
        isFeatured: 1,
        displayOrder: 2
      },
      {
        id: 'product_003',
        name: '블로그 SEO 사진 제작 봇',
        category: 'marketing_blog',
        section: 'marketing',
        description: '네이버 블로그 상위노출을 위한 AI 사진 생성 봇입니다. SEO 최적화된 이미지를 자동으로 생성하여 블로그 포스팅의 효과를 극대화합니다.',
        shortDescription: '네이버 블로그 상위노출 AI 사진 생성',
        monthlyPrice: 30000,
        keywords: '블로그,SEO,사진,네이버,상위노출,마케팅',
        isActive: 1,
        isFeatured: 1,
        displayOrder: 3
      },
      {
        id: 'product_004',
        name: '수학 개념 마스터 봇',
        category: 'academy_operation',
        section: 'academy_bots',
        description: '수학 개념을 쉽고 재미있게 학습할 수 있는 AI 튜터입니다. 개념 설명부터 문제 풀이까지 단계별 학습을 지원합니다.',
        shortDescription: '수학 개념 학습 AI 튜터',
        monthlyPrice: 60000,
        pricePerStudent: 1100,
        keywords: '수학,개념,학습,문제,풀이',
        isActive: 1,
        isFeatured: 0,
        displayOrder: 4
      },
      {
        id: 'product_005',
        name: '과학 실험 가이드 봇',
        category: 'academy_operation',
        section: 'academy_bots',
        description: '과학 실험을 안전하고 효과적으로 진행할 수 있도록 가이드하는 AI 봇입니다. 실험 절차, 주의사항, 결과 분석까지 지원합니다.',
        shortDescription: '과학 실험 안전 가이드 AI',
        monthlyPrice: 55000,
        pricePerStudent: 1000,
        keywords: '과학,실험,가이드,안전,분석',
        isActive: 1,
        isFeatured: 0,
        displayOrder: 5
      }
    ];

    let created = 0;
    for (const product of products) {
      try {
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
          product.id,
          product.name,
          product.category,
          product.section || '',
          product.description || '',
          product.shortDescription || '',
          0,
          product.monthlyPrice || 0,
          0,
          product.pricePerStudent || 0,
          0,
          'none',
          0,
          'none',
          '',
          '',
          '',
          '',
          0,
          -1,
          -1,
          '',
          '',
          '',
          '',
          product.isActive || 1,
          product.isFeatured || 0,
          product.displayOrder || 0,
          product.keywords || '',
          'system',
          now,
          now
        ).run();
        created++;
        console.log(`✅ Created product: ${product.name}`);
      } catch (error) {
        console.log(`⚠️ Product ${product.id} may already exist`);
      }
    }

    console.log(`🌱 Seed completed: ${created} products created`);

    return new Response(JSON.stringify({ 
      success: true,
      created,
      total: products.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to seed products:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to seed products',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
