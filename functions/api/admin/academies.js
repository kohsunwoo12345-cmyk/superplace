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
    const [userId, userEmail, userRole] = token.split('|');

    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "관리자 권한이 필요합니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const academyId = url.searchParams.get("id");

    // 특정 학원 상세 조회
    if (academyId) {
      console.log('🏫 학원 상세 조회:', academyId);

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

      // 학생 수
      const studentCountResult = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM User
        WHERE academyId = ? AND role = 'STUDENT'
      `).bind(academyId).first();

      // 선생님 수
      const teacherCountResult = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM User
        WHERE academyId = ? AND role = 'TEACHER'
      `).bind(academyId).first();

      const studentCount = studentCountResult?.count || 0;
      const teacherCount = teacherCountResult?.count || 0;

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
        monthlyActivity = activityResult.results || [];
      } catch (e) {
        console.log('월별 활동 조회 실패 (무시)');
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
        studentCount,
        teacherCount,
        aiUsage: {
          total: totalAIUsage,
          attendance: attendanceCount,
          homework: homeworkCount
        },
        monthlyActivity,
        revenue: {
          total: totalRevenue,
          transactionCount: payments.filter(p => p.status === 'APPROVED').length
        },
        payments
      };

      console.log('✅ 학원 상세 조회 완료:', {
        academyId,
        name: academy.name,
        students: studentCount,
        teachers: teacherCount,
        aiUsage: totalAIUsage
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
    console.log('🏫 모든 학원 목록 조회');

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
