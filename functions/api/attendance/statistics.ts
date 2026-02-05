interface Env {
  DB: D1Database;
}

// 한국 시간 날짜 함수
function getKoreanDate(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getKoreanMonth(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const academyId = url.searchParams.get("academyId");

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const today = getKoreanDate();
    const thisMonth = getKoreanMonth();

    // 역할별로 다른 통계 제공
    if (role === "STUDENT") {
      // 학생: 본인의 출석 기록만 (달력 형식)
      const myAttendance = await DB.prepare(`
        SELECT 
          substr(verifiedAt, 1, 10) as date,
          COUNT(*) as count,
          status
        FROM attendance_records
        WHERE userId = ?
        AND substr(verifiedAt, 1, 7) = ?
        GROUP BY substr(verifiedAt, 1, 10), status
        ORDER BY date DESC
      `).bind(userId, thisMonth).all();

      const totalDays = await DB.prepare(`
        SELECT COUNT(DISTINCT substr(verifiedAt, 1, 10)) as days
        FROM attendance_records
        WHERE userId = ?
        AND substr(verifiedAt, 1, 7) = ?
      `).bind(userId, thisMonth).first();

      return new Response(
        JSON.stringify({
          success: true,
          role: "STUDENT",
          calendar: myAttendance.results,
          attendanceDays: totalDays?.days || 0,
          thisMonth: thisMonth,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 선생님/학원장/관리자: 학생 출석 통계
    let query = `
      SELECT 
        ar.id,
        ar.userId,
        u.name as userName,
        u.email,
        u.academy_id as academyId,
        u.academy_name as academyName,
        ar.code,
        ar.verifiedAt,
        ar.status,
        ar.homeworkSubmitted
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (role === "TEACHER" && academyId) {
      // 선생님: 같은 학원 학생만
      query += ` AND u.academy_id = ?`;
      params.push(academyId);
    } else if (role === "DIRECTOR" && academyId) {
      // 학원장: 하위 학생들만
      query += ` AND u.academy_id = ?`;
      params.push(academyId);
    }
    // ADMIN: 모든 학생

    query += ` ORDER BY ar.verifiedAt DESC LIMIT 100`;

    let stmt = DB.prepare(query);
    params.forEach(param => {
      stmt = stmt.bind(param);
    });
    
    const records = await stmt.all();

    // 오늘 출석
    let todayQuery = `
      SELECT COUNT(*) as count
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE substr(ar.verifiedAt, 1, 10) = ?
    `;
    const todayParams: any[] = [today];

    if (role !== "ADMIN" && academyId) {
      todayQuery += ` AND u.academy_id = ?`;
      todayParams.push(academyId);
    }

    let todayStmt = DB.prepare(todayQuery);
    todayParams.forEach(param => {
      todayStmt = todayStmt.bind(param);
    });
    const todayResult = await todayStmt.first();
    const todayAttendance = todayResult?.count || 0;

    // 이번 달 출석
    let monthQuery = `
      SELECT COUNT(DISTINCT ar.userId) as count
      FROM attendance_records ar
      JOIN users u ON ar.userId = u.id
      WHERE substr(ar.verifiedAt, 1, 7) = ?
    `;
    const monthParams: any[] = [thisMonth];

    if (role !== "ADMIN" && academyId) {
      monthQuery += ` AND u.academy_id = ?`;
      monthParams.push(academyId);
    }

    let monthStmt = DB.prepare(monthQuery);
    monthParams.forEach(param => {
      monthStmt = monthStmt.bind(param);
    });
    const monthResult = await monthStmt.first();
    const monthAttendance = monthResult?.count || 0;

    // 전체 학생 수
    let studentQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
    `;
    const studentParams: any[] = [];

    if (role !== "ADMIN" && academyId) {
      studentQuery += ` AND academy_id = ?`;
      studentParams.push(academyId);
    }

    let studentStmt = DB.prepare(studentQuery);
    studentParams.forEach(param => {
      studentStmt = studentStmt.bind(param);
    });
    const studentResult = await studentStmt.first();
    const totalStudents = studentResult?.count || 0;

    const attendanceRate = totalStudents > 0
      ? Math.round((todayAttendance / totalStudents) * 100)
      : 0;

    // 주간 데이터 (최근 7일)
    const weeklyData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let dayQuery = `
        SELECT COUNT(*) as count
        FROM attendance_records ar
        JOIN users u ON ar.userId = u.id
        WHERE substr(ar.verifiedAt, 1, 10) = ?
      `;
      const dayParams: any[] = [dateStr];

      if (role !== "ADMIN" && academyId) {
        dayQuery += ` AND u.academy_id = ?`;
        dayParams.push(academyId);
      }

      let dayStmt = DB.prepare(dayQuery);
      dayParams.forEach(param => {
        dayStmt = dayStmt.bind(param);
      });
      const dayResult = await dayStmt.first();

      weeklyData.push({
        date: dateStr,
        count: dayResult?.count || 0,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        role: role,
        statistics: {
          totalStudents,
          todayAttendance,
          monthAttendance,
          attendanceRate,
        },
        records: records.results,
        weeklyData,
        today,
        thisMonth,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Attendance statistics error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch attendance statistics",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
