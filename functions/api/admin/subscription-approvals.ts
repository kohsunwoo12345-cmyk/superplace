// 요금제 신청 승인/거부 API (관리자용)
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  
  try {
    const method = request.method;
    
    // GET: 모든 신청 목록 조회 (관리자)
    if (method === 'GET') {
      const url = new URL(request.url);
      const status = url.searchParams.get('status') || 'all';
      
      let query = 'SELECT * FROM subscription_requests';
      if (status !== 'all') {
        query += ` WHERE status = '${status}'`;
      }
      query += ' ORDER BY requestedAt DESC';
      
      const { results } = await env.DB.prepare(query).all();
      
      return new Response(
        JSON.stringify({
          success: true,
          requests: results || []
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // POST: 신청 승인
    if (method === 'POST') {
      const data = await request.json();
      
      if (!data.requestId || !data.action || !data.adminEmail) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Required fields: requestId, action, adminEmail' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // 신청 정보 조회
      const requestData = await env.DB.prepare(`
        SELECT * FROM subscription_requests WHERE id = ?
      `).bind(data.requestId).first();
      
      if (!requestData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Request not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const now = new Date().toISOString();
      
      if (data.action === 'approve') {
        // 1. 신청 상태 업데이트
        await env.DB.prepare(`
          UPDATE subscription_requests SET
            status = 'approved',
            processedAt = ?,
            approvedBy = ?,
            approvedByEmail = ?,
            adminNote = ?
          WHERE id = ?
        `).bind(
          now,
          data.adminName || 'Admin',
          data.adminEmail,
          data.adminNote || '',
          data.requestId
        ).run();
        
        // 2. 요금제 정보 조회
        const plan = await env.DB.prepare(`
          SELECT * FROM pricing_plans WHERE id = ?
        `).bind(requestData.planId).first();
        
        if (!plan) {
          return new Response(
            JSON.stringify({ success: false, error: 'Plan not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // 3. 구독 시작일 및 종료일 계산
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        const periodMap = {
          '1month': 1,
          '6months': 6,
          '12months': 12
        };
        
        endDate.setMonth(endDate.getMonth() + (periodMap[requestData.period] || 1));
        
        // 4. 사용자 구독 정보 생성 또는 업데이트
        const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 기존 구독 확인
        const existingSub = await env.DB.prepare(`
          SELECT id FROM user_subscriptions WHERE userId = ? AND status = 'active'
        `).bind(requestData.userId).first();
        
        if (existingSub) {
          // 기존 구독 업데이트
          await env.DB.prepare(`
            UPDATE user_subscriptions SET
              planId = ?,
              planName = ?,
              period = ?,
              status = 'active',
              startDate = ?,
              endDate = ?,
              limit_maxStudents = ?,
              limit_maxTeachers = ?,
              limit_maxHomeworkChecks = ?,
              limit_maxAIAnalysis = ?,
              limit_maxAIGrading = ?,
              limit_maxCapabilityAnalysis = ?,
              limit_maxConceptAnalysis = ?,
              limit_maxSimilarProblems = ?,
              limit_maxLandingPages = ?,
              lastPaymentAmount = ?,
              lastPaymentDate = ?,
              updatedAt = ?
            WHERE id = ?
          `).bind(
            requestData.planId,
            requestData.planName,
            requestData.period,
            startDate.toISOString(),
            endDate.toISOString(),
            plan.maxStudents || -1,
            plan.maxTeachers || -1,
            plan.maxHomeworkChecks || -1,
            plan.maxAIAnalysis || -1,
            plan.maxAIGrading || -1,
            plan.maxCapabilityAnalysis || -1,
            plan.maxConceptAnalysis || -1,
            plan.maxSimilarProblems || -1,
            plan.maxLandingPages || -1,
            requestData.finalPrice,
            now,
            now,
            existingSub.id
          ).run();
        } else {
          // 새 구독 생성
          await env.DB.prepare(`
            INSERT INTO user_subscriptions (
              id, userId, planId, planName, period, status,
              startDate, endDate,
              usage_students, usage_teachers, usage_homeworkChecks, 
              usage_aiAnalysis, usage_aiGrading,
              usage_capabilityAnalysis, usage_conceptAnalysis,
              usage_similarProblems, usage_landingPages,
              limit_maxStudents, limit_maxTeachers, limit_maxHomeworkChecks, 
              limit_maxAIAnalysis, limit_maxAIGrading,
              limit_maxCapabilityAnalysis, limit_maxConceptAnalysis,
              limit_maxSimilarProblems, limit_maxLandingPages,
              lastPaymentAmount, lastPaymentDate, autoRenew,
              createdAt, updatedAt, lastResetDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            subscriptionId,
            requestData.userId,
            requestData.planId,
            requestData.planName,
            requestData.period,
            'active',
            startDate.toISOString(),
            endDate.toISOString(),
            0, 0, 0, 0, 0, 0, 0, 0, 0,  // 현재 사용량 (9개)
            plan.maxStudents || -1,
            plan.maxTeachers || -1,
            plan.maxHomeworkChecks || -1,
            plan.maxAIAnalysis || -1,
            plan.maxAIGrading || -1,
            plan.maxCapabilityAnalysis || -1,
            plan.maxConceptAnalysis || -1,
            plan.maxSimilarProblems || -1,
            plan.maxLandingPages || -1,
            requestData.finalPrice,
            now,
            0,  // autoRenew
            now,
            now,
            now  // lastResetDate
          ).run();
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: '요금제 신청이 승인되었습니다.',
            subscriptionId: existingSub?.id || subscriptionId
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } else if (data.action === 'reject') {
        // 신청 거부
        await env.DB.prepare(`
          UPDATE subscription_requests SET
            status = 'rejected',
            processedAt = ?,
            approvedBy = ?,
            approvedByEmail = ?,
            adminNote = ?
          WHERE id = ?
        `).bind(
          now,
          data.adminName || 'Admin',
          data.adminEmail,
          data.adminNote || '',
          data.requestId
        ).run();
        
        return new Response(
          JSON.stringify({
            success: true,
            message: '요금제 신청이 거부되었습니다.'
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error processing approval:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process approval',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
