// 구독 한도 알림 체크 및 전송 API
// 한도 90%, 95%, 100% 도달 시 학원장에게 알림

interface Env {
  DB: D1Database;
}

interface UsageAlert {
  type: 'student' | 'homework_check' | 'ai_analysis' | 'similar_problem' | 'landing_page';
  current: number;
  limit: number;
  percentage: number;
  threshold: 90 | 95 | 100;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { academyId } = await context.request.json();
    
    if (!academyId) {
      return new Response(JSON.stringify({ 
        error: "academyId required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log(`🔔 알림 체크 시작: academyId=${academyId}`);
    
    // 구독 정보 조회
    const subscription = await DB.prepare(`
      SELECT us.*, u.id as directorId, u.name as directorName, u.email as directorEmail
      FROM user_subscriptions us
      JOIN users u ON us.userId = u.id
      WHERE u.academyId = ? 
        AND u.role = 'DIRECTOR'
        AND us.status = 'active'
      ORDER BY us.endDate DESC
      LIMIT 1
    `).bind(academyId).first();
    
    if (!subscription) {
      return new Response(JSON.stringify({
        success: false,
        message: "활성 구독이 없습니다"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // ============================================
    // 실제 사용량 카운트
    // ============================================
    const studentCountResult = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM User 
      WHERE academyId = ? AND role = 'STUDENT' AND withdrawnAt IS NULL
    `).bind(academyId).first();
    const actualStudents = studentCountResult?.count || 0;
    
    const homeworkResult = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM homework_gradings hg
      JOIN homework_submissions hs ON hg.submissionId = hs.id
      WHERE hs.academyId = ?
    `).bind(academyId).first();
    const actualHomework = homeworkResult?.count || 0;
    
    const aiAnalysisResult = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM usage_logs ul
      JOIN users u ON ul.userId = u.id
      WHERE u.academyId = ? AND ul.type = 'ai_analysis'
    `).bind(academyId).first();
    const actualAI = aiAnalysisResult?.count || 0;
    
    const similarProblemsResult = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM usage_logs ul
      JOIN users u ON ul.userId = u.id
      WHERE u.academyId = ? AND ul.type = 'similar_problem'
    `).bind(academyId).first();
    const actualSimilar = similarProblemsResult?.count || 0;
    
    const landingPagesResult = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM landing_pages
      WHERE academyId = ?
    `).bind(academyId).first();
    const actualLanding = landingPagesResult?.count || 0;
    
    // ============================================
    // 알림이 필요한 항목 체크
    // ============================================
    const alerts: UsageAlert[] = [];
    
    function checkThreshold(
      type: UsageAlert['type'], 
      current: number, 
      limit: number,
      typeName: string
    ) {
      if (limit === -1) return; // 무제한은 체크 안 함
      
      const percentage = Math.round((current / limit) * 100);
      
      if (percentage >= 100) {
        alerts.push({ type, current, limit, percentage, threshold: 100 });
        console.log(`🚨 ${typeName} 한도 초과: ${current}/${limit} (${percentage}%)`);
      } else if (percentage >= 95) {
        alerts.push({ type, current, limit, percentage, threshold: 95 });
        console.log(`⚠️ ${typeName} 95% 도달: ${current}/${limit} (${percentage}%)`);
      } else if (percentage >= 90) {
        alerts.push({ type, current, limit, percentage, threshold: 90 });
        console.log(`⚠️ ${typeName} 90% 도달: ${current}/${limit} (${percentage}%)`);
      }
    }
    
    checkThreshold('student', actualStudents, subscription.max_students, '학생 등록');
    checkThreshold('homework_check', actualHomework, subscription.max_homework_checks, '숙제 검사');
    checkThreshold('ai_analysis', actualAI, subscription.max_ai_analysis, 'AI 분석');
    checkThreshold('similar_problem', actualSimilar, subscription.max_similar_problems, '유사문제');
    checkThreshold('landing_page', actualLanding, subscription.max_landing_pages, '랜딩페이지');
    
    // ============================================
    // 알림 로그 기록 (중복 방지)
    // ============================================
    const savedAlerts = [];
    
    for (const alert of alerts) {
      // 최근 24시간 내 같은 알림이 있는지 확인
      const existingAlert = await DB.prepare(`
        SELECT id FROM usage_alerts 
        WHERE academyId = ? 
          AND type = ? 
          AND threshold = ?
          AND createdAt > datetime('now', '-24 hours')
        LIMIT 1
      `).bind(academyId, alert.type, alert.threshold).first();
      
      if (!existingAlert) {
        // 새 알림 저장
        const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await DB.prepare(`
          INSERT INTO usage_alerts (
            id, academyId, directorId, type, current, limit, percentage, 
            threshold, planName, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          alertId,
          academyId,
          subscription.directorId,
          alert.type,
          alert.current,
          alert.limit,
          alert.percentage,
          alert.threshold,
          subscription.planName
        ).run();
        
        savedAlerts.push({
          id: alertId,
          ...alert
        });
        
        console.log(`💾 알림 저장: ${alert.type} ${alert.threshold}%`);
      } else {
        console.log(`⏭️ 중복 알림 스킵: ${alert.type} ${alert.threshold}%`);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      alerts: savedAlerts,
      summary: {
        total: alerts.length,
        saved: savedAlerts.length,
        skipped: alerts.length - savedAlerts.length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("알림 체크 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "알림 체크 실패",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
