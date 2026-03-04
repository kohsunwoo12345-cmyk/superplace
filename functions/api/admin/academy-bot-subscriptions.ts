// Cloudflare Pages Function - Academy Bot Subscription API
interface Env {
  DB: D1Database;
}

// 토큰 파싱 함수
function parseToken(authHeader: string | null): { id: string; email: string; role: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length !== 3) {
    return null;
  }

  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
  };
}

// 랜덤 ID 생성
function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 체크 (ADMIN, SUPER_ADMIN만 가능)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 본문 파싱
    const body = await context.request.json() as {
      academyId: string;
      productId: string;
      studentCount: number;
      subscriptionStart: string;
      subscriptionEnd: string;
      pricePerStudent?: number;
      memo?: string;
    };

    const {
      academyId,
      productId,
      studentCount,
      subscriptionStart,
      subscriptionEnd,
      pricePerStudent = 0,
      memo,
    } = body;

    // 필수 필드 체크
    if (!academyId || !productId) {
      return new Response(JSON.stringify({ error: 'academyId and productId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!studentCount || studentCount <= 0) {
      return new Response(JSON.stringify({ error: 'studentCount must be greater than 0' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptionStart || !subscriptionEnd) {
      return new Response(JSON.stringify({ error: 'subscriptionStart and subscriptionEnd are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 날짜 유효성 검사
    const startDate = new Date(subscriptionStart);
    const endDate = new Date(subscriptionEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (startDate >= endDate) {
      return new Response(JSON.stringify({ error: 'subscriptionEnd must be after subscriptionStart' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 학원 존재 확인
    const academyCheck = await DB.prepare(
      'SELECT id, name FROM academy WHERE id = ?'
    ).bind(academyId).first();

    if (!academyCheck) {
      return new Response(JSON.stringify({ error: 'Academy not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // AI 봇 존재 확인
    const botCheck = await DB.prepare(
      'SELECT id, name FROM ai_bots WHERE id = ?'
    ).bind(productId).first();

    if (!botCheck) {
      return new Response(JSON.stringify({ error: 'AI Bot not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Creating academy bot subscription:', {
      academyId,
      academyName: academyCheck.name,
      productId,
      productName: botCheck.name,
      studentCount,
      subscriptionStart,
      subscriptionEnd,
      pricePerStudent,
    });

    // AcademyBotSubscription 테이블에 이미 구독이 있는지 확인
    const existingSubscription = await DB.prepare(`
      SELECT id, totalStudentSlots, usedStudentSlots, subscriptionEnd
      FROM AcademyBotSubscription
      WHERE academyId = ? AND productId = ?
      ORDER BY subscriptionEnd DESC
      LIMIT 1
    `).bind(academyId, productId).first();

    let subscriptionId: string;
    let result: any;

    if (existingSubscription) {
      // 기존 구독이 있으면 업데이트
      subscriptionId = existingSubscription.id as string;
      
      console.log('📝 Updating existing subscription:', subscriptionId);
      
      // 학생 슬롯 추가 및 종료일 연장
      const newTotalSlots = (existingSubscription.totalStudentSlots as number) + studentCount;
      const newRemainingSlots = newTotalSlots - (existingSubscription.usedStudentSlots as number);
      
      // 종료일 비교 - 더 늦은 날짜 사용
      const existingEndDate = new Date(existingSubscription.subscriptionEnd as string);
      const finalEndDate = endDate > existingEndDate ? subscriptionEnd : existingSubscription.subscriptionEnd;

      await DB.prepare(`
        UPDATE AcademyBotSubscription
        SET 
          totalStudentSlots = ?,
          remainingStudentSlots = ?,
          subscriptionEnd = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `).bind(
        newTotalSlots,
        newRemainingSlots,
        finalEndDate,
        subscriptionId
      ).run();

      // 업데이트된 구독 조회
      result = await DB.prepare(`
        SELECT * FROM AcademyBotSubscription WHERE id = ?
      `).bind(subscriptionId).first();

      console.log('✅ Updated subscription:', result);
    } else {
      // 새 구독 생성
      subscriptionId = generateId();
      
      console.log('🆕 Creating new subscription:', subscriptionId);

      await DB.prepare(`
        INSERT INTO AcademyBotSubscription (
          id,
          academyId,
          productId,
          productName,
          totalStudentSlots,
          usedStudentSlots,
          remainingStudentSlots,
          subscriptionStart,
          subscriptionEnd,
          pricePerStudent,
          memo,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        subscriptionId,
        academyId,
        productId,
        botCheck.name,
        studentCount,
        0,
        studentCount,
        subscriptionStart,
        subscriptionEnd,
        pricePerStudent,
        memo || null
      ).run();

      // 생성된 구독 조회
      result = await DB.prepare(`
        SELECT * FROM AcademyBotSubscription WHERE id = ?
      `).bind(subscriptionId).first();

      console.log('✅ Created subscription:', result);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: existingSubscription 
          ? 'Academy bot subscription updated successfully'
          : 'Academy bot subscription created successfully',
        subscription: result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Academy bot subscription error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create academy bot subscription',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// GET 메서드 - 학원 구독 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 체크 (ADMIN, SUPER_ADMIN만 전체 조회 가능)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Fetching all academy bot subscriptions');

    // 모든 활성 구독 조회
    const subscriptions = await DB.prepare(`
      SELECT 
        s.id,
        s.academyId,
        a.name as academyName,
        s.productId as botId,
        b.name as botName,
        s.totalStudentSlots as totalSlots,
        s.usedStudentSlots as usedSlots,
        s.remainingStudentSlots as remainingSlots,
        s.subscriptionEnd as expiresAt,
        CASE 
          WHEN date(s.subscriptionEnd) >= date('now') THEN 1
          ELSE 0
        END as isActive
      FROM AcademyBotSubscription s
      JOIN academy a ON s.academyId = a.id
      JOIN ai_bots b ON s.productId = b.id
      WHERE date(s.subscriptionEnd) >= date('now')
      ORDER BY s.subscriptionEnd DESC
    `).all();

    console.log(`✅ Found ${subscriptions.results?.length || 0} active subscriptions`);

    return new Response(
      JSON.stringify({
        success: true,
        subscriptions: subscriptions.results || [],
        count: subscriptions.results?.length || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Failed to fetch academy bot subscriptions:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch academy bot subscriptions',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
