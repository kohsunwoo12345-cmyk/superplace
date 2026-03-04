// API: 학원 목록 조회
// GET /api/admin/academies

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Database not configured" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "인증 토큰이 필요합니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰 파싱 (id|email|role|academyId|timestamp 형식)
    let userId = null;
    let userEmail = null;
    let userRole = null;
    let userAcademyId = null;
    
    try {
      const parts = token.split('|');
      if (parts.length >= 3) {
        userId = parts[0];
        userEmail = parts[1];
        userRole = parts[2];
        userAcademyId = parts[3] || null;
        console.log('✅ 토큰 파싱 성공:', { userId, userEmail, userRole, userAcademyId });
      } else {
        throw new Error('Invalid token format');
      }
    } catch (e) {
      console.error('토큰 파싱 오류:', e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "유효하지 않은 토큰입니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 관리자 또는 학원장 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(userRole)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "관리자 또는 학원장 권한이 필요합니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학원장인 경우 본인의 academyId 사용
    let directorAcademyId = null;
    if (userRole === 'DIRECTOR') {
      // 토큰에서 academyId를 먼저 확인
      if (userAcademyId) {
        directorAcademyId = userAcademyId;
        console.log('✅ 토큰에서 학원 ID 사용:', directorAcademyId);
      } else {
        // 토큰에 없으면 DB에서 조회
        const director = await env.DB.prepare(`
          SELECT academyId FROM User WHERE email = ?
        `).bind(userEmail).first();
        
        directorAcademyId = director?.academyId;
        console.log('✅ DB에서 학원 ID 조회:', directorAcademyId);
      }
      
      if (!directorAcademyId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "학원이 할당되지 않았습니다" 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const url = new URL(request.url);
    const academyId = url.searchParams.get("id");

    // 특정 학원 상세 조회
    if (academyId) {
      console.log('🏫 학원 상세 조회:', academyId, '| 요청자 역할:', userRole);

      // 학원장인 경우 본인 학원만 조회 가능
      if (userRole === 'DIRECTOR' && academyId !== directorAcademyId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "본인의 학원만 조회할 수 있습니다" 
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 학원 기본 정보
      const academy = await env.DB.prepare(`
        SELECT 
          id, name, code, description, address, phone, email,
          subscriptionPlan, maxStudents, maxTeachers, isActive,
          createdAt, updatedAt
        FROM Academy
        WHERE id = ?
      `).bind(academyId).first();

      if (!academy) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "학원을 찾을 수 없습니다" 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 학원장 정보
      const director = await env.DB.prepare(`
        SELECT id, name, email, phone
        FROM User
        WHERE academyId = ? AND role = 'DIRECTOR'
        LIMIT 1
      `).bind(academyId).first();

      // 학생 목록 및 수
      const studentsResult = await env.DB.prepare(`
        SELECT id, name, email, phone, createdAt
        FROM User
        WHERE academyId = ? AND UPPER(role) = 'STUDENT'
        ORDER BY createdAt DESC
      `).bind(academyId).all();

      const students = studentsResult.results || [];
      const studentCount = students.length;

      // 선생님 목록 및 수
      const teachersResult = await env.DB.prepare(`
        SELECT id, name, email, phone
        FROM User
        WHERE academyId = ? AND UPPER(role) = 'TEACHER'
        ORDER BY name ASC
      `).bind(academyId).all();

      const teachers = teachersResult.results || [];
      const teacherCount = teachers.length;

      // AI 봇 사용량 (출석 체크 + 숙제 제출)
      let attendanceCount = 0;
      let homeworkCount = 0;
      
      try {
        const attendanceResult = await env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM Attendance
          WHERE userId IN (SELECT id FROM User WHERE academyId = ?)
        `).bind(academyId).first();
        attendanceCount = attendanceResult?.count || 0;
      } catch (e) {
        console.log('출석 테이블 없음 (무시)');
      }

      try {
        const homeworkResult = await env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM HomeworkSubmission
          WHERE userId IN (SELECT id FROM User WHERE academyId = ?)
        `).bind(academyId).first();
        homeworkCount = homeworkResult?.count || 0;
      } catch (e) {
        console.log('숙제 테이블 없음 (무시)');
      }

      const totalAIUsage = attendanceCount + homeworkCount;

      // 월별 활동 (최근 6개월)
      let monthlyActivity = [];
      try {
        const activityResult = await env.DB.prepare(`
          SELECT 
            strftime('%Y-%m', createdAt) as month,
            COUNT(*) as count
          FROM Attendance
          WHERE userId IN (SELECT id FROM User WHERE academyId = ?)
            AND createdAt >= date('now', '-6 months')
          GROUP BY month
          ORDER BY month ASC
        `).bind(academyId).all();
        
        // 월 형식을 "1월", "2월" 등으로 변환
        monthlyActivity = (activityResult.results || []).map(item => {
          const [year, month] = item.month.split('-');
          return {
            month: `${parseInt(month)}월`,
            count: item.count
          };
        });
      } catch (e) {
        console.log('월별 활동 조회 실패 (무시)');
      }

      // 할당된 AI 봇 목록
      let assignedBots = [];
      try {
        const botsResult = await env.DB.prepare(`
          SELECT 
            b.id, b.name, b.description,
            ba.createdAt as assignedAt,
            CASE 
              WHEN ba.isActive = 1 AND ba.endDate >= date('now') THEN 'ACTIVE'
              ELSE 'INACTIVE'
            END as status
          FROM bot_assignments ba
          JOIN ai_bots b ON ba.botId = b.id
          WHERE ba.academyId = ?
          ORDER BY ba.createdAt DESC
        `).bind(academyId).all();
        
        assignedBots = botsResult.results || [];
      } catch (e) {
        console.log('AI 봇 할당 정보 조회 실패 (무시):', e.message);
      }

      // 결제 정보
      let payments = [];
      let totalRevenue = 0;
      try {
        const paymentsResult = await env.DB.prepare(`
          SELECT 
            id, planName, amount, status, createdAt, approvedAt
          FROM PaymentRequest
          WHERE academyId = ?
          ORDER BY createdAt DESC
          LIMIT 10
        `).bind(academyId).all();
        
        payments = paymentsResult.results || [];
        
        // 승인된 결제만 계산
        const approvedPayments = payments.filter(p => p.status === 'APPROVED');
        totalRevenue = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      } catch (e) {
        console.log('결제 정보 조회 실패 (무시)');
      }

      const academyDetail = {
        ...academy,
        director: director || null,
        students,
        teachers,
        studentCount,
        teacherCount,
        totalChats: totalAIUsage,
        attendanceCount,
        homeworkCount,
        monthlyActivity,
        assignedBots,
        revenue: {
          totalRevenue: totalRevenue,
          transactionCount: payments.filter(p => p.status === 'APPROVED').length
        },
        payments
      };

      console.log('✅ 학원 상세 조회 완료:', {
        academyId,
        name: academy.name,
        students: studentCount,
        teachers: teacherCount,
        totalChats: totalAIUsage,
        assignedBots: assignedBots.length
      });

      return new Response(JSON.stringify({ 
        success: true, 
        academy: academyDetail 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 모든 학원 조회
    console.log('🏫 학원 목록 조회 | 요청자 역할:', userRole);

    // 학원장인 경우 본인 학원만 조회
    if (userRole === 'DIRECTOR') {
      const academy = await env.DB.prepare(`
        SELECT 
          id, name, code, description, address, phone, email,
          subscriptionPlan, isActive, createdAt
        FROM Academy
        WHERE id = ?
      `).bind(directorAcademyId).first();

      if (!academy) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "학원 정보를 찾을 수 없습니다" 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 학생/선생님 수 조회
      const studentCountResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User WHERE academyId = ? AND UPPER(role) = 'STUDENT'
      `).bind(academy.id).first();

      const teacherCountResult = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM User WHERE academyId = ? AND UPPER(role) = 'TEACHER'
      `).bind(academy.id).first();

      const academyWithCounts = {
        ...academy,
        studentCount: studentCountResult?.count || 0,
        teacherCount: teacherCountResult?.count || 0
      };

      console.log('✅ 학원장 학원 조회 완료:', academyWithCounts.name);

      return new Response(JSON.stringify({
        success: true,
        academies: [academyWithCounts],
        count: 1
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 관리자는 모든 학원 조회
    const academiesResult = await env.DB.prepare(`
      SELECT 
        id, name, code, description, address, phone, email,
        subscriptionPlan, isActive, createdAt
      FROM Academy
      ORDER BY name ASC
    `).all();

    const academies = academiesResult.results || [];

    // 각 학원의 학생/선생님 수 조회
    const academiesWithCounts = await Promise.all(
      academies.map(async (academy) => {
        const studentCountResult = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM User WHERE academyId = ? AND role = 'STUDENT'
        `).bind(academy.id).first();

        const teacherCountResult = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM User WHERE academyId = ? AND role = 'TEACHER'
        `).bind(academy.id).first();

        return {
          ...academy,
          studentCount: studentCountResult?.count || 0,
          teacherCount: teacherCountResult?.count || 0
        };
      })
    );

    console.log('✅ 학원 목록 조회 완료:', academiesWithCounts.length, '개');

    return new Response(JSON.stringify({
      success: true,
      academies: academiesWithCounts,
      count: academiesWithCounts.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("학원 목록 조회 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "학원 목록 조회 실패"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
