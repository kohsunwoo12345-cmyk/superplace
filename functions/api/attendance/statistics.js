// 한국 시간 날짜 함수
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

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const today = getKoreanDate();
    const thisMonth = getKoreanMonth();

    console.log("📊 Statistics API called:", { userId, role, academyId, today, thisMonth });

    // 학생: 본인의 출석 기록만
    if (role === "STUDENT") {
      const myAttendance = await DB.prepare(`
        SELECT 
          substr(checkInTime, 1, 10) as date,
          status
        FROM attendance_records_v2
        WHERE CAST(userId AS TEXT) = ?
        AND substr(checkInTime, 1, 7) = ?
        ORDER BY checkInTime DESC
      `).bind(String(userId), thisMonth).all();

      const calendarData = {};
      if (myAttendance.results) {
        myAttendance.results.forEach((record) => {
          if (!calendarData[record.date]) {
            calendarData[record.date] = record.status;
          }
        });
      }

      const totalDays = await DB.prepare(`
        SELECT COUNT(DISTINCT substr(checkInTime, 1, 10)) as days
        FROM attendance_records_v2
        WHERE CAST(userId AS TEXT) = ?
        AND substr(checkInTime, 1, 7) = ?
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

    // 선생님/학원장/관리자
    const isGlobalAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    
    // 1. 출석 기록 조회
    let recordsQuery = `
      SELECT 
        id, userId, code, checkInTime, status, academyId
      FROM attendance_records_v2
      WHERE 1=1
    `;
    
    if (!isGlobalAdmin && academyId) {
      recordsQuery += ` AND academyId = ?`;
    }
    
    recordsQuery += ` ORDER BY checkInTime DESC LIMIT 100`;
    
    let recordsResult;
    if (!isGlobalAdmin && academyId) {
      recordsResult = await DB.prepare(recordsQuery).bind(academyId).all();
    } else {
      recordsResult = await DB.prepare(recordsQuery).all();
    }
    
    const records = recordsResult.results || [];
    console.log("✅ Raw records:", records.length);
    
    // 2. 사용자 정보 병합
    const enrichedRecords = [];
    for (const record of records) {
      let user = await DB.prepare(`SELECT id, name, email, academyId FROM User WHERE id = ?`).bind(record.userId).first();
      
      if (!user) {
        user = await DB.prepare(`SELECT id, name, email, academyId FROM users WHERE id = ?`).bind(record.userId).first();
      }
      
      if (user) {
        let academy = null;
        if (user.academyId) {
          academy = await DB.prepare(`SELECT name FROM Academy WHERE id = ?`).bind(user.academyId).first();
          if (!academy) {
            academy = await DB.prepare(`SELECT name FROM academy WHERE id = ?`).bind(user.academyId).first();
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
          verifiedAt: record.checkInTime,
          status: record.status,
        });
      }
    }
    
    console.log("✅ Enriched records:", enrichedRecords.length);

    // 3. 오늘 출석
    let todayResult;
    if (!isGlobalAdmin && academyId) {
      todayResult = await DB.prepare(`
        SELECT COUNT(*) as count
        FROM attendance_records_v2
        WHERE substr(checkInTime, 1, 10) = ?
        AND academyId = ?
      `).bind(today, academyId).first();
    } else {
      todayResult = await DB.prepare(`
        SELECT COUNT(*) as count
        FROM attendance_records_v2
        WHERE substr(checkInTime, 1, 10) = ?
      `).bind(today).first();
    }
    
    const todayAttendance = todayResult?.count || 0;
    console.log("✅ Today attendance:", todayAttendance);

    // 4. 이번 달 출석
    let monthResult;
    if (!isGlobalAdmin && academyId) {
      monthResult = await DB.prepare(`
        SELECT COUNT(DISTINCT userId) as count
        FROM attendance_records_v2
        WHERE substr(checkInTime, 1, 7) = ?
        AND academyId = ?
      `).bind(thisMonth, academyId).first();
    } else {
      monthResult = await DB.prepare(`
        SELECT COUNT(DISTINCT userId) as count
        FROM attendance_records_v2
        WHERE substr(checkInTime, 1, 7) = ?
      `).bind(thisMonth).first();
    }
    
    const monthAttendance = monthResult?.count || 0;
    console.log("✅ Month attendance:", monthAttendance);

    // 5. 전체 학생 수
    let userCount1, userCount2;
    
    if (!isGlobalAdmin && academyId) {
      userCount1 = await DB.prepare(`SELECT COUNT(*) as count FROM User WHERE role = 'STUDENT' AND academyId = ?`).bind(academyId).first();
      userCount2 = await DB.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT' AND academyId = ?`).bind(academyId).first();
    } else {
      userCount1 = await DB.prepare(`SELECT COUNT(*) as count FROM User WHERE role = 'STUDENT'`).first();
      userCount2 = await DB.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'`).first();
    }
    
    const totalStudents = (userCount1?.count || 0) + (userCount2?.count || 0);
    console.log("✅ Total students:", totalStudents);

    const attendanceRate = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;

    // 6. 주간 데이터
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let dayResult;
      if (!isGlobalAdmin && academyId) {
        dayResult = await DB.prepare(`
          SELECT COUNT(*) as count
          FROM attendance_records_v2
          WHERE substr(checkInTime, 1, 10) = ?
          AND academyId = ?
        `).bind(dateStr, academyId).first();
      } else {
        dayResult = await DB.prepare(`
          SELECT COUNT(*) as count
          FROM attendance_records_v2
          WHERE substr(checkInTime, 1, 10) = ?
        `).bind(dateStr).first();
      }

      weeklyData.push({
        date: dateStr,
        count: dayResult?.count || 0,
      });
    }

    console.log("📊 Final:", { totalStudents, todayAttendance, monthAttendance, attendanceRate });

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
  } catch (error) {
    console.error("❌ Statistics error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch attendance statistics",
        message: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
