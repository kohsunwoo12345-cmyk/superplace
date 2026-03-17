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

    // Get requesting user from database (User 테이블 먼저, 없으면 users 테이블)
    let requestingUser = await DB
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first() as any;

    // User 테이블에 없으면 users 테이블 확인
    if (!requestingUser) {
      console.log('🔍 User 테이블에 없음, users 테이블 확인 중...');
      requestingUser = await DB
        .prepare('SELECT id, email, role, academyId FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first() as any;
    }

    if (!requestingUser) {
      console.error('❌ Requesting user not found in both User and users tables');
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
    const { botId, userId, duration, durationUnit, dailyUsageLimit: providedDailyLimit } = body;

    if (!botId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "봇 ID와 사용자 ID는 필수입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🤖 AI 봇 할당 요청:", { botId, userId, duration, durationUnit, providedDailyLimit });

    // 사용자 확인 (User 테이블 먼저, 없으면 users 테이블)
    let user = await DB.prepare("SELECT * FROM User WHERE id = ?")
      .bind(userId)
      .first() as any;

    // User 테이블에 없으면 users 테이블 확인
    if (!user) {
      console.log('🔍 User 테이블에 없음, users 테이블 확인 중...');
      user = await DB.prepare("SELECT * FROM users WHERE id = ?")
        .bind(userId)
        .first() as any;
    }

    if (!user) {
      console.error('❌ Target user not found in both User and users tables');
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

    // 🔒 구독 슬롯 검증 + 학원 구독 기간 조회
    let subscription: any = null;
    
    if ((role === 'DIRECTOR' || role === 'TEACHER') && userAcademyId) {
      console.log('🔍 Checking subscription slots for academy:', userAcademyId, 'bot:', botId);
      
      // 학원의 구독 정보 조회 (dailyUsageLimit 포함)
      subscription = await DB.prepare(`
        SELECT 
          id, 
          academyId, 
          botId, 
          totalStudentSlots, 
          usedStudentSlots, 
          remainingStudentSlots,
          subscriptionStart,
          subscriptionEnd,
          dailyUsageLimit,
          isActive,
          createdAt,
          updatedAt
        FROM AcademyBotSubscription 
        WHERE academyId = ? AND botId = ?
        ORDER BY subscriptionEnd DESC
        LIMIT 1
      `).bind(userAcademyId, botId).first() as any;

      console.log('📋 Subscription query result:', subscription || 'NULL');

      if (!subscription) {
        console.warn('⚠️ No subscription found, but allowing assignment for testing/trial purposes');
        console.log('📝 Note: This assignment will work without subscription validation');
        // 구독이 없어도 할당은 허용 (테스트/체험 목적)
      } else {
        // 구독이 있는 경우에만 만료 및 슬롯 검증
        console.log('✅ Subscription found, validating expiration and slots');
        
        // 구독 만료 확인
        const subscriptionEndDate = subscription.subscriptionEnd || subscription.subscriptionEndDate;
        if (!subscriptionEndDate) {
          console.error('❌ Subscription end date is missing:', subscription);
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid subscription',
            message: '구독 정보가 올바르지 않습니다. 관리자에게 문의하세요.'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const subscriptionEnd = new Date(subscriptionEndDate);
        const now = new Date();
        if (subscriptionEnd < now) {
          console.error('❌ Subscription expired:', { 
            endDate: subscriptionEndDate, 
            now: now.toISOString() 
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'Subscription expired',
            message: `구독이 만료되었습니다 (만료일: ${subscriptionEndDate}).\n\n해결 방법:\n1. AI 쇼핑몰에서 새로운 구독을 신청하세요\n2. 기존 구독을 갱신하세요`
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        console.log('✅ Subscription is active until:', subscriptionEndDate);

        // 남은 슬롯 확인
        const remainingSlots = subscription.remainingStudentSlots || 0;
        const totalSlots = subscription.totalStudentSlots || 0;
        const usedSlots = subscription.usedStudentSlots || 0;

        console.log('📊 Subscription slots status:', {
          total: totalSlots,
          used: usedSlots,
          remaining: remainingSlots
        });

        if (remainingSlots <= 0) {
          console.error('❌ No remaining slots:', { total: totalSlots, used: usedSlots, remaining: remainingSlots });
          return new Response(JSON.stringify({
            success: false,
            error: 'No remaining slots',
            message: `사용 가능한 학생 슬롯이 부족합니다.\n\n현재 상태:\n- 전체 슬롯: ${totalSlots}개\n- 사용 중: ${usedSlots}개\n- 남은 슬롯: ${remainingSlots}개\n\n해결 방법:\n1. AI 쇼핑몰에서 추가 구독을 신청하세요\n2. 퇴원생이 있다면 할당을 취소한 후 재할당하세요\n3. 기존 학생의 할당을 취소하면 슬롯이 복원됩니다`
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        console.log(`✅ Subscription slots available: ${remainingSlots}/${totalSlots}`);
      }
    } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      // 🔥 관리자: 할당하려는 학생의 학원 구독 정보 조회
      if (user.academyId) {
        console.log('🔍 ADMIN - Fetching subscription for student academy:', user.academyId, 'bot:', botId);
        
        subscription = await DB.prepare(`
          SELECT 
            id, 
            academyId, 
            botId, 
            totalStudentSlots, 
            usedStudentSlots, 
            remainingStudentSlots,
            subscriptionStart,
            subscriptionEnd,
            dailyUsageLimit,
            isActive,
            createdAt,
            updatedAt
          FROM AcademyBotSubscription 
          WHERE academyId = ? AND botId = ?
          ORDER BY subscriptionEnd DESC
          LIMIT 1
        `).bind(user.academyId, botId).first() as any;
        
        if (!subscription) {
          console.warn('⚠️ No subscription found for student academy, allowing admin override');
        } else {
          console.log('✅ Found subscription for student academy:', subscription);
        }
      }
    }

    // 🔒 중복 할당 방지 (이미 해당 봇을 할당받은 학생인지 확인)
    const existingAssignment = await DB.prepare(`
      SELECT id, startDate, endDate, status
      FROM ai_bot_assignments 
      WHERE userId = ? AND botId = ? AND status = 'active'
    `).bind(userId.toString(), botId).first() as any;

    if (existingAssignment) {
      console.error('❌ Already assigned:', { 
        userId, 
        botId, 
        existingAssignment: existingAssignment.id 
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Already assigned',
        message: `이 학생은 이미 "${bot.name}" 봇을 할당받았습니다.\n\n기존 할당 정보:\n- 할당 ID: ${existingAssignment.id}\n- 시작일: ${existingAssignment.startDate}\n- 종료일: ${existingAssignment.endDate}\n- 상태: ${existingAssignment.status}\n\n기존 할당을 취소한 후 다시 시도하세요.`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ No existing assignment found, proceeding with new assignment');

    // 🔥 시작일 및 종료일 계산 (한국 시간 KST)
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const startDate = kstNow.toISOString().split('T')[0];

    let endDate: Date;
    let actualDuration: number;
    let actualDurationUnit: string;
    
    // 🔥 학원 구독이 있으면 그 기간을 사용, 없으면 duration 사용
    if (subscription && subscription.subscriptionEnd) {
      // 학원 구독 만료일 사용
      endDate = new Date(subscription.subscriptionEnd);
      actualDurationUnit = 'subscription';
      
      // 일수 계산
      const diffTime = endDate.getTime() - kstNow.getTime();
      actualDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log('📅 Using academy subscription end date:', {
        subscriptionEnd: subscription.subscriptionEnd,
        calculatedDays: actualDuration,
        startDate,
        endDate: endDate.toISOString().split('T')[0]
      });
    } else if (duration && durationUnit) {
      // duration 파라미터 사용 (학원 할당 또는 관리자 할당)
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
      actualDuration = duration;
      actualDurationUnit = durationUnit;
      
      console.log('📅 Using provided duration:', {
        duration,
        durationUnit,
        startDate,
        endDate: endDate.toISOString().split('T')[0]
      });
    } else {
      // 구독도 없고 duration도 없음
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "학원 구독 정보가 없으며, 기간도 제공되지 않았습니다.\n\n학생에게 봇을 할당하려면 먼저 해당 학원에 봇을 할당(구독)해야 합니다." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const endDateStr = endDate.toISOString().split('T')[0];

    // 🆕 일일 사용 한도 결정 (우선순위: 학원 구독 > 직접 입력 > 기본값 15)
    let finalDailyUsageLimit = 15;
    if (subscription && subscription.dailyUsageLimit) {
      finalDailyUsageLimit = subscription.dailyUsageLimit;
      console.log(`✅ Using daily limit from academy subscription: ${finalDailyUsageLimit}`);
    } else if (providedDailyLimit) {
      finalDailyUsageLimit = providedDailyLimit;
      console.log(`✅ Using provided daily limit: ${finalDailyUsageLimit}`);
    } else {
      console.log(`✅ Using default daily limit: ${finalDailyUsageLimit}`);
    }

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
        dailyUsageLimit INTEGER DEFAULT 15,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 할당 ID 생성
    const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // 할당 저장 (userId를 문자열로 변환하여 저장)
    const userIdStr = userId.toString();
    
    console.log('💾 Saving assignment:', {
      assignmentId,
      botId,
      botName: bot.name,
      userId: userIdStr,
      userName: user.name,
      academyId: user.academyId,
      startDate,
      endDate: endDateStr
    });

    await DB.prepare(`
      INSERT INTO ai_bot_assignments 
      (id, botId, botName, userId, userName, userEmail, userAcademyId, startDate, endDate, duration, durationUnit, dailyUsageLimit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      assignmentId,
      botId,
      bot.name,
      userIdStr,
      user.name || '',
      user.email || '',
      user.academyId || null,
      startDate,
      endDateStr,
      actualDuration,
      actualDurationUnit,
      finalDailyUsageLimit
    ).run();

    // 🔒 구독 슬롯 차감 (학원장/선생님의 경우, 구독이 있을 때만)
    if ((role === 'DIRECTOR' || role === 'TEACHER') && user.academyId && subscription) {
      console.log('📉 Decreasing subscription slot for academy:', user.academyId);
      
      const updateResult = await DB.prepare(`
        UPDATE AcademyBotSubscription
        SET usedStudentSlots = usedStudentSlots + 1,
            remainingStudentSlots = CASE 
              WHEN remainingStudentSlots > 0 THEN remainingStudentSlots - 1 
              ELSE 0 
            END,
            updatedAt = datetime('now')
        WHERE academyId = ? AND botId = ?
      `).bind(user.academyId, botId).run();

      console.log('✅ Subscription slot decreased:', updateResult);

      // 업데이트 후 슬롯 상태 재조회
      const updatedSubscription = await DB.prepare(`
        SELECT totalStudentSlots, usedStudentSlots, remainingStudentSlots
        FROM AcademyBotSubscription
        WHERE academyId = ? AND botId = ?
      `).bind(user.academyId, botId).first() as any;

      if (updatedSubscription) {
        console.log('📊 Updated subscription slots:', {
          total: updatedSubscription.totalStudentSlots,
          used: updatedSubscription.usedStudentSlots,
          remaining: updatedSubscription.remainingStudentSlots
        });
      }
    } else if ((role === 'DIRECTOR' || role === 'TEACHER') && !subscription) {
      console.log('⚠️ No subscription found, skipping slot decrease (trial/test mode)');
    }
          used: updatedSubscription.usedStudentSlots,
          remaining: updatedSubscription.remainingStudentSlots
        });
      }
    }

    console.log("✅ AI 봇 할당 완료:", assignmentId);

    // ActivityLog 기록
    try {
      const ipAddress = request.headers.get('CF-Connecting-IP') ||
                        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                        'Unknown';
      const userAgentStr = request.headers.get('User-Agent') || 'Unknown';
      const cfCountry = request.headers.get('CF-IPCountry') || '';
      let deviceTypeStr = 'Unknown';
      if (userAgentStr.includes('Mobile')) deviceTypeStr = 'Mobile';
      else if (userAgentStr.includes('Windows') || userAgentStr.includes('Mac') || userAgentStr.includes('Linux')) deviceTypeStr = 'Desktop';

      const actLogId = `activity-botassign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await DB.prepare(`
        INSERT OR IGNORE INTO activity_logs (id, userId, action, details, ip, userAgent, deviceType, country, userRole, academyId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        actLogId,
        userId.toString(),
        'AI 봇 할당',
        `${bot.name} 봇이 ${user.name || user.email} 님에게 할당되었습니다 (기간: ${actualDuration}${actualDurationUnit}, 요청자: ${requestingUser.email})`,
        ipAddress,
        userAgentStr,
        deviceTypeStr,
        cfCountry,
        user.role || '',
        user.academyId || ''
      ).run();
    } catch (logErr: any) {
      console.warn('⚠️ ActivityLog 봇 할당 기록 실패:', logErr.message);
    }

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
          duration: actualDuration,
          durationUnit: actualDurationUnit,
          dailyUsageLimit: finalDailyUsageLimit,
          status: "active",
          usedAcademySubscription: !!subscription,
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
