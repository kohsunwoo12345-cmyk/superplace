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
      // 학생: 본인의 출석 기록만 (달력 형식) - attendance_records_v2 테이블 사용
      const myAttendance = await DB.prepare(`
        SELECT 
          substr(checkInTime, 1, 10) as date,
          substr(checkInTime, 12, 5) as time,
          status
        FROM attendance_records_v2
        WHERE CAST(userId AS TEXT) = ?
        AND substr(checkInTime, 1, 7) = ?
        ORDER BY checkInTime DESC
      `).bind(String(userId), thisMonth).all();

      // 날짜별로 상태 집계 (하루에 여러 출석 가능하므로 가장 최근 상태 사용)
      const calendarData: any = {};
      if (myAttendance.results) {
        (myAttendance.results as any[]).forEach((record: any) => {
          const dateKey = record.date;
          if (!calendarData[dateKey]) {
            calendarData[dateKey] = record.status;
          }
        });
      }

      const totalDays = await DB.prepare(`
        SELECT COUNT(DISTINCT substr(checkInTime, 1, 10)) as days
        FROM attendance_records_v2
        WHERE CAST(userId AS TEXT) = ?
        AND substr(checkInTime, 1, 7) = ?
        AND (status = 'VERIFIED' OR status = 'PRESENT')
      `).bind(String(userId), thisMonth).first();

      return new Response(
        JSON.stringify({
          success: true,
          role: "STUDENT",
          calendar: calendarData,
          attendanceDays: totalDays?.days || 0,
          thisMonth: thisMonth,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("📊 Statistics API called with:", { userId, role, academyId });

    // 선생님/학원장/관리자: 학생 출석 통계 - attendance_records_v2 테이블 사용
    let query = `
      SELECT 
        ar.id,
        ar.userId,
        u.name as userName,
        u.email,
        u.academyId,
        a.name as academyName,
        ar.code,
        ar.checkInTime as verifiedAt,
        ar.status
      FROM attendance_records_v2 ar
      JOIN users u ON ar.userId = u.id
      LEFT JOIN academy a ON CAST(u.academyId AS TEXT) = CAST(a.id AS TEXT)
      WHERE 1=1
    `;
    
    const params: any[] = [];

    // DIRECTOR나 TEACHER는 자신의 학원 데이터만 조회
    const isGlobalAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (!isGlobalAdmin && academyId) {
      // 문자열과 정수 모두 비교
      query += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      params.push(String(academyId), parseInt(academyId));
      console.log("🔍 Filtering statistics by academyId:", academyId, "(both types)", "for role:", role);
    } else if (isGlobalAdmin) {
      console.log("✅ Global admin - showing all statistics");
    } else {
      console.warn("⚠️ No academyId for non-admin role!");
    }

    query += ` ORDER BY ar.checkInTime DESC LIMIT 100`;

    let stmt = DB.prepare(query);
    params.forEach(param => {
      stmt = stmt.bind(param);
    });
    
    const records = await stmt.all();

    // 오늘 출석 - attendance_records_v2 테이블 사용
    let todayQuery = `
      SELECT COUNT(*) as count
      FROM attendance_records_v2 ar
      JOIN users u ON ar.userId = u.id
      WHERE substr(ar.checkInTime, 1, 10) = ?
    `;
    const todayParams: any[] = [today];

    const isGlobalAdmin2 = role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (!isGlobalAdmin2 && academyId) {
      todayQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      todayParams.push(String(academyId), parseInt(academyId));
    }

    let todayStmt = DB.prepare(todayQuery);
    todayParams.forEach(param => {
      todayStmt = todayStmt.bind(param);
    });
    const todayResult = await todayStmt.first();
    const todayAttendance = todayResult?.count || 0;

    // 이번 달 출석 - attendance_records_v2 테이블 사용
    let monthQuery = `
      SELECT COUNT(DISTINCT ar.userId) as count
      FROM attendance_records_v2 ar
      JOIN users u ON ar.userId = u.id
      WHERE substr(ar.checkInTime, 1, 7) = ?
    `;
    const monthParams: any[] = [thisMonth];

    const isGlobalAdmin3 = role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (!isGlobalAdmin3 && academyId) {
      monthQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      monthParams.push(String(academyId), parseInt(academyId));
    }

    let monthStmt = DB.prepare(monthQuery);
    monthParams.forEach(param => {
      monthStmt = monthStmt.bind(param);
    });
    const monthResult = await monthStmt.first();
    const monthAttendance = monthResult?.count || 0;

    // 전체 학생 수 (실제 DB에서 조회)
    let studentQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
    `;
    const studentParams: any[] = [];

    const isGlobalAdmin4 = role === 'SUPER_ADMIN' || role === 'ADMIN';
    if (!isGlobalAdmin4 && academyId) {
      studentQuery += ` AND (CAST(academyId AS TEXT) = ? OR academyId = ?)`;
      studentParams.push(String(academyId), parseInt(academyId));
      console.log("🔍 Counting students for academyId:", academyId);
    }

    let studentStmt = DB.prepare(studentQuery);
    studentParams.forEach(param => {
      studentStmt = studentStmt.bind(param);
    });
    const studentResult = await studentStmt.first();
    const totalStudents = studentResult?.count || 0;
    console.log("✅ Total students found:", totalStudents, "for academyId:", academyId);

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
        FROM attendance_records_v2 ar
        JOIN users u ON ar.userId = u.id
        WHERE substr(ar.checkInTime, 1, 10) = ?
      `;
      const dayParams: any[] = [dateStr];

      const isGlobalAdmin5 = role === 'SUPER_ADMIN' || role === 'ADMIN';
      if (!isGlobalAdmin5 && academyId) {
        dayQuery += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
        dayParams.push(String(academyId), parseInt(academyId));
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

    console.log("📊 Final statistics:", {
      totalStudents,
      todayAttendance,
      monthAttendance,
      attendanceRate,
      recordCount: records.results?.length || 0,
      weeklyDataLength: weeklyData.length
    });

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
