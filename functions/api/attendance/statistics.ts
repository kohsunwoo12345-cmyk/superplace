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

    console.log("📊 Statistics API called:", { userId, role, academyId, today, thisMonth });

    // 역할별로 다른 통계 제공
    if (role === "STUDENT") {
      // 학생: 본인의 출석 기록만 (달력 형식)
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

    // 선생님/학원장/관리자: 학생 출석 통계
    const isGlobalAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    
    // 1. 출석 기록 조회 (간단하게)
    let recordsQuery = `
      SELECT 
        ar.id,
        ar.userId,
        ar.code,
        ar.checkInTime as verifiedAt,
        ar.status,
        ar.academyId
      FROM attendance_records_v2 ar
      WHERE 1=1
    `;
    
    if (!isGlobalAdmin && academyId) {
      recordsQuery += ` AND ar.academyId = ?`;
    }
    
    recordsQuery += ` ORDER BY ar.checkInTime DESC LIMIT 100`;
    
    let recordsStmt = DB.prepare(recordsQuery);
    if (!isGlobalAdmin && academyId) {
      recordsStmt = recordsStmt.bind(academyId);
    }
    
    const recordsResult = await recordsStmt.all();
    const records = recordsResult.results || [];
    
    console.log("✅ Records found:", records.length);
    
    // 2. 사용자 정보를 별도로 조회하여 병합
    const enrichedRecords: any[] = [];
    for (const record: any of records) {
      // User 테이블 먼저 시도
      let user = await DB.prepare(`
        SELECT id, name, email, academyId FROM User WHERE id = ?
      `).bind(record.userId).first();
      
      // User 테이블에 없으면 users 테이블 시도
      if (!user) {
        user = await DB.prepare(`
          SELECT id, name, email, academyId FROM users WHERE id = ?
        `).bind(record.userId).first();
      }
      
      if (user) {
        // Academy 정보 조회
        let academy = null;
        if (user.academyId) {
          academy = await DB.prepare(`
            SELECT name FROM Academy WHERE id = ?
          `).bind(user.academyId).first();
          
          if (!academy) {
            academy = await DB.prepare(`
              SELECT name FROM academy WHERE id = ?
            `).bind(user.academyId).first();
          }
        }
        
        enrichedRecords.push({
          id: record.id,
          userId: record.userId,
          userName: user.name,
          email: user.email,
          academyId: user.academyId,
          academyName: academy?.name || null,
          code: record.code,
          verifiedAt: record.verifiedAt,
          status: record.status,
        });
      }
    }
    
    console.log("✅ Enriched records:", enrichedRecords.length);

    // 3. 오늘 출석 수
    let todayQuery = `
      SELECT COUNT(*) as count
      FROM attendance_records_v2
      WHERE substr(checkInTime, 1, 10) = ?
    `;
    
    if (!isGlobalAdmin && academyId) {
      todayQuery += ` AND academyId = ?`;
    }
    
    let todayStmt = DB.prepare(todayQuery);
    todayStmt = todayStmt.bind(today);
    if (!isGlobalAdmin && academyId) {
      todayStmt = todayStmt.bind(academyId);
    }
    
    const todayResult = await todayStmt.first();
    const todayAttendance = todayResult?.count || 0;
    
    console.log("✅ Today attendance:", todayAttendance);

    // 4. 이번 달 출석한 학생 수
    let monthQuery = `
      SELECT COUNT(DISTINCT userId) as count
      FROM attendance_records_v2
      WHERE substr(checkInTime, 1, 7) = ?
    `;
    
    if (!isGlobalAdmin && academyId) {
      monthQuery += ` AND academyId = ?`;
    }
    
    let monthStmt = DB.prepare(monthQuery);
    monthStmt = monthStmt.bind(thisMonth);
    if (!isGlobalAdmin && academyId) {
      monthStmt = monthStmt.bind(academyId);
    }
    
    const monthResult = await monthStmt.first();
    const monthAttendance = monthResult?.count || 0;
    
    console.log("✅ Month attendance:", monthAttendance);

    // 5. 전체 학생 수
    let totalStudents = 0;
    
    // User 테이블
    let userCountQuery = `SELECT COUNT(*) as count FROM User WHERE role = 'STUDENT'`;
    if (!isGlobalAdmin && academyId) {
      userCountQuery += ` AND academyId = ?`;
    }
    
    let userCountStmt = DB.prepare(userCountQuery);
    if (!isGlobalAdmin && academyId) {
      userCountStmt = userCountStmt.bind(academyId);
    }
    const userCount = await userCountStmt.first();
    
    // users 테이블
    let usersCountQuery = `SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'`;
    if (!isGlobalAdmin && academyId) {
      usersCountQuery += ` AND academyId = ?`;
    }
    
    let usersCountStmt = DB.prepare(usersCountQuery);
    if (!isGlobalAdmin && academyId) {
      usersCountStmt = usersCountStmt.bind(academyId);
    }
    const usersCount = await usersCountStmt.first();
    
    totalStudents = (userCount?.count || 0) + (usersCount?.count || 0);
    
    console.log("✅ Total students:", totalStudents, "(User:", userCount?.count, ", users:", usersCount?.count, ")");

    const attendanceRate = totalStudents > 0
      ? Math.round((todayAttendance / totalStudents) * 100)
      : 0;

    // 6. 주간 데이터
    const weeklyData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let dayQuery = `
        SELECT COUNT(*) as count
        FROM attendance_records_v2
        WHERE substr(checkInTime, 1, 10) = ?
      `;
      
      if (!isGlobalAdmin && academyId) {
        dayQuery += ` AND academyId = ?`;
      }
      
      let dayStmt = DB.prepare(dayQuery);
      dayStmt = dayStmt.bind(dateStr);
      if (!isGlobalAdmin && academyId) {
        dayStmt = dayStmt.bind(academyId);
      }
      
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
      recordCount: enrichedRecords.length,
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
        records: enrichedRecords,
        weeklyData,
        today,
        thisMonth,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Attendance statistics error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch attendance statistics",
        message: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
