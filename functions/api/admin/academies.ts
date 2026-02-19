// API: 학원 목록 조회
// GET /api/admin/academies

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // URL에서 academy ID 가져오기
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("id");

    // 특정 학원 상세 조회
    if (academyId) {
      // 학원 기본 정보
      const academyResult = await db
        .prepare(`
          SELECT 
            id, name, code, description, address, phone, email,
            subscriptionPlan, maxStudents, maxTeachers, isActive,
            createdAt, updatedAt
          FROM academy
          WHERE id = ?
        `)
        .bind(academyId)
        .first();

      if (!academyResult) {
        return new Response(
          JSON.stringify({ success: false, message: "학원을 찾을 수 없습니다" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 학원장 정보
      const directorResult = await db
        .prepare(`
          SELECT id, name, email, phone
          FROM users
          WHERE academyId = ? AND role = 'DIRECTOR'
          LIMIT 1
        `)
        .bind(academyId)
        .first();

      // 학생 목록
      const studentsResult = await db
        .prepare(`
          SELECT id, name, email, phone, createdAt
          FROM users
          WHERE academyId = ? AND role = 'STUDENT'
          ORDER BY name ASC
        `)
        .bind(academyId)
        .all();

      // 선생님 목록
      const teachersResult = await db
        .prepare(`
          SELECT id, name, email, phone, createdAt
          FROM users
          WHERE academyId = ? AND role = 'TEACHER'
          ORDER BY name ASC
        `)
        .bind(academyId)
        .all();

      // 통계 정보
      const studentCount = studentsResult.results?.length || 0;
      const teacherCount = teachersResult.results?.length || 0;

      // AI 봇 대화 수 (출석 + 숙제)
      const attendanceCount = await db
        .prepare(`
          SELECT COUNT(*) as count
          FROM attendance
          WHERE userId IN (SELECT id FROM users WHERE academyId = ?)
        `)
        .bind(academyId)
        .first();

      const homeworkCount = await db
        .prepare(`
          SELECT COUNT(*) as count
          FROM homework_submissions
          WHERE userId IN (SELECT id FROM users WHERE academyId = ?)
        `)
        .bind(academyId)
        .first();

      const totalChats = (attendanceCount?.count || 0) + (homeworkCount?.count || 0);

      // 월별 활동 (최근 6개월)
      const monthlyActivity = await db
        .prepare(`
          SELECT 
            strftime('%Y-%m', createdAt) as month,
            COUNT(*) as count
          FROM attendance
          WHERE userId IN (SELECT id FROM users WHERE academyId = ?)
            AND createdAt >= date('now', '-6 months')
          GROUP BY month
          ORDER BY month DESC
          LIMIT 6
        `)
        .bind(academyId)
        .all();

      // AI 봇 할당 정보
      const assignedBotsResult = await db
        .prepare(`
          SELECT 
            ab.id,
            ab.name,
            ab.description,
            aba.assignedAt,
            aba.status
          FROM ai_bot_assignments aba
          JOIN ai_bots ab ON aba.botId = ab.id
          WHERE aba.academyId = ? AND aba.status = 'ACTIVE'
          ORDER BY aba.assignedAt DESC
        `)
        .bind(academyId)
        .all();

      // 결제 정보 (payment_requests 테이블에서)
      const paymentsResult = await db
        .prepare(`
          SELECT 
            id,
            planName,
            amount,
            status,
            createdAt,
            approvedAt
          FROM payment_requests
          WHERE academyId = ?
          ORDER BY createdAt DESC
        `)
        .bind(academyId)
        .all();

      // 승인된 결제만 계산
      const approvedPayments = paymentsResult.results?.filter(
        (p: any) => p.status === 'APPROVED'
      ) || [];
      
      const totalRevenue = approvedPayments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      );

      const academy = {
        ...academyResult,
        director: directorResult || null,
        students: studentsResult.results || [],
        teachers: teachersResult.results || [],
        studentCount,
        teacherCount,
        totalChats,
        attendanceCount: attendanceCount?.count || 0,
        homeworkCount: homeworkCount?.count || 0,
        monthlyActivity: (monthlyActivity.results || []).reverse(),
        assignedBots: assignedBotsResult.results || [],
        payments: paymentsResult.results || [],
        revenue: {
          totalRevenue,
          transactionCount: approvedPayments.length,
        },
      };

      return new Response(
        JSON.stringify({ success: true, academy }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 모든 학원 조회
    const result = await db
      .prepare(`
        SELECT 
          id,
          name,
          code,
          description,
          address,
          phone,
          email,
          subscriptionPlan,
          isActive,
          createdAt
        FROM academy
        WHERE isActive = 1
        ORDER BY name ASC
      `)
      .all();

    // 각 학원에 대해 추가 정보 조회
    const academiesWithDetails = await Promise.all(
      (result.results || []).map(async (academy: any) => {
        // 학원장 이름 조회
        const director = await db
          .prepare(`
            SELECT name
            FROM users
            WHERE academyId = ? AND role = 'DIRECTOR'
            LIMIT 1
          `)
          .bind(academy.id)
          .first();

        // 학생 수 조회
        const studentCountResult = await db
          .prepare(`
            SELECT COUNT(*) as count
            FROM users
            WHERE academyId = ? AND role = 'STUDENT'
          `)
          .bind(academy.id)
          .first();

        // 선생님 수 조회
        const teacherCountResult = await db
          .prepare(`
            SELECT COUNT(*) as count
            FROM users
            WHERE academyId = ? AND role = 'TEACHER'
          `)
          .bind(academy.id)
          .first();

        return {
          ...academy,
          directorName: director?.name || null,
          studentCount: studentCountResult?.count || 0,
          teacherCount: teacherCountResult?.count || 0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        academies: academiesWithDetails,
        count: academiesWithDetails.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("학원 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "학원 목록 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
