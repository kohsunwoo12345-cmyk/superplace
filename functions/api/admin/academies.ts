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

      // 구독 플랜 조회
      let currentPlan = {
        planName: 'Free Plan',
        maxStudents: 5,
        usedStudents: studentCount,
        maxHomeworkChecks: 10,
        usedHomeworkChecks: 0,
        maxAIAnalysis: 5,
        usedAIAnalysis: 0,
        maxSimilarProblems: 10,
        usedSimilarProblems: 0,
        maxLandingPages: 1,
        usedLandingPages: 0,
        startDate: targetDirector.createdAt || new Date().toISOString(),
        endDate: new Date(Date.now() + 999 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 999,
        active: true
      };

      try {
        const planQuery = `
          SELECT * FROM SubscriptionPlan 
          WHERE academyId = ? 
          AND status = 'active' 
          ORDER BY createdAt DESC 
          LIMIT 1
        `;
        const plan = await env.DB.prepare(planQuery).bind(targetDirector.academyId).first();
        
        if (plan) {
          currentPlan = {
            planName: plan.planName || 'Custom Plan',
            maxStudents: plan.maxStudents || 5,
            usedStudents: studentCount,
            maxHomeworkChecks: plan.maxHomeworkChecks || 10,
            usedHomeworkChecks: 0,
            maxAIAnalysis: plan.maxAIAnalysis || 5,
            usedAIAnalysis: 0,
            maxSimilarProblems: plan.maxSimilarProblems || 10,
            usedSimilarProblems: 0,
            maxLandingPages: plan.maxLandingPages || 1,
            usedLandingPages: 0,
            startDate: plan.startDate || plan.createdAt,
            endDate: plan.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            daysRemaining: Math.ceil((new Date(plan.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
            active: true
          };
        }
      } catch (err) {
        console.log('⚠️ SubscriptionPlan table not found, using default plan');
      }

      const academy = {
        id: `dir-${targetDirector.userId}`,
        academyId: targetDirector.academyId || `academy-${targetDirector.userId}`,
        name: targetDirector.academyName || `${targetDirector.name}의 학원`,
        address: targetDirector.address || '주소 미등록',
        phone: targetDirector.phone || '전화번호 미등록',
        email: targetDirector.email,
        directorId: targetDirector.userId,
        directorName: targetDirector.name,
        directorEmail: targetDirector.email,
        directorPhone: targetDirector.phone || '전화번호 미등록',
        studentCount,
        teacherCount,
        active: true,
        createdAt: targetDirector.createdAt || new Date().toISOString(),
        currentPlan,
        monthlyStats: {
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        },
        assignedBots: [],
        payments: [],
        revenue: {
          totalRevenue: 0,
          transactionCount: 0
        }
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
