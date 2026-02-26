// 출석 통계 API - 완전 재작성 (바인딩 없음)
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

    console.log("📊 Stats API v2:", { userId, role, academyId });

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
      try {
        const allMyAttendance = await DB.prepare(`
          SELECT substr(checkInTime, 1, 10) as date, status, userId
          FROM attendance_records_v3
          WHERE substr(checkInTime, 1, 7) = '${thisMonth}'
        `).all();

        const calendarData = {};
        if (allMyAttendance.results) {
          allMyAttendance.results
            .filter(r => String(r.userId) === String(userId))
            .forEach(r => {
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
      } catch (e) {
        console.error("Student stats error:", e);
        return new Response(JSON.stringify({
          success: true,
          role: "STUDENT",
          calendar: {},
          attendanceDays: 0,
          thisMonth: thisMonth,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }

    // 선생님/학원장/관리자용
    let records = [];
    let allUsers = [];
    
    try {
      // 1. 전체 출석 기록 조회
      const allRecords = await DB.prepare(`
        SELECT id, userId, code, checkInTime, status, academyId
        FROM attendance_records_v3
        ORDER BY checkInTime DESC
        LIMIT 200
      `).all();

      records = allRecords.results || [];
      console.log("📊 Total attendance records:", records.length);

      // academyId로 필터링 (JavaScript에서)
      if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && academyId) {
        records = records.filter(r => String(r.academyId) === String(academyId));
        console.log("📊 Filtered for academy", academyId, ":", records.length);
      }
    } catch (e) {
      console.error("Error fetching attendance:", e);
    }

    try {
      // 2. 모든 사용자 조회
      const userResults = await DB.prepare(`SELECT id, name, email, role, academyId FROM User`).all();
      const usersResults = await DB.prepare(`SELECT id, name, email, role, academyId FROM users`).all();
      allUsers = [...(userResults.results || []), ...(usersResults.results || [])];
      console.log("📊 Total users loaded:", allUsers.length);
    } catch (e) {
      console.error("Error fetching users:", e);
    }
    
    const userMap = {};
    allUsers.forEach(u => {
      userMap[u.id] = u;
    });
    
    // 3. 사용자 정보와 결합
    const enrichedRecords = [];
    for (const record of records.slice(0, 20)) {
      const user = userMap[record.userId];
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

    // 4. 오늘 출석 수
    const todayRecords = records.filter(r => r.checkInTime && r.checkInTime.substring(0, 10) === today);
    const todayAttendance = todayRecords.length;

    // 5. 이번 달 출석한 학생 수
    const thisMonthRecords = records.filter(r => r.checkInTime && r.checkInTime.substring(0, 7) === thisMonth);
    const uniqueUsers = [...new Set(thisMonthRecords.map(r => r.userId))];
    const monthAttendance = uniqueUsers.length;

    // 6. 전체 학생 수
    let totalStudents = 0;
    const students = allUsers.filter(u => u.role === 'STUDENT');
    
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || !academyId) {
      totalStudents = students.length;
    } else {
      totalStudents = students.filter(s => String(s.academyId) === String(academyId)).length;
    }
    
    console.log("📊 Total students:", totalStudents);

    const attendanceRate = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;

    // 7. 주간 데이터
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = records.filter(r => r.checkInTime && r.checkInTime.substring(0, 10) === dateStr).length;
      weeklyData.push({ date: dateStr, count: count });
    }

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
      details: error.toString(),
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
