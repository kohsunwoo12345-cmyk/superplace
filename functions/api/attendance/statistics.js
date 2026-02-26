// 출석 통계 API - 초간단 버전
function getKoreanDate() {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getKoreanMonth() {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const academyId = url.searchParams.get("academyId");

    console.log("📊 Statistics API - Simple version:", { userId, role, academyId });

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const today = getKoreanDate();
    const thisMonth = getKoreanMonth();

    // 학생용
    if (role === "STUDENT") {
      const myAttendance = await DB.prepare(`
        SELECT substr(checkInTime, 1, 10) as date, status
        FROM attendance_records_v3
        WHERE CAST(userId AS TEXT) = ?
        AND substr(checkInTime, 1, 7) = ?
      `).bind(String(userId), thisMonth).all();

      const calendarData = {};
      if (myAttendance.results) {
        myAttendance.results.forEach(r => {
          if (!calendarData[r.date]) calendarData[r.date] = r.status;
        });
      }

      return new Response(JSON.stringify({
        success: true,
        role: "STUDENT",
        calendar: calendarData,
        attendanceDays: Object.keys(calendarData).length,
        thisMonth: thisMonth,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // 선생님/학원장/관리자용
    // 1. 전체 출석 기록 (academyId 필터링 없이 일단 모두 가져오기)
    const allRecords = await DB.prepare(`
      SELECT id, userId, code, checkInTime, status, academyId
      FROM attendance_records_v3
      ORDER BY checkInTime DESC
      LIMIT 100
    `).all();

    console.log("📊 Total records in DB:", allRecords.results?.length || 0);

    // academyId로 필터링 (JavaScript에서)
    let records = allRecords.results || [];
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && academyId) {
      records = records.filter(r => r.academyId === academyId);
      console.log("📊 Filtered records for academyId", academyId, ":", records.length);
    }

    // 2. 사용자 정보 추가
    const enrichedRecords = [];
    for (const record of records.slice(0, 20)) { // 상위 20개만
      let user = await DB.prepare(`SELECT id, name, email FROM User WHERE id = ?`).bind(record.userId).first();
      if (!user) {
        user = await DB.prepare(`SELECT id, name, email FROM users WHERE id = ?`).bind(record.userId).first();
      }
      
      if (user) {
        enrichedRecords.push({
          id: record.id,
          userId: record.userId,
          userName: user.name,
          email: user.email,
          verifiedAt: record.checkInTime,
          status: record.status,
        });
      }
    }

    // 3. 오늘 출석 수
    const todayRecords = records.filter(r => r.checkInTime?.substring(0, 10) === today);
    const todayAttendance = todayRecords.length;

    // 4. 이번 달 출석한 학생 수
    const thisMonthRecords = records.filter(r => r.checkInTime?.substring(0, 7) === thisMonth);
    const uniqueUsers = [...new Set(thisMonthRecords.map(r => r.userId))];
    const monthAttendance = uniqueUsers.length;

    // 5. 전체 학생 수 (JavaScript에서 직접 카운트)
    let totalStudents = 0;
    try {
      if (role === 'SUPER_ADMIN' || role === 'ADMIN' || !academyId) {
        // 전체 관리자는 모든 학생 조회
        const userResults = await DB.prepare(`SELECT id FROM User WHERE role = 'STUDENT'`).all();
        const usersResults = await DB.prepare(`SELECT id FROM users WHERE role = 'STUDENT'`).all();
        totalStudents = (userResults.results?.length || 0) + (usersResults.results?.length || 0);
      } else {
        // 학원장/교사는 자기 학원 학생만 (JavaScript 필터링)
        const userResults = await DB.prepare(`SELECT id, academyId FROM User WHERE role = 'STUDENT'`).all();
        const usersResults = await DB.prepare(`SELECT id, academyId FROM users WHERE role = 'STUDENT'`).all();
        
        const userFiltered = (userResults.results || []).filter(u => String(u.academyId) === String(academyId));
        const usersFiltered = (usersResults.results || []).filter(u => String(u.academyId) === String(academyId));
        
        totalStudents = userFiltered.length + usersFiltered.length;
      }
      console.log("📊 Total students for academyId", academyId, ":", totalStudents);
    } catch (e) {
      console.error("Error counting students:", e);
      totalStudents = 0;
    }

    const attendanceRate = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;

    // 6. 주간 데이터 (간단하게)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = records.filter(r => r.checkInTime?.substring(0, 10) === dateStr).length;
      weeklyData.push({ date: dateStr, count: count });
    }

    console.log("📊 Stats:", { totalStudents, todayAttendance, monthAttendance, recordCount: records.length });

    return new Response(JSON.stringify({
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
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("❌ Statistics error:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch attendance statistics",
      message: error.message,
      stack: error.stack,
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
