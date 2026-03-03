// 구독 사용량 조회 성능 최적화를 위한 인덱스 추가 API
// 기존 테이블에만 인덱스 추가 (테이블 구조 변경 없음)

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    console.log("🚀 구독 사용량 조회 성능 최적화 시작...");
    
    const indexes = [];
    
    // ============================================
    // 1. User 테이블 인덱스 (학생 카운트 최적화)
    // ============================================
    try {
      // academyId + role + withdrawnAt 복합 인덱스
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_user_academy_role_withdrawn 
        ON User(academyId, role, withdrawnAt)
      `).run();
      indexes.push("✅ User: idx_user_academy_role_withdrawn (academyId, role, withdrawnAt)");
    } catch (error: any) {
      indexes.push(`❌ User 인덱스 실패: ${error.message}`);
    }
    
    // ============================================
    // 2. homework_submissions 인덱스 (숙제 검사 최적화)
    // ============================================
    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_homework_submissions_academy 
        ON homework_submissions(academyId)
      `).run();
      indexes.push("✅ homework_submissions: idx_homework_submissions_academy");
    } catch (error: any) {
      indexes.push(`❌ homework_submissions 인덱스 실패: ${error.message}`);
    }
    
    // ============================================
    // 3. homework_gradings 인덱스
    // ============================================
    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_homework_gradings_submission 
        ON homework_gradings(submissionId)
      `).run();
      indexes.push("✅ homework_gradings: idx_homework_gradings_submission");
    } catch (error: any) {
      indexes.push(`❌ homework_gradings 인덱스 실패: ${error.message}`);
    }
    
    // ============================================
    // 4. usage_logs 인덱스 (AI 분석, 유사문제 최적화)
    // ============================================
    try {
      // userId + type 복합 인덱스
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_user_type 
        ON usage_logs(userId, type)
      `).run();
      indexes.push("✅ usage_logs: idx_usage_logs_user_type (userId, type)");
    } catch (error: any) {
      indexes.push(`❌ usage_logs 인덱스 실패: ${error.message}`);
    }
    
    // createdAt 인덱스 (트렌드 분석용)
    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_usage_logs_created 
        ON usage_logs(createdAt)
      `).run();
      indexes.push("✅ usage_logs: idx_usage_logs_created");
    } catch (error: any) {
      indexes.push(`❌ usage_logs createdAt 인덱스 실패: ${error.message}`);
    }
    
    // ============================================
    // 5. landing_pages 인덱스
    // ============================================
    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_landing_pages_academy 
        ON landing_pages(academyId)
      `).run();
      indexes.push("✅ landing_pages: idx_landing_pages_academy");
    } catch (error: any) {
      indexes.push(`❌ landing_pages 인덱스 실패: ${error.message}`);
    }
    
    // createdAt 인덱스 (트렌드 분석용)
    try {
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_landing_pages_created 
        ON landing_pages(createdAt)
      `).run();
      indexes.push("✅ landing_pages: idx_landing_pages_created");
    } catch (error: any) {
      indexes.push(`❌ landing_pages createdAt 인덱스 실패: ${error.message}`);
    }
    
    // ============================================
    // 6. user_subscriptions 인덱스
    // ============================================
    try {
      // userId + status 복합 인덱스
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
        ON user_subscriptions(userId, status)
      `).run();
      indexes.push("✅ user_subscriptions: idx_user_subscriptions_user_status");
    } catch (error: any) {
      indexes.push(`❌ user_subscriptions 인덱스 실패: ${error.message}`);
    }
    
    console.log("✅ 인덱스 최적화 완료");
    
    return new Response(JSON.stringify({
      success: true,
      message: "구독 사용량 조회 성능 최적화 완료",
      indexes: indexes,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("인덱스 최적화 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "인덱스 최적화 실패",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
