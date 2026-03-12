interface Env {
  DB: D1Database;
}

/**
 * 출석 데이터 디버그 API
 * GET /api/admin/debug-attendance-records
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. attendance_records_v2 테이블 존재 확인
    const tableCheck = await DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='attendance_records_v2'
    `).all();

    // 2. 오늘 날짜의 출석 기록 조회
    const todayRecords = await DB.prepare(`
      SELECT * FROM attendance_records_v2 
      WHERE SUBSTR(checkInTime, 1, 10) = ?
      ORDER BY checkInTime DESC
    `).bind(date).all();

    // 3. 전체 출석 기록 수
    const totalCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM attendance_records_v2
    `).first();

    // 4. 최근 5개 출석 기록
    const recentRecords = await DB.prepare(`
      SELECT 
        id, userId, code, checkInTime, status, academyId
      FROM attendance_records_v2 
      ORDER BY checkInTime DESC 
      LIMIT 5
    `).all();

    // 4-1. 최근 200개 출석 기록 (statistics API와 동일)
    const recent200Records = await DB.prepare(`
      SELECT id, userId, code, checkInTime, status, academyId
      FROM attendance_records_v2
      ORDER BY checkInTime DESC
      LIMIT 200
    `).all();

    // 4-2. KST 오늘 날짜 계산
    const now = new Date();
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const year = kstTime.getFullYear();
    const month = String(kstTime.getMonth() + 1).padStart(2, '0');
    const day = String(kstTime.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // 4-3. 200개 중 오늘 데이터 필터링
    const todayInRecent200 = recent200Records.results.filter((r: any) => 
      r.checkInTime && r.checkInTime.substring(0, 10) === today
    );

    // 5. users 테이블과 조인한 결과
    const joinedRecords = await DB.prepare(`
      SELECT 
        ar.id,
        ar.userId,
        ar.code,
        ar.checkInTime,
        ar.status,
        ar.academyId,
        u.name as userName,
        u.email as userEmail
      FROM attendance_records_v2 ar
      LEFT JOIN users u ON u.id = ar.userId
      WHERE SUBSTR(ar.checkInTime, 1, 10) = ?
      ORDER BY ar.checkInTime DESC
    `).bind(date).all();

    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          date,
          todayKST: today,
          tableExists: tableCheck.results.length > 0,
          todayRecordsCount: todayRecords.results.length,
          totalRecordsCount: totalCount?.count || 0,
          recent200Count: recent200Records.results.length,
          todayInRecent200Count: todayInRecent200.length,
          todayRecords: todayRecords.results,
          recentRecords: recentRecords.results,
          firstFiveOfRecent200: recent200Records.results.slice(0, 5).map((r: any) => r.checkInTime),
          todayInRecent200: todayInRecent200.map((r: any) => ({
            id: r.id,
            userId: r.userId,
            checkInTime: r.checkInTime,
            status: r.status
          })),
          joinedRecords: joinedRecords.results,
        }
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    );

  } catch (error: any) {
    console.error("Debug attendance records error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
