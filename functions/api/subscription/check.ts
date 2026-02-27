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
      subscription = await DB.prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY endDate DESC
        LIMIT 1
      `).bind(userId).first();
    } else if (academyId) {
      // 학원 ID로 구독 조회 (학원장 구독 확인)
      subscription = await DB.prepare(`
        SELECT us.* FROM user_subscriptions us
        JOIN User u ON us.userId = u.id
        WHERE u.academyId = ? 
          AND u.role = 'DIRECTOR'
          AND us.status = 'active'
        ORDER BY us.endDate DESC
        LIMIT 1
      `).bind(parseInt(academyId)).first();
    }

    if (!subscription) {
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

    // 사용량 정보 반환
    return new Response(JSON.stringify({
      success: true,
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
        endDate: subscription.endDate,
        
        // 현재 사용량
        usage: {
          students: subscription.current_students || 0,
          teachers: subscription.current_teachers || 0,
          homeworkChecks: subscription.current_homework_checks || 0,
          aiAnalysis: subscription.current_ai_analysis || 0,
          aiGrading: subscription.current_ai_grading || 0,
          capabilityAnalysis: subscription.current_capability_analysis || 0,
          conceptAnalysis: subscription.current_concept_analysis || 0,
          similarProblems: subscription.current_similar_problems || 0,
          landingPages: subscription.current_landing_pages || 0,
        },
        
        // 제한
        limits: {
          maxStudents: subscription.max_students,
          maxTeachers: subscription.max_teachers,
          maxHomeworkChecks: subscription.max_homework_checks,
          maxAIAnalysis: subscription.max_ai_analysis,
          maxAIGrading: subscription.max_ai_grading,
          maxCapabilityAnalysis: subscription.max_capability_analysis,
          maxConceptAnalysis: subscription.max_concept_analysis,
          maxSimilarProblems: subscription.max_similar_problems,
          maxLandingPages: subscription.max_landing_pages,
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
