interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("id");

    // 특정 학원 상세 조회
    if (academyId) {
      return getAcademyDetail(DB, academyId);
    }

    // 전체 학원 목록 조회
    console.log("📚 Fetching all academies...");

    const query = `
      SELECT 
        a.id,
        a.name,
        a.code,
        a.description,
        a.address,
        a.phone,
        a.email,
        a.logoUrl,
        a.subscriptionPlan,
        a.maxStudents,
        a.maxTeachers,
        a.isActive,
        a.createdAt,
        a.updatedAt
      FROM academy a
      ORDER BY a.createdAt DESC
    `;

    const academiesResult = await DB.prepare(query).all();
    const academies = academiesResult?.results || [];

    console.log("✅ Found", academies.length, "academies");

    // 각 학원의 통계 정보 추가
    const academiesWithStats = await Promise.all(
      academies.map(async (academy: any) => {
        // 학생 수
        const studentCount = await DB.prepare(
          `SELECT COUNT(*) as count FROM users WHERE academyId = ? AND role = 'STUDENT'`
        ).bind(academy.id).first<{ count: number }>();

        // 선생님 수
        const teacherCount = await DB.prepare(
          `SELECT COUNT(*) as count FROM users WHERE academyId = ? AND role = 'TEACHER'`
        ).bind(academy.id).first<{ count: number }>();

        // 학원장 정보
        const director = await DB.prepare(
          `SELECT id, name, email, phone FROM users WHERE academyId = ? AND role = 'DIRECTOR' LIMIT 1`
        ).bind(academy.id).first();

        // AI 채팅 대화 수 (출석 + 숙제 제출 수로 추정)
        const chatCount = await DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM attendance_records ar 
             JOIN users u ON ar.userId = u.id 
             WHERE u.academyId = ?) +
            (SELECT COUNT(*) FROM homework_submissions hs 
             JOIN users u ON hs.userId = u.id 
             WHERE u.academyId = ?) as totalChats
        `).bind(academy.id, academy.id).first<{ totalChats: number }>();

        return {
          ...academy,
          studentCount: studentCount?.count || 0,
          teacherCount: teacherCount?.count || 0,
          directorName: director?.name || null,
          directorEmail: director?.email || null,
          directorPhone: director?.phone || null,
          totalChats: chatCount?.totalChats || 0,
        };
      })
    );

    return new Response(JSON.stringify({ 
      success: true,
      academies: academiesWithStats 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Academies list error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to fetch academies",
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// 학원 상세 정보 조회
async function getAcademyDetail(DB: D1Database, academyId: string) {
  try {
    console.log("🔍 Fetching academy detail for:", academyId);

    // 학원 기본 정보
    const academy = await DB.prepare(`
      SELECT * FROM academy WHERE id = ?
    `).bind(academyId).first();

    if (!academy) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Academy not found" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 학원장 정보
    const director = await DB.prepare(`
      SELECT 
        id, 
        name, 
        email, 
        phone,
        COALESCE(createdAt, created_at, datetime('now')) as createdAt
      FROM users 
      WHERE academyId = ? AND LOWER(role) = 'director'
      LIMIT 1
    `).bind(academyId).first();

    // 학생 목록
    const students = await DB.prepare(`
      SELECT 
        id, 
        name, 
        email, 
        phone,
        COALESCE(createdAt, created_at, datetime('now')) as createdAt
      FROM users
      WHERE academyId = ? AND LOWER(role) = 'student'
      ORDER BY id DESC
    `).bind(academyId).all();

    // 선생님 목록
    const teachers = await DB.prepare(`
      SELECT 
        id, 
        name, 
        email, 
        phone,
        COALESCE(createdAt, created_at, datetime('now')) as createdAt
      FROM users
      WHERE academyId = ? AND LOWER(role) = 'teacher'
      ORDER BY id DESC
    `).bind(academyId).all();

    // AI 채팅 통계
    const chatStats = await DB.prepare(`
      SELECT 
        COUNT(DISTINCT ar.id) as attendanceCount,
        COUNT(DISTINCT hs.id) as homeworkCount
      FROM users u
      LEFT JOIN attendance_records ar ON u.id = ar.userId
      LEFT JOIN homework_submissions hs ON u.id = hs.userId
      WHERE u.academyId = ? AND LOWER(u.role) = 'student'
    `).bind(academyId).first();

    // 월별 활동 통계 (최근 6개월)
    const monthlyActivity = await DB.prepare(`
      SELECT 
        strftime('%Y-%m', COALESCE(ar.verifiedAt, ar.verified_at)) as month,
        COUNT(*) as count
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE u.academyId = ? 
        AND COALESCE(ar.verifiedAt, ar.verified_at) >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month DESC
    `).bind(academyId).all();

    // 매출 정보 (revenue_records 테이블이 있다고 가정)
    let revenueData = null;
    try {
      const revenue = await DB.prepare(`
        SELECT 
          SUM(amount) as totalRevenue,
          COUNT(*) as transactionCount
        FROM revenue_records
        WHERE academyId = ?
      `).bind(academyId).first();
      
      revenueData = revenue;
    } catch (e) {
      console.log("⚠️ Revenue table not found, skipping revenue data");
    }

    return new Response(JSON.stringify({
      success: true,
      academy: {
        ...academy,
        director,
        students: students.results || [],
        teachers: teachers.results || [],
        studentCount: (students.results || []).length,
        teacherCount: (teachers.results || []).length,
        totalChats: (chatStats?.attendanceCount || 0) + (chatStats?.homeworkCount || 0),
        attendanceCount: chatStats?.attendanceCount || 0,
        homeworkCount: chatStats?.homeworkCount || 0,
        monthlyActivity: monthlyActivity.results || [],
        revenue: revenueData,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Academy detail error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to fetch academy detail",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
