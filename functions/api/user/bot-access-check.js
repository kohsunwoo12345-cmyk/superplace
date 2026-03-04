// API: 학생이 특정 AI 봇을 사용할 수 있는지 체크
// GET /api/user/bot-access-check?userId=xxx&botId=xxx&academyId=xxx

export async function onRequestGet(context) {
  const db = context.env.DB;
  
  try {
    if (!db) {
      return new Response(JSON.stringify({ 
        hasAccess: false, 
        reason: 'database_error',
        message: 'DB 연결 실패' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const botId = url.searchParams.get('botId');
    const academyId = url.searchParams.get('academyId');

    if (!userId || !botId || !academyId) {
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: 'missing_parameters',
        message: 'userId, botId, academyId가 필요합니다',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 봇 접근 권한 체크: userId=${userId}, botId=${botId}, academyId=${academyId}`);

    // 1. 학원 구독 정보 조회
    const subscription = await db.prepare(`
      SELECT 
        id,
        academyId,
        productId,
        productName,
        totalStudentSlots,
        usedStudentSlots,
        remainingStudentSlots,
        subscriptionStart,
        subscriptionEnd,
        isActive
      FROM AcademyBotSubscription
      WHERE academyId = ? AND productId = ?
      ORDER BY subscriptionEnd DESC
      LIMIT 1
    `).bind(academyId, botId).first();

    // 구독 없음
    if (!subscription) {
      console.log('❌ 구독 정보 없음');
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: 'no_subscription',
        message: '학원에 할당된 구독이 없습니다',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. 구독 만료 체크
    const subscriptionEndDate = new Date(subscription.subscriptionEnd);
    const now = new Date();
    
    if (subscriptionEndDate < now) {
      console.log(`❌ 구독 만료됨: ${subscription.subscriptionEnd}`);
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: 'subscription_expired',
        message: `학원 구독이 만료되었습니다 (만료일: ${subscription.subscriptionEnd})`,
        subscription: {
          endDate: subscription.subscriptionEnd,
          totalSlots: subscription.totalStudentSlots,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ 구독 활성: ${subscription.subscriptionEnd}까지 유효`);

    // 3. 학생 할당 정보 조회
    const assignment = await db.prepare(`
      SELECT 
        id,
        userId,
        botId,
        startDate,
        endDate,
        status,
        userAcademyId
      FROM ai_bot_assignments
      WHERE userId = ? AND botId = ? AND userAcademyId = ?
      ORDER BY startDate DESC
      LIMIT 1
    `).bind(userId.toString(), botId, academyId).first();

    // 할당 정보 없음
    if (!assignment) {
      console.log('❌ 학생에게 봇이 할당되지 않음');
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: 'not_assigned',
        message: '이 봇이 할당되지 않았습니다',
        subscription: {
          endDate: subscription.subscriptionEnd,
          totalSlots: subscription.totalStudentSlots,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ 할당 정보 발견: ${assignment.id}`);

    // 4. 동일 학원, 동일 봇에 할당된 학생 수 확인
    const allAssignments = await db.prepare(`
      SELECT 
        userId,
        startDate,
        endDate,
        status
      FROM ai_bot_assignments
      WHERE botId = ? AND userAcademyId = ? AND status = 'active'
      ORDER BY startDate ASC
    `).bind(botId, academyId).all();

    const activeAssignments = allAssignments.results || [];
    console.log(`📊 활성 할당 수: ${activeAssignments.length}명`);

    // 5. 학생의 우선순위 계산 (할당일 기준)
    const studentRank = activeAssignments.findIndex(a => a.userId === userId.toString()) + 1;
    
    if (studentRank === 0) {
      console.log('❌ 할당 목록에 없음');
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: 'assignment_not_found',
        message: '활성 할당 목록에 없습니다',
        subscription: {
          endDate: subscription.subscriptionEnd,
          totalSlots: subscription.totalStudentSlots,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📍 학생 우선순위: ${studentRank}위 / ${activeAssignments.length}명`);

    // 6. 구독 학생 수 제한 체크
    const allowedCount = subscription.totalStudentSlots || 0;
    
    if (studentRank > allowedCount) {
      console.log(`❌ 구독 학생 수 초과: ${studentRank}위 > ${allowedCount}명`);
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: 'slot_limit_exceeded',
        message: `구독 학생 수를 초과했습니다 (${studentRank}/${allowedCount})`,
        subscription: {
          endDate: subscription.subscriptionEnd,
          totalSlots: allowedCount,
          usedSlots: activeAssignments.length,
          studentRank: studentRank,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 7. 학생 개별 할당 기간 체크
    const assignmentEndDate = new Date(assignment.endDate);
    
    if (assignmentEndDate < now) {
      console.log(`❌ 학생 할당 기간 만료: ${assignment.endDate}`);
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: 'assignment_expired',
        message: `개인 할당 기간이 만료되었습니다 (만료일: ${assignment.endDate})`,
        subscription: {
          endDate: subscription.subscriptionEnd,
          totalSlots: allowedCount,
          studentRank: studentRank,
        },
        assignment: {
          startDate: assignment.startDate,
          endDate: assignment.endDate,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ✅ 모든 체크 통과!
    console.log(`✅ 접근 허용: 학생 ${studentRank}/${allowedCount}명, 구독 만료일 ${subscription.subscriptionEnd}`);
    
    return new Response(JSON.stringify({
      hasAccess: true,
      reason: 'active',
      message: 'AI 봇을 사용할 수 있습니다',
      subscription: {
        endDate: subscription.subscriptionEnd,
        totalSlots: allowedCount,
        usedSlots: activeAssignments.length,
        remainingSlots: Math.max(0, allowedCount - activeAssignments.length),
        studentRank: studentRank,
      },
      assignment: {
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        status: assignment.status,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('봇 접근 권한 체크 오류:', error);
    
    return new Response(JSON.stringify({
      hasAccess: false,
      reason: 'error',
      message: '권한 체크 중 오류가 발생했습니다',
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
