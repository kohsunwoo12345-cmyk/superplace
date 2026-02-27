// 사용량 증가 및 체크 API
interface Env {
  DB: D1Database;
}

type UsageType = 'student' | 'teacher' | 'homework_check' | 'ai_grading' | 'capability_analysis' | 'concept_analysis' | 'similar_problem' | 'landing_page';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { DB } = env;
  
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await request.json();
    const { userId, academyId, type, action = 'create', metadata = {} } = data;

    if (!userId && !academyId) {
      return new Response(JSON.stringify({ error: 'userId or academyId required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!type) {
      return new Response(JSON.stringify({ error: 'type required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 구독 확인
    let subscription = null;
    if (userId) {
      subscription = await DB.prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY endDate DESC LIMIT 1
      `).bind(userId).first();
    } else if (academyId) {
      subscription = await DB.prepare(`
        SELECT us.* FROM user_subscriptions us
        JOIN User u ON us.userId = u.id
        WHERE u.academyId = ? AND u.role = 'DIRECTOR' AND us.status = 'active'
        ORDER BY us.endDate DESC LIMIT 1
      `).bind(parseInt(academyId)).first();
    }

    if (!subscription) {
      return new Response(JSON.stringify({
        success: false,
        error: 'NO_SUBSCRIPTION',
        message: '활성화된 구독이 없습니다. 요금제를 선택해주세요.',
        redirectTo: '/pricing'
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 만료 확인
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (now > endDate) {
      await DB.prepare(`
        UPDATE user_subscriptions SET status = 'expired', updatedAt = datetime('now')
        WHERE id = ?
      `).bind(subscription.id).run();

      return new Response(JSON.stringify({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
        message: '구독이 만료되었습니다. 요금제를 갱신해주세요.',
        redirectTo: '/pricing'
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 사용량 체크 및 증가
    const usageMapping: { [key in UsageType]: { currentField: string, maxField: string } } = {
      'student': { currentField: 'current_students', maxField: 'max_students' },
      'teacher': { currentField: 'current_teachers', maxField: 'max_teachers' },
      'homework_check': { currentField: 'current_homework_checks', maxField: 'max_homework_checks' },
      'ai_grading': { currentField: 'current_ai_grading', maxField: 'max_ai_grading' },
      'capability_analysis': { currentField: 'current_capability_analysis', maxField: 'max_capability_analysis' },
      'concept_analysis': { currentField: 'current_concept_analysis', maxField: 'max_concept_analysis' },
      'similar_problem': { currentField: 'current_similar_problems', maxField: 'max_similar_problems' },
      'landing_page': { currentField: 'current_landing_pages', maxField: 'max_landing_pages' },
    };

    const mapping = usageMapping[type as UsageType];
    if (!mapping) {
      return new Response(JSON.stringify({ error: 'Invalid usage type' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentUsage = (subscription as any)[mapping.currentField] || 0;
    const maxLimit = (subscription as any)[mapping.maxField];

    // create 액션일 때만 제한 체크
    if (action === 'create' || action === 'use') {
      // -1은 무제한
      if (maxLimit !== -1 && currentUsage >= maxLimit) {
        return new Response(JSON.stringify({
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: `${getUsageTypeName(type)} 사용량이 초과되었습니다. (${currentUsage}/${maxLimit}) 상위 플랜으로 업그레이드해주세요.`,
          currentUsage,
          maxLimit,
          redirectTo: '/pricing'
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 사용량 증가
      await DB.prepare(`
        UPDATE user_subscriptions 
        SET ${mapping.currentField} = ${mapping.currentField} + 1,
            updatedAt = datetime('now')
        WHERE id = ?
      `).bind(subscription.id).run();

      // 사용량 로그 기록
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await DB.prepare(`
        INSERT INTO usage_logs (id, userId, subscriptionId, type, action, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        logId,
        subscription.userId,
        subscription.id,
        type,
        action,
        JSON.stringify(metadata)
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: '사용량이 기록되었습니다.',
        currentUsage: currentUsage + 1,
        maxLimit
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } else if (action === 'delete') {
      // 사용량 감소 (0 이하로는 내려가지 않음)
      await DB.prepare(`
        UPDATE user_subscriptions 
        SET ${mapping.currentField} = MAX(0, ${mapping.currentField} - 1),
            updatedAt = datetime('now')
        WHERE id = ?
      `).bind(subscription.id).run();

      // 로그 기록
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await DB.prepare(`
        INSERT INTO usage_logs (id, userId, subscriptionId, type, action, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        logId,
        subscription.userId,
        subscription.id,
        type,
        action,
        JSON.stringify(metadata)
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: '사용량이 감소되었습니다.',
        currentUsage: Math.max(0, currentUsage - 1),
        maxLimit
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Usage increment error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to increment usage",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

function getUsageTypeName(type: string): string {
  const names: { [key: string]: string } = {
    'student': '학생 등록',
    'teacher': '선생님 등록',
    'homework_check': '숙제 검사',
    'ai_grading': 'AI 채점',
    'capability_analysis': '역량 분석',
    'concept_analysis': '부족한 개념 분석',
    'similar_problem': '유사 문제 생성',
    'landing_page': '랜딩페이지 생성',
  };
  return names[type] || type;
}
