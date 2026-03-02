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

      // 🆕 Academy 테이블에서 실제 학원 정보 조회
      let academyInfo = {
        name: targetDirector.academyName || `${targetDirector.name}의 학원`,
        code: targetDirector.academyCode || `CODE-${targetDirector.academyId}`,
        address: targetDirector.address || '주소 미등록',
        phone: targetDirector.phone || '전화번호 미등록',
        email: targetDirector.email,
        description: null,
        logoUrl: null
      };
      
      try {
        const academyData = await env.DB.prepare(`
          SELECT name, code, address, phone, email, description, logoUrl
          FROM Academy
          WHERE id = ?
        `).bind(targetDirector.academyId).first();
        
        if (academyData) {
          academyInfo = {
            name: academyData.name || academyInfo.name,
            code: academyData.code || academyInfo.code,
            address: academyData.address || academyInfo.address,
            phone: academyData.phone || academyInfo.phone,
            email: academyData.email || academyInfo.email,
            description: academyData.description,
            logoUrl: academyData.logoUrl
          };
          console.log('✅ Academy 정보 조회 성공:', academyInfo.name);
        }
      } catch (err) {
        console.log('⚠️ Academy 테이블 조회 실패, User 정보 사용');
      }

      // 🆕 실제 학생 목록 조회
      let students = [];
      let studentCount = 0;
      try {
        const studentsData = await env.DB.prepare(`
          SELECT id, name, email, phone, createdAt
          FROM User
          WHERE academyId = ? AND role = 'STUDENT'
          ORDER BY createdAt DESC
          LIMIT 500
        `).bind(targetDirector.academyId).all();
        
        students = (studentsData.results || []).map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone || null,
          createdAt: s.createdAt
        }));
        studentCount = students.length;
        console.log(`✅ 학생 ${studentCount}명 조회`);
      } catch (err) {
        console.log('⚠️ 학생 목록 조회 실패');
      }

      // 🆕 실제 교사 목록 조회
      let teachers = [];
      let teacherCount = 0;
      try {
        const teachersData = await env.DB.prepare(`
          SELECT id, name, email, phone, createdAt
          FROM User
          WHERE academyId = ? AND role = 'TEACHER'
          ORDER BY createdAt DESC
          LIMIT 100
        `).bind(targetDirector.academyId).all();
        
        teachers = (teachersData.results || []).map(t => ({
          id: t.id,
          name: t.name,
          email: t.email,
          phone: t.phone || null,
          createdAt: t.createdAt
        }));
        teacherCount = teachers.length;
        console.log(`✅ 교사 ${teacherCount}명 조회`);
      } catch (err) {
        console.log('⚠️ 교사 목록 조회 실패');
      }

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

      // 🆕 할당된 봇 상세 목록 조회
      let assignedBots = [];
      let assignedBotsCount = 0;
      try {
        const botsData = await env.DB.prepare(`
          SELECT ba.id, ba.botId, ab.name, ab.description, ba.assignedAt, ba.isActive as status
          FROM bot_assignments ba
          LEFT JOIN ai_bots ab ON ba.botId = ab.id
          WHERE ba.academyId = ? AND ba.isActive = 1
          ORDER BY ba.assignedAt DESC
        `).bind(targetDirector.academyId).all();
        
        assignedBots = (botsData.results || []).map(bot => ({
          id: bot.id,
          botId: bot.botId,
          name: bot.name || 'Unknown Bot',
          description: bot.description,
          assignedAt: bot.assignedAt,
          status: bot.status === 1 ? 'active' : 'inactive'
        }));
        assignedBotsCount = assignedBots.length;
        console.log(`✅ 할당된 봇 ${assignedBotsCount}개 조회`);
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

      // 🆕 결제 내역 조회 (subscription_requests)
      let payments = [];
      try {
        const paymentsData = await env.DB.prepare(`
          SELECT id, planName, finalPrice as amount, status, createdAt, processedAt as approvedAt
          FROM subscription_requests
          WHERE userId = ?
          ORDER BY createdAt DESC
          LIMIT 50
        `).bind(targetDirector.userId).all();
        
        payments = (paymentsData.results || []).map(p => ({
          id: p.id,
          planName: p.planName,
          amount: p.amount || 0,
          status: p.status,
          createdAt: p.createdAt,
          approvedAt: p.approvedAt
        }));
        console.log(`✅ 결제 내역 ${payments.length}건 조회`);
      } catch (err) {
        console.log('⚠️ 결제 내역 조회 실패');
      }

      // 🆕 활동 통계 조회 (totalChats, attendanceCount, homeworkCount)
      let totalChats = 0;
      let attendanceCount = 0;
      let homeworkCount = 0;
      
      try {
        // Chat 기록 조회
        const chatsData = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM ChatMessage WHERE academyId = ?
        `).bind(targetDirector.academyId).first();
        totalChats = chatsData?.count || 0;
      } catch (err) {
        console.log('⚠️ Chat 통계 조회 실패');
      }
      
      try {
        // 출석 기록 조회
        const attendanceData = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM Attendance WHERE academyId = ?
        `).bind(targetDirector.academyId).first();
        attendanceCount = attendanceData?.count || 0;
      } catch (err) {
        console.log('⚠️ 출석 통계 조회 실패');
      }
      
      try {
        // 숙제 기록 조회
        const homeworkData = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM Homework WHERE academyId = ?
        `).bind(targetDirector.academyId).first();
        homeworkCount = homeworkData?.count || 0;
      } catch (err) {
        console.log('⚠️ 숙제 통계 조회 실패');
      }

      // 🆕 수익 통계 조회
      let revenue = { totalRevenue: 0, transactionCount: 0 };
      try {
        const revenueData = await env.DB.prepare(`
          SELECT 
            SUM(CASE WHEN status = 'approved' THEN finalPrice ELSE 0 END) as totalRevenue,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as transactionCount
          FROM subscription_requests
          WHERE userId = ?
        `).bind(targetDirector.userId).first();
        
        if (revenueData) {
          revenue = {
            totalRevenue: revenueData.totalRevenue || 0,
            transactionCount: revenueData.transactionCount || 0
          };
        }
      } catch (err) {
        console.log('⚠️ 수익 통계 조회 실패');
      }

      // 🆕 로그인 IP 기록 조회 (user_login_logs)
      let loginLogs = [];
      try {
        const logsData = await env.DB.prepare(`
          SELECT id, ipAddress, userAgent, deviceType, country, loginAt
          FROM user_login_logs
          WHERE userId = ?
          ORDER BY loginAt DESC
          LIMIT 20
        `).bind(targetDirector.userId).all();
        
        loginLogs = (logsData.results || []).map(log => ({
          id: log.id,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          deviceType: log.deviceType,
          country: log.country,
          loginAt: log.loginAt
        }));
        console.log(`✅ 로그인 기록 ${loginLogs.length}건 조회`);
      } catch (err) {
        console.log('⚠️ 로그인 기록 조회 실패:', err.message);
      }

      // 🔧 프론트엔드가 기대하는 형식으로 변환
      const academy = {
        id: `dir-${targetDirector.userId}`,
        academyId: targetDirector.academyId || `academy-${targetDirector.userId}`,
        name: academyInfo.name, // 🆕 Academy 테이블에서 가져온 실제 학원 이름
        code: academyInfo.code,
        description: academyInfo.description,
        address: academyInfo.address,
        phone: academyInfo.phone,
        email: academyInfo.email,
        logoUrl: academyInfo.logoUrl,
        subscriptionPlan: currentPlan.planName,
        maxStudents: currentPlan.maxStudents,
        maxTeachers: currentPlan.maxTeachers,
        isActive: 1,
        createdAt: targetDirector.createdAt || new Date().toISOString(),
        updatedAt: targetDirector.updatedAt || new Date().toISOString(),
        director: {
          id: targetDirector.userId,
          name: targetDirector.name,
          email: targetDirector.email,
          phone: targetDirector.phone || undefined
        },
        students, // 🆕 실제 학생 목록
        teachers, // 🆕 실제 교사 목록
        studentCount,
        teacherCount,
        totalChats, // 🆕 실제 채팅 수
        attendanceCount, // 🆕 실제 출석 수
        homeworkCount, // 🆕 실제 숙제 수
        monthlyActivity: [
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
        assignedBots, // 🆕 실제 할당된 봇 목록
        payments, // 🆕 실제 결제 내역
        revenue, // 🆕 실제 수익 통계
        loginLogs, // 🆕 로그인 IP 기록
        // 🆕 추가 정보 (백엔드용)
        directorId: targetDirector.userId,
        classCount,
        assignedBotsCount,
        currentPlan,
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
