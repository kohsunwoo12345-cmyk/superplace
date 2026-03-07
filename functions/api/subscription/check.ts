// 구독 확인 및 사용량 체크 API
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const academyId = url.searchParams.get('academyId');

    console.log('🔍 구독 조회 요청:', { userId, academyId });

    if (!userId && !academyId) {
      return new Response(JSON.stringify({ 
        error: "userId or academyId required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 사용자 ID로 구독 조회
    let subscription = null;
    if (userId) {
      console.log('📝 userId로 조회:', userId);
      subscription = await DB.prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY endDate DESC
        LIMIT 1
      `).bind(userId).first();
      console.log('📊 userId 조회 결과:', subscription ? '발견' : '없음');
    } 
    
    if (!subscription && academyId) {
      // 학원 ID로 구독 조회 (학원장 구독 확인)
      console.log('📝 academyId로 조회:', academyId);
      subscription = await DB.prepare(`
        SELECT us.* FROM user_subscriptions us
        JOIN User u ON us.userId = u.id
        WHERE u.academyId = ? 
          AND u.role = 'DIRECTOR'
          AND us.status = 'active'
        ORDER BY us.endDate DESC
        LIMIT 1
      `).bind(academyId).first();
      console.log('📊 academyId 조회 결과:', subscription ? '발견' : '없음');
    }

    if (!subscription) {
      console.log('❌ 구독 없음');
      return new Response(JSON.stringify({
        success: false,
        hasSubscription: false,
        message: "활성화된 구독이 없습니다. 요금제를 선택해주세요.",
        redirectTo: "/pricing"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('✅ 구독 발견:', subscription.planName);

    // 만료 확인
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (now > endDate) {
      // 구독 만료 처리
      await DB.prepare(`
        UPDATE user_subscriptions 
        SET status = 'expired', updatedAt = datetime('now')
        WHERE id = ?
      `).bind(subscription.id).run();

      return new Response(JSON.stringify({
        success: false,
        hasSubscription: false,
        expired: true,
        message: "구독이 만료되었습니다. 요금제를 갱신해주세요.",
        redirectTo: "/pricing"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ============================================
    // 🔄 실제 사용량 카운트 (academyId 기준)
    // ============================================
    let targetAcademyId = academyId;
    
    if (!targetAcademyId && userId) {
      // userId로 조회 시 해당 사용자의 academyId 찾기
      const userAcademy = await DB.prepare(`
        SELECT academyId FROM User WHERE id = ?
      `).bind(userId).first();
      targetAcademyId = userAcademy?.academyId;
    }

    let actualStudentCount = 0;
    let actualHomeworkChecks = 0;
    let actualAIAnalysis = 0;
    let actualSimilarProblems = 0;
    let actualLandingPages = 0;

    if (targetAcademyId) {
      // 플랜 시작일 계산 (구독 시작일 기준)
      const planStartDate = new Date(subscription.startDate);
      const planStartISO = planStartDate.toISOString();
      
      // 플랜 종료일 (현재 또는 구독 종료일 중 이른 날짜)
      const now = new Date();
      const planEndDate = new Date(subscription.endDate);
      const actualEndDate = now < planEndDate ? now : planEndDate;
      const planEndISO = actualEndDate.toISOString();
      
      console.log(`📅 플랜 기간: ${planStartISO} ~ ${planEndISO}`);

      // 1️⃣ 활성 학생 수 (퇴원하지 않은 학생만) - 학생 수는 월별 초기화 없음
      const studentCountResult = await DB.prepare(`
        SELECT COUNT(*) as count 
        FROM User 
        WHERE academyId = ? 
          AND role = 'STUDENT' 
          AND withdrawnAt IS NULL
      `).bind(targetAcademyId).first();
      actualStudentCount = studentCountResult?.count || 0;

      // 2️⃣ 숙제 검사 횟수 (플랜 기간 동안 제출된 숙제) - homework_submissions 테이블
      try {
        const homeworkResult = await DB.prepare(`
          SELECT COUNT(*) as count 
          FROM homework_submissions hs
          JOIN User u ON hs.userId = u.id
          WHERE u.academyId = ?
            AND hs.submittedAt IS NOT NULL
            AND hs.submittedAt >= ?
            AND hs.submittedAt <= ?
        `).bind(targetAcademyId, planStartISO, planEndISO).first();
        actualHomeworkChecks = homeworkResult?.count || 0;
      } catch (e) {
        console.log('⚠️ homework_submissions 테이블 없음:', e);
        actualHomeworkChecks = 0;
      }

      // 3️⃣ AI 분석 횟수 (플랜 기간 동안) - usage_logs 테이블에서 ai_analysis 타입
      try {
        const aiAnalysisResult = await DB.prepare(`
          SELECT COUNT(*) as count 
          FROM usage_logs ul
          JOIN User u ON ul.userId = u.id
          WHERE u.academyId = ? 
            AND ul.type = 'ai_analysis'
            AND ul.createdAt >= ?
            AND ul.createdAt <= ?
        `).bind(targetAcademyId, planStartISO, planEndISO).first();
        actualAIAnalysis = aiAnalysisResult?.count || 0;
      } catch (e) {
        console.log('⚠️ usage_logs 테이블 없음 또는 조회 실패:', e);
        actualAIAnalysis = 0;
      }

      // 4️⃣ 유사문제 출제 횟수 (플랜 기간 동안) - usage_logs 테이블에서 similar_problem 타입
      try {
        const similarProblemsResult = await DB.prepare(`
          SELECT COUNT(*) as count 
          FROM usage_logs ul
          JOIN User u ON ul.userId = u.id
          WHERE u.academyId = ? 
            AND ul.type = 'similar_problem'
            AND ul.createdAt >= ?
            AND ul.createdAt <= ?
        `).bind(targetAcademyId, planStartISO, planEndISO).first();
        actualSimilarProblems = similarProblemsResult?.count || 0;
      } catch (e) {
        console.log('⚠️ usage_logs 테이블 없음 또는 조회 실패:', e);
        actualSimilarProblems = 0;
      }

      // 5️⃣ 랜딩페이지 생성 수 (플랜 기간 동안) - landing_pages 테이블
      try {
        const landingPagesResult = await DB.prepare(`
          SELECT COUNT(*) as count 
          FROM landing_pages
          WHERE academyId = ?
            AND createdAt >= ?
            AND createdAt <= ?
        `).bind(targetAcademyId, planStartISO, planEndISO).first();
        actualLandingPages = landingPagesResult?.count || 0;
      } catch (e) {
        console.log('⚠️ landing_pages 테이블 없음 또는 조회 실패:', e);
        actualLandingPages = 0;
      }

      console.log(`📊 실제 사용량 카운트 (academyId: ${targetAcademyId})`);
      console.log(`  - 활성 학생 수: ${actualStudentCount}`);
      console.log(`  - 숙제 검사: ${actualHomeworkChecks}`);
      console.log(`  - AI 분석: ${actualAIAnalysis}`);
      console.log(`  - 유사문제: ${actualSimilarProblems}`);
      console.log(`  - 랜딩페이지: ${actualLandingPages}`);
    }

    // 사용량 정보 반환
    return new Response(JSON.stringify({
      success: true,
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
        startDate: subscription.startDate,   // 플랜 시작일 추가
        endDate: subscription.endDate,
        
        // 현재 사용량 (플랜 시작일부터 현재까지)
        usage: {
          students: actualStudentCount,           // 🔄 활성 학생 수
          homeworkChecks: actualHomeworkChecks,   // 🔄 플랜 기간 동안 제출된 숙제 수
          aiAnalysis: actualAIAnalysis,           // 🔄 플랜 기간 동안 AI 분석 수
          similarProblems: actualSimilarProblems, // 🔄 플랜 기간 동안 유사문제 출제 수
          landingPages: actualLandingPages,       // 🔄 플랜 기간 동안 랜딩페이지 수
        },
        
        // 제한 (실제 DB 컬럼만 사용)
        limits: {
          maxStudents: subscription.max_students || 0,
          maxHomeworkChecks: subscription.max_homework_checks || 0,
          maxAIAnalysis: subscription.max_ai_analysis || 0,
          maxSimilarProblems: subscription.max_similar_problems || 0,
          maxLandingPages: subscription.max_landing_pages || 0,
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Subscription check error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to check subscription",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
