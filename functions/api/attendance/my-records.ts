interface Env {
  DB: D1Database;
}

/**
 * GET /api/attendance/my-records
 * 학생 본인의 출석 기록 조회
 * 
 * Query Parameters:
 * - userId: 학생 ID (필수)
 * - month: YYYY-MM 형식 (예: 2026-03)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const month = url.searchParams.get('month');

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📊 학생 출석 기록 조회: userId=${userId}, month=${month}`);

    // 월이 지정되지 않았으면 현재 월 사용
    let targetMonth = month;
    if (!targetMonth) {
      const now = new Date();
      targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // 해당 월의 시작일과 종료일 계산
    const [year, monthNum] = targetMonth.split('-').map(Number);
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const endDate = new Date(year, monthNum, 0); // 다음 달 0일 = 이번 달 마지막 날
    const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    console.log(`📅 조회 기간: ${startDate} ~ ${endDateStr}`);

    // 출석 기록 테이블 생성 (없으면)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS AttendanceRecord (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        userName TEXT,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'ABSENT',
        checkInTime TEXT,
        reason TEXT,
        updatedBy TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 해당 월의 출석 기록 조회
    const records = await DB.prepare(`
      SELECT 
        id,
        userId,
        userName,
        date,
        status,
        checkInTime,
        reason,
        updatedBy,
        createdAt,
        updatedAt
      FROM AttendanceRecord
      WHERE userId = ?
        AND date >= ?
        AND date <= ?
      ORDER BY date DESC
    `).bind(userId, startDate, endDateStr).all();

    console.log(`✅ ${records.results.length}개 출석 기록 조회 완료`);

    // 통계 계산
    const stats = {
      totalDays: records.results.length,
      presentCount: records.results.filter((r: any) => r.status === 'PRESENT').length,
      lateCount: records.results.filter((r: any) => r.status === 'LATE').length,
      absentCount: records.results.filter((r: any) => r.status === 'ABSENT').length,
      excusedCount: records.results.filter((r: any) => r.status === 'EXCUSED').length,
    };

    const attendanceRate = stats.totalDays > 0
      ? Math.round(((stats.presentCount + stats.lateCount) / stats.totalDays) * 100)
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        records: records.results,
        stats: {
          ...stats,
          attendanceRate
        },
        period: {
          month: targetMonth,
          startDate,
          endDate: endDateStr
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("❌ 학생 출석 기록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch attendance records",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
