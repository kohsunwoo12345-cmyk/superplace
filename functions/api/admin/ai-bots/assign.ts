interface Env {
  DB: D1Database;
}

// Simple token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

/**
 * POST /api/admin/ai-bots/assign
 * AI 봇을 사용자에게 할당
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse token
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get requesting user from database
    const requestingUser = await DB
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first() as any;

    if (!requestingUser) {
      console.error('❌ Requesting user not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = requestingUser.role ? requestingUser.role.toUpperCase() : '';
    const userAcademyId = requestingUser.academyId;

    console.log('✅ Requesting user verified:', { email: requestingUser.email, role, academyId: userAcademyId });

    const body = await request.json();
    const { botId, userId, duration, durationUnit } = body;

    if (!botId || !userId || !duration || !durationUnit) {
      return new Response(
        JSON.stringify({ success: false, error: "필수 필드가 누락되었습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🤖 AI 봇 할당 요청:", { botId, userId, duration, durationUnit });

    // 사용자 확인 (User 테이블)
    const user = await DB.prepare("SELECT * FROM User WHERE id = ?")
      .bind(userId)
      .first() as any;

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "사용자를 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // DIRECTOR/TEACHER는 자신의 학원 사용자만 할당 가능
    if (role === 'DIRECTOR' || role === 'TEACHER') {
      if (!userAcademyId) {
        console.error('❌ Director/Teacher has no academy assigned');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (user.academyId !== userAcademyId) {
        console.error('❌ Cannot assign bot to user from different academy');
        return new Response(JSON.stringify({
          success: false,
          error: 'Cannot assign to user from different academy',
          message: '다른 학원의 사용자에게는 할당할 수 없습니다'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // AI 봇 확인
    const bot = await DB.prepare("SELECT * FROM ai_bots WHERE id = ?")
      .bind(botId)
      .first() as any;

    if (!bot) {
      return new Response(
        JSON.stringify({ success: false, error: "AI 봇을 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔒 구독 슬롯 검증 (학원장/선생님의 경우)
    if ((role === 'DIRECTOR' || role === 'TEACHER') && userAcademyId) {
      console.log('🔍 Checking subscription slots for academy:', userAcademyId);
      
      // 학원의 구독 정보 조회
      const subscription = await DB.prepare(`
        SELECT * FROM AcademyBotSubscription 
        WHERE academyId = ? AND productId = ?
        ORDER BY subscriptionEnd DESC
        LIMIT 1
      `).bind(userAcademyId, botId).first() as any;

      if (!subscription) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No subscription found',
          message: '이 AI 봇에 대한 구독이 없습니다.\nAI 쇼핑몰에서 구독을 신청하거나 관리자에게 문의하세요.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 구독 만료 확인
      const subscriptionEnd = new Date(subscription.subscriptionEnd);
      const now = new Date();
      if (subscriptionEnd < now) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Subscription expired',
          message: `구독이 만료되었습니다 (만료일: ${subscription.subscriptionEnd}).\n새로운 구독을 신청해주세요.`
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 남은 슬롯 확인
      const remainingSlots = subscription.remainingStudentSlots || 0;
      if (remainingSlots <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No remaining slots',
          message: `사용 가능한 학생 슬롯이 부족합니다.\n\n현재 상태:\n- 전체 슬롯: ${subscription.totalStudentSlots}개\n- 사용 중: ${subscription.usedStudentSlots}개\n- 남은 슬롯: ${remainingSlots}개\n\n추가 슬롯이 필요한 경우 AI 쇼핑몰에서 구독을 추가 신청하세요.`
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`✅ Subscription slots available: ${remainingSlots}/${subscription.totalStudentSlots}`);
    }

    // 시작일 및 종료일 계산 (한국 시간 KST)
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const startDate = kstNow.toISOString().split('T')[0];

    let endDate: Date;
    if (durationUnit === "day") {
      endDate = new Date(kstNow.getTime() + duration * 24 * 60 * 60 * 1000);
    } else if (durationUnit === "month") {
      endDate = new Date(kstNow);
      endDate.setMonth(endDate.getMonth() + duration);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "잘못된 기간 단위입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const endDateStr = endDate.toISOString().split('T')[0];

    // 할당 테이블 생성 (없으면)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS ai_bot_assignments (
        id TEXT PRIMARY KEY,
        botId TEXT NOT NULL,
        botName TEXT NOT NULL,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        userAcademyId TEXT,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        duration INTEGER NOT NULL,
        durationUnit TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 할당 ID 생성
    const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // 할당 저장
    await DB.prepare(`
      INSERT INTO ai_bot_assignments 
      (id, botId, botName, userId, userName, userEmail, userAcademyId, startDate, endDate, duration, durationUnit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      assignmentId,
      botId,
      bot.name,
      userId,
      user.name || '',
      user.email || '',
      user.academyId || null,
      startDate,
      endDateStr,
      duration,
      durationUnit
    ).run();

    // 🔒 구독 슬롯 차감 (학원장/선생님의 경우)
    if ((role === 'DIRECTOR' || role === 'TEACHER') && user.academyId) {
      console.log('📉 Decreasing subscription slot for academy:', user.academyId);
      
      await DB.prepare(`
        UPDATE AcademyBotSubscription
        SET usedStudentSlots = usedStudentSlots + 1,
            remainingStudentSlots = remainingStudentSlots - 1,
            updatedAt = datetime('now')
        WHERE academyId = ? AND productId = ?
      `).bind(user.academyId, botId).run();

      console.log('✅ Subscription slot decreased');
    }

    console.log("✅ AI 봇 할당 완료:", assignmentId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "AI 봇이 성공적으로 할당되었습니다",
        assignment: {
          id: assignmentId,
          botId,
          botName: bot.name,
          userId,
          userName: user.name,
          userEmail: user.email,
          userAcademyId: user.academyId,
          startDate,
          endDate: endDateStr,
          duration,
          durationUnit,
          status: "active",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ AI 봇 할당 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "AI 봇 할당 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
