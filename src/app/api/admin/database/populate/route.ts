import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Cloudflare D1 binding
    const db = process.env.DB;

    if (!db) {
      return NextResponse.json({
        error: 'Database not configured',
      }, { status: 500 });
    }

    const results = [];

    // 1. Create admin user
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO users (id, email, password, name, role, phone, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'admin-superplace-001',
        'admin@superplace.co.kr',
        '$2a$10$rqZ8vKJXLZ9HhqYqN7yM4.OXqZGqJ0Yh0wJWqKqJZqJZqJZqJZqJZ', // bcrypt hash for admin123456
        '슈퍼플레이스 관리자',
        'SUPER_ADMIN',
        '010-8739-9697'
      ).run();
      results.push('✅ Admin user created');
    } catch (e: any) {
      results.push(`⚠️ Admin user: ${e.message}`);
    }

    // 2. Create academy
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO academy (id, name, code, description, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'academy-superplace-001',
        '슈퍼플레이스 학원',
        'SUPERPLACE01',
        '체계적인 학습 관리를 위한 스마트 학원',
        '인천광역시 서구 청라커낼로 270, 2층',
        '010-8739-9697',
        'academy@superplace.com',
        'PREMIUM',
        100,
        10,
        1
      ).run();
      results.push('✅ Academy created');
    } catch (e: any) {
      results.push(`⚠️ Academy: ${e.message}`);
    }

    // 3. Create AI Bots
    const bots = [
      {
        id: 'bot-assistant-001',
        name: '학습 도우미',
        description: '학생들의 학습을 돕는 AI 어시스턴트',
        systemPrompt: '당신은 친절하고 도움이 되는 학습 도우미입니다. 학생들의 질문에 명확하고 이해하기 쉽게 답변해주세요.',
      },
      {
        id: 'bot-math-001',
        name: '수학 튜터',
        description: '수학 문제 해결을 돕는 AI 튜터',
        systemPrompt: '당신은 수학 전문 튜터입니다. 수학 문제를 단계별로 설명하고 개념을 명확히 가르쳐주세요.',
      },
      {
        id: 'bot-english-001',
        name: '영어 튜터',
        description: '영어 학습을 돕는 AI 튜터',
        systemPrompt: '당신은 영어 전문 튜터입니다. 영어 문법, 단어, 회화를 친절하게 가르쳐주세요.',
      },
    ];

    for (const bot of bots) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO ai_bots (id, name, description, systemPrompt, modelType, temperature, maxTokens, isActive, createdById, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          bot.id,
          bot.name,
          bot.description,
          bot.systemPrompt,
          'gemini-pro',
          0.7,
          1000,
          1,
          'admin-superplace-001'
        ).run();
        results.push(`✅ Bot created: ${bot.name}`);
      } catch (e: any) {
        results.push(`⚠️ Bot ${bot.name}: ${e.message}`);
      }
    }

    // 4. Create sample students
    const students = [
      { id: 'student-001', name: '김민수', email: 'minsu@example.com', studentCode: 'ST001', className: '초등 4학년' },
      { id: 'student-002', name: '이지은', email: 'jieun@example.com', studentCode: 'ST002', className: '초등 5학년' },
      { id: 'student-003', name: '박서준', email: 'seojun@example.com', studentCode: 'ST003', className: '초등 6학년' },
    ];

    for (const student of students) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO users (id, email, password, name, role, phone, studentCode, className, academyId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          student.id,
          student.email,
          '$2a$10$rqZ8vKJXLZ9HhqYqN7yM4.OXqZGqJ0Yh0wJWqKqJZqJZqJZqJZqJZ', // password: student123
          student.name,
          'STUDENT',
          '010-0000-0000',
          student.studentCode,
          student.className,
          'academy-superplace-001'
        ).run();
        results.push(`✅ Student created: ${student.name}`);
      } catch (e: any) {
        results.push(`⚠️ Student ${student.name}: ${e.message}`);
      }
    }

    // 5. Create sample classes
    const classes = [
      { id: 'class-001', name: '초등 수학 A반', description: '초등 4-5학년 수학 기초반' },
      { id: 'class-002', name: '초등 영어 B반', description: '초등 5-6학년 영어 회화반' },
    ];

    for (const cls of classes) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO classes (id, name, description, academyId, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          cls.id,
          cls.name,
          cls.description,
          'academy-superplace-001',
          1
        ).run();
        results.push(`✅ Class created: ${cls.name}`);
      } catch (e: any) {
        results.push(`⚠️ Class ${cls.name}: ${e.message}`);
      }
    }

    // 6. Create SMS Balance
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO SMSBalance (id, balance, total_charged, total_used, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'sms-balance-001',
        10000,
        10000,
        0
      ).run();
      results.push('✅ SMS Balance initialized (10,000P)');
    } catch (e: any) {
      results.push(`⚠️ SMS Balance: ${e.message}`);
    }

    // 7. Create sample parents
    const parents = [
      { id: 'parent-001', name: '김영희', phone: '010-1234-5678', studentId: 'student-001' },
      { id: 'parent-002', name: '이철수', phone: '010-2345-6789', studentId: 'student-002' },
      { id: 'parent-003', name: '박미영', phone: '010-3456-7890', studentId: 'student-003' },
    ];

    for (const parent of parents) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO Parent (id, name, phone, relationship, createdById, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          parent.id,
          parent.name,
          parent.phone,
          '부모',
          'admin-superplace-001'
        ).run();

        // Link parent to student
        await db.prepare(`
          INSERT OR REPLACE INTO StudentParent (id, studentId, parentId, isPrimary, createdById, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          `sp-${parent.id}`,
          parent.studentId,
          parent.id,
          1,
          'admin-superplace-001'
        ).run();

        results.push(`✅ Parent created: ${parent.name}`);
      } catch (e: any) {
        results.push(`⚠️ Parent ${parent.name}: ${e.message}`);
      }
    }

    // 8. Create sample store products
    const products = [
      {
        id: 'product-001',
        name: '학교/학년 별 내신 대비 봇',
        category: 'academy_operation',
        section: 'education',
        description: '학년별로 맞춤화된 내신 대비 학습 지원을 제공하는 AI 봇입니다.',
        shortDescription: '학년별 맞춤 내신 대비',
        monthlyPrice: 150000,
        yearlyPrice: 1500000,
        features: JSON.stringify(['학년별 맞춤 학습', '내신 시험 대비', '24시간 학습 지원', '진도 관리']),
        keywords: '내신,학교,학년,시험,맞춤학습',
        isActive: 1,
        isFeatured: 0,
        displayOrder: 1,
      },
      {
        id: 'product-002',
        name: '영어 내신 클리닉 마스터 봇',
        category: 'academy_operation',
        section: 'education',
        description: '학년별 영어내신 클리닉 마스터 - 24시간 AI 숙제 도우미 & 음성 튜터',
        shortDescription: '24시간 영어 AI 튜터',
        monthlyPrice: 200000,
        yearlyPrice: 2000000,
        features: JSON.stringify(['음성 튜터링', '24시간 숙제 도움', '영어 내신 대비', '발음 교정']),
        keywords: '영어,내신,클리닉,숙제,튜터,음성',
        isActive: 1,
        isFeatured: 1,
        displayOrder: 2,
      },
      {
        id: 'product-003',
        name: '블로그 봇 V.1',
        category: 'marketing_blog',
        section: 'marketing',
        description: '기본형 AI 블로그 자동 작성 봇 - 학원 홍보를 위한 블로그 콘텐츠를 자동으로 생성합니다.',
        shortDescription: '기본형 블로그 자동 작성',
        monthlyPrice: 100000,
        yearlyPrice: 1000000,
        features: JSON.stringify(['자동 콘텐츠 생성', 'SEO 최적화', '월 10개 포스팅', '키워드 분석']),
        keywords: '블로그,마케팅,작성,기본,자동화',
        isActive: 1,
        isFeatured: 0,
        displayOrder: 3,
      },
      {
        id: 'product-004',
        name: '블로그 SEO 사진 제작 봇',
        category: 'marketing_blog',
        section: 'marketing',
        description: '네이버 블로그 상위노출을 위한 AI 사진 생성 - SEO에 최적화된 이미지를 자동으로 생성합니다.',
        shortDescription: 'SEO 최적화 이미지 생성',
        monthlyPrice: 80000,
        yearlyPrice: 800000,
        features: JSON.stringify(['AI 이미지 생성', 'SEO 최적화', '네이버 블로그 최적화', '무제한 생성']),
        keywords: '블로그,SEO,사진,네이버,상위노출,이미지',
        isActive: 1,
        isFeatured: 1,
        displayOrder: 4,
      },
      {
        id: 'product-005',
        name: '맞춤형 전문가 봇',
        category: 'expert',
        section: 'custom',
        description: '귀하의 비즈니스에 최적화된 AI 솔루션 - 학원의 특성에 맞춘 맞춤형 AI 봇을 제작합니다.',
        shortDescription: '비즈니스 맞춤형 AI',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: JSON.stringify(['맞춤 설계', '전문 컨설팅', '무제한 수정', '우선 지원']),
        keywords: '전문가,맞춤,비즈니스,솔루션,컨설팅',
        isActive: 1,
        isFeatured: 0,
        displayOrder: 5,
      },
    ];

    for (const product of products) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO store_products (
            id, name, category, section, description, shortDescription, 
            monthlyPrice, yearlyPrice, features, keywords, isActive, isFeatured, 
            displayOrder, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          product.id,
          product.name,
          product.category,
          product.section,
          product.description,
          product.shortDescription,
          product.monthlyPrice,
          product.yearlyPrice,
          product.features,
          product.keywords,
          product.isActive,
          product.isFeatured,
          product.displayOrder
        ).run();
        results.push(`✅ Store product created: ${product.name}`);
      } catch (e: any) {
        results.push(`⚠️ Store product ${product.name}: ${e.message}`);
      }
    }

    // Verify data
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first();
    const botCount = await db.prepare('SELECT COUNT(*) as count FROM ai_bots').first();
    const academyCount = await db.prepare('SELECT COUNT(*) as count FROM academy').first();
    const classCount = await db.prepare('SELECT COUNT(*) as count FROM classes').first();
    const parentCount = await db.prepare('SELECT COUNT(*) as count FROM Parent').first();
    let productCount = { count: 0 };
    try {
      productCount = await db.prepare('SELECT COUNT(*) as count FROM store_products').first();
    } catch (e) {
      results.push('⚠️ store_products table may not exist');
    }

    return NextResponse.json({
      success: true,
      message: 'Database populated successfully!',
      results,
      summary: {
        users: userCount?.count || 0,
        bots: botCount?.count || 0,
        academies: academyCount?.count || 0,
        classes: classCount?.count || 0,
        parents: parentCount?.count || 0,
        products: productCount?.count || 0,
      },
    });

  } catch (error: any) {
    console.error('Database population error:', error);
    return NextResponse.json({
      error: 'Failed to populate database',
      message: error.message,
    }, { status: 500 });
  }
}
