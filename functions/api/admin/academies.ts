// Cloudflare Pages Function
// GET /api/admin/academies - User 테이블의 DIRECTOR 역할 사용자를 학원으로 표시
// GET /api/admin/academies?id=X - 특정 학원 상세 정보 조회

import { getUserFromAuth } from '../../_lib/auth';

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // 인증 확인
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Unauthorized" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = getUserFromAuth(request);
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid token" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // URL 파라미터 확인 - 개별 학원 조회 여부
    const url = new URL(request.url);
    const academyId = url.searchParams.get('id');

    console.log('📊 Fetching academies - user:', user.userId || user.id);

    // 🎯 핵심: /api/admin/users와 동일한 로직 사용
    // User 테이블에서 role='DIRECTOR'인 사용자를 학원으로 표시
    
    const directorsQuery = `
      SELECT 
        u.id as userId,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.academyId,
        a.name as academyName,
        a.address,
        a.code as academyCode
      FROM User u
      LEFT JOIN Academy a ON u.academyId = a.id
      WHERE u.role = 'DIRECTOR'
      ORDER BY u.id DESC
      LIMIT 1000
    `;

    const result = await env.DB.prepare(directorsQuery).all();
    const directors = result.results || [];

    console.log(`✅ Found ${directors.length} directors in User table`);

    // 개별 학원 상세 조회
    if (academyId) {
      const targetDirector = directors.find(d => 
        `academy-${d.academyId}` === academyId || 
        `dir-${d.userId}` === academyId ||
        d.academyId === academyId ||
        d.userId === academyId
      );

      if (!targetDirector) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Academy not found',
          message: '해당 학원을 찾을 수 없습니다'
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 상세 정보 조회
      const studentsQuery = `
        SELECT COUNT(*) as count 
        FROM User 
        WHERE academyId = ? AND role = 'STUDENT'
      `;
      const studentsResult = await env.DB.prepare(studentsQuery).bind(targetDirector.academyId).first();
      const studentCount = studentsResult?.count || 0;

      const teachersQuery = `
        SELECT COUNT(*) as count 
        FROM User 
        WHERE academyId = ? AND role = 'TEACHER'
      `;
      const teachersResult = await env.DB.prepare(teachersQuery).bind(targetDirector.academyId).first();
      const teacherCount = teachersResult?.count || 0;

      // 🆕 구독 정보 조회 (새로운 user_subscriptions 테이블 사용)
      let currentPlan = {
        planName: '구독 없음',
        status: 'none',
        maxStudents: 0,
        usedStudents: studentCount,
        maxTeachers: 0,
        usedTeachers: teacherCount,
        maxHomeworkChecks: 0,
        usedHomeworkChecks: 0,
        maxAIAnalysis: 0,
        usedAIAnalysis: 0,
        maxAIGrading: 0,
        usedAIGrading: 0,
        maxCapabilityAnalysis: 0,
        usedCapabilityAnalysis: 0,
        maxConceptAnalysis: 0,
        usedConceptAnalysis: 0,
        maxSimilarProblems: 0,
        usedSimilarProblems: 0,
        maxLandingPages: 0,
        usedLandingPages: 0,
        startDate: null,
        endDate: null,
        daysRemaining: 0,
        active: false,
        period: null
      };

      try {
        // user_subscriptions 테이블에서 조회 (학원장의 구독 정보)
        const subscriptionQuery = `
          SELECT * FROM user_subscriptions 
          WHERE userId = ? 
          AND status = 'active' 
          ORDER BY createdAt DESC 
          LIMIT 1
        `;
        const subscription = await env.DB.prepare(subscriptionQuery).bind(targetDirector.userId).first();
        
        if (subscription) {
          const now = new Date();
          const endDate = new Date(subscription.endDate);
          const isExpired = now > endDate;
          
          currentPlan = {
            planName: subscription.planName || 'Unknown Plan',
            status: isExpired ? 'expired' : 'active',
            period: subscription.period || '1month',
            maxStudents: subscription.limit_maxStudents || 0,
            usedStudents: subscription.usage_students || 0,
            maxTeachers: subscription.limit_maxTeachers || 0,
            usedTeachers: subscription.usage_teachers || 0,
            maxHomeworkChecks: subscription.limit_maxHomeworkChecks || 0,
            usedHomeworkChecks: subscription.usage_homeworkChecks || 0,
            maxAIAnalysis: subscription.limit_maxAIAnalysis || 0,
            usedAIAnalysis: subscription.usage_aiAnalysis || 0,
            maxAIGrading: subscription.limit_maxAIGrading || 0,
            usedAIGrading: subscription.usage_aiGrading || 0,
            maxCapabilityAnalysis: subscription.limit_maxCapabilityAnalysis || 0,
            usedCapabilityAnalysis: subscription.usage_capabilityAnalysis || 0,
            maxConceptAnalysis: subscription.limit_maxConceptAnalysis || 0,
            usedConceptAnalysis: subscription.usage_conceptAnalysis || 0,
            maxSimilarProblems: subscription.limit_maxSimilarProblems || 0,
            usedSimilarProblems: subscription.usage_similarProblems || 0,
            maxLandingPages: subscription.limit_maxLandingPages || 0,
            usedLandingPages: subscription.usage_landingPages || 0,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            daysRemaining: isExpired ? 0 : Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
            active: !isExpired,
            autoRenew: subscription.autoRenew === 1,
            lastPaymentAmount: subscription.lastPaymentAmount,
            lastPaymentDate: subscription.lastPaymentDate
          };
        }
      } catch (err) {
        console.log('⚠️ user_subscriptions 조회 실패:', err.message);
      }

      // 🆕 할당된 봇 수 조회
      let assignedBotsCount = 0;
      try {
        const botsCountQuery = `
          SELECT COUNT(DISTINCT botId) as count
          FROM bot_assignments
          WHERE academyId = ? AND isActive = 1
        `;
        const botsCountResult = await env.DB.prepare(botsCountQuery).bind(targetDirector.academyId).first();
        assignedBotsCount = botsCountResult?.count || 0;
      } catch (err) {
        console.log('⚠️ bot_assignments 조회 실패');
      }

      // 🆕 클래스 수 조회
      let classCount = 0;
      try {
        const classCountQuery = `
          SELECT COUNT(DISTINCT id) as count
          FROM Class
          WHERE academyId = ?
        `;
        const classCountResult = await env.DB.prepare(classCountQuery).bind(targetDirector.academyId).first();
        classCount = classCountResult?.count || 0;
      } catch (err) {
        console.log('⚠️ Class 조회 실패');
      }

      // 🔧 프론트엔드가 기대하는 형식으로 변환
      const academy = {
        id: `dir-${targetDirector.userId}`,
        academyId: targetDirector.academyId || `academy-${targetDirector.userId}`,
        name: targetDirector.academyName || `${targetDirector.name}의 학원`,
        code: targetDirector.academyCode || `CODE-${targetDirector.academyId}`,
        description: targetDirector.description || undefined,
        address: targetDirector.address || '주소 미등록',
        phone: targetDirector.phone || '전화번호 미등록',
        email: targetDirector.email,
        logoUrl: targetDirector.logoUrl || undefined,
        subscriptionPlan: currentPlan.planName, // 프론트엔드가 기대하는 필드명
        maxStudents: currentPlan.maxStudents, // currentPlan에서 가져오기
        maxTeachers: currentPlan.maxTeachers, // currentPlan에서 가져오기
        isActive: 1, // 프론트엔드가 기대하는 필드명 (1 = active)
        createdAt: targetDirector.createdAt || new Date().toISOString(),
        updatedAt: targetDirector.updatedAt || new Date().toISOString(),
        director: {
          id: targetDirector.userId,
          name: targetDirector.name,
          email: targetDirector.email,
          phone: targetDirector.phone || undefined
        },
        students: [], // 프론트엔드가 기대하는 빈 배열
        teachers: [], // 프론트엔드가 기대하는 빈 배열
        studentCount,
        teacherCount,
        totalChats: 0,
        attendanceCount: 0,
        homeworkCount: 0,
        monthlyActivity: [ // 프론트엔드가 기대하는 필드명
          { month: 'Jan', count: 0 },
          { month: 'Feb', count: 0 },
          { month: 'Mar', count: 0 },
          { month: 'Apr', count: 0 },
          { month: 'May', count: 0 },
          { month: 'Jun', count: 0 },
          { month: 'Jul', count: 0 },
          { month: 'Aug', count: 0 },
          { month: 'Sep', count: 0 },
          { month: 'Oct', count: 0 },
          { month: 'Nov', count: 0 },
          { month: 'Dec', count: 0 }
        ],
        assignedBots: [],
        payments: [],
        revenue: {
          totalRevenue: 0,
          transactionCount: 0
        },
        // 🆕 추가 정보 (백엔드용)
        directorId: targetDirector.userId,
        classCount,
        assignedBotsCount,
        currentPlan, // 상세 구독 정보
        subscriptionStatus: currentPlan.status,
        subscriptionPlanName: currentPlan.planName,
        subscriptionEndDate: currentPlan.endDate,
        subscriptionDaysRemaining: currentPlan.daysRemaining
      };

      return new Response(JSON.stringify({ 
        success: true, 
        academy 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 전체 학원 목록 반환 (각 director를 academy로 변환)
    const academies = directors.map(director => ({
      id: `dir-${director.userId}`,
      academyId: director.academyId || `academy-${director.userId}`,
      name: director.academyName || `${director.name}의 학원`,
      address: director.address || '주소 미등록',
      phone: director.phone || '전화번호 미등록',
      email: director.email,
      directorId: director.userId,
      directorName: director.name,
      directorEmail: director.email,
      directorPhone: director.phone || '전화번호 미등록',
      studentCount: 0, // 목록에서는 0으로 표시 (상세 조회시 계산)
      teacherCount: 0,
      active: true,
      createdAt: director.createdAt || new Date().toISOString(),
      academyCode: director.academyCode
    }));

    console.log(`🎉 Returning ${academies.length} academies from ${directors.length} directors`);

    return new Response(JSON.stringify({ 
      success: true, 
      academies,
      total: academies.length,
      source: 'user_table_directors'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('❌ Academies API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack?.substring(0, 200),
      message: 'Failed to fetch academies. Check Cloudflare Pages logs.'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
