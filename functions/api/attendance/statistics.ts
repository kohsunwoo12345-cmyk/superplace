// 출석 통계 API - 완전 새 버전 (TypeScript)
interface Env {
  DB: D1Database;
}

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

    console.log("📊 Stats API:", { userId, role, academyId });

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
        const result = await DB.prepare(`
          SELECT substr(checkInTime, 1, 10) as date, status, userId
          FROM attendance_records_v2
          WHERE userId = ?
        `).bind(userId).all();

        // Status 매핑 함수: DB의 PRESENT -> 프론트엔드의 VERIFIED
        const mapStatus = (dbStatus: string): string => {
          if (dbStatus === 'PRESENT') return 'VERIFIED';
          if (dbStatus === 'LATE') return 'LATE';
          if (dbStatus === 'ABSENT') return 'ABSENT';
          return dbStatus; // 기타 값은 그대로 반환
        };

        const calendarData: Record<string, string> = {};
        if (result.results) {
          result.results
            .filter((r: any) => r.date)
            .forEach((r: any) => {
              // 같은 날짜에 여러 기록이 있을 경우 첫 번째 기록만 사용
              if (!calendarData[r.date]) {
                calendarData[r.date] = mapStatus(r.status);
              }
            });
        }

        console.log("📊 Student calendar data loaded:", Object.keys(calendarData).length, "days for userId:", userId);

        return new Response(JSON.stringify({
          success: true,
          role: "STUDENT",
          calendar: calendarData,
          attendanceDays: Object.keys(calendarData).length,
          thisMonth: thisMonth,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e: any) {
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
    let records: any[] = [];
    let allUsers: any[] = [];
    
    try {
      // 1. 전체 출석 기록 조회
      const allRecords = await DB.prepare(`
        SELECT id, userId, code, checkInTime, status, academyId
        FROM attendance_records_v2
        ORDER BY checkInTime DESC
        LIMIT 200
      `).all();

      records = allRecords.results || [];
      console.log("📊 Total attendance records:", records.length);

      // academyId로 필터링 (SUPER_ADMIN이 아닌 경우)
      if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        if (!academyId) {
          // 학원장/선생님인데 academyId가 없으면 빈 결과
          console.warn("⚠️ No academyId for non-admin role! Returning empty records.");
          records = [];
        } else {
          records = records.filter(r => String(r.academyId) === String(academyId));
          console.log("📊 Filtered for academy", academyId, ":", records.length);
        }
      }
    } catch (e: any) {
      console.error("Error fetching attendance:", e);
    }

    try {
      // 2. 모든 사용자 조회
      const userResults = await DB.prepare(`SELECT id, name, email, role, academyId FROM User`).all();
      const usersResults = await DB.prepare(`SELECT id, name, email, role, academyId FROM users`).all();
      allUsers = [...(userResults.results || []), ...(usersResults.results || [])];
      console.log("📊 Total users loaded:", allUsers.length);
    } catch (e: any) {
      console.error("Error fetching users:", e);
    }
    
    // Status 매핑 함수: DB의 PRESENT -> 프론트엔드의 VERIFIED
    const mapStatus = (dbStatus: string): string => {
      if (dbStatus === 'PRESENT') return 'VERIFIED';
      if (dbStatus === 'LATE') return 'LATE';
      if (dbStatus === 'ABSENT') return 'ABSENT';
      return dbStatus; // 기타 값은 그대로 반환
    };

    const userMap: Record<string, any> = {};
    allUsers.forEach(u => {
      userMap[u.id] = u;
    });
    
    // 3. 사용자 정보와 결합
    const enrichedRecords: any[] = [];
    for (const record of records.slice(0, 20)) {
      const user = userMap[record.userId];
      if (user) {
        enrichedRecords.push({
          id: record.id,
          userId: record.userId,
          userName: user.name,
          email: user.email,
          verifiedAt: record.checkInTime,
          status: mapStatus(record.status), // Status 매핑 적용
        });
      }
    }

    // 4. 오늘 출석 수
    console.log("📊 Today date:", today);
    console.log("📊 Total records to check:", records.length);
    console.log("📊 Sample checkInTime:", records.slice(0, 3).map(r => r.checkInTime));
    const todayRecords = records.filter(r => r.checkInTime && r.checkInTime.substring(0, 10) === today);
    console.log("📊 Today records found:", todayRecords.length);
    const todayAttendance = todayRecords.length;

    // 5. 이번 달 출석한 학생 수
    const thisMonthRecords = records.filter(r => r.checkInTime && r.checkInTime.substring(0, 7) === thisMonth);
    const uniqueUsers = [...new Set(thisMonthRecords.map(r => r.userId))];
    const monthAttendance = uniqueUsers.length;

    // 6. 전체 학생 수 (퇴원생 제외)
    let totalStudents = 0;
    // role이 STUDENT이고, status가 ACTIVE이거나 status 컬럼이 없는 경우
    const students = allUsers.filter(u => {
      const isStudent = u.role === 'STUDENT';
      // status가 없으면 ACTIVE로 간주, status가 있으면 ACTIVE인 경우만 포함
      const isActive = !u.status || u.status === 'ACTIVE';
      return isStudent && isActive;
    });
    
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // 관리자는 전체 학생
      totalStudents = students.length;
    } else if (academyId) {
      // 학원장/선생님은 본인 학원 학생만
      totalStudents = students.filter(s => String(s.academyId) === String(academyId)).length;
    } else {
      // academyId 없으면 0
      totalStudents = 0;
    }
    
    console.log("📊 Total active students (excluding withdrawn):", totalStudents);

    const attendanceRate = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;

    // 7. 주간 데이터
    const weeklyData: any[] = [];
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
      debug: {
        totalRecordsBeforeFilter: records.length,
        sampleCheckInTimes: records.slice(0, 5).map(r => r.checkInTime),
        todayRecordsCount: todayRecords.length,
      }
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("❌ Statistics error:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch attendance statistics",
      message: error.message,
      details: error.toString(),
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
// Force redeploy Thu Mar 12 12:32:29 UTC 2026
