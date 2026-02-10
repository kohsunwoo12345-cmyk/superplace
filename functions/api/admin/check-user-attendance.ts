interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 학생 ${userId}의 출석 데이터 조회`);

    // 1. 해당 학생의 모든 출석 기록
    const userRecords = await DB.prepare(`
      SELECT 
        id,
        userId,
        checkInTime,
        academyId,
        classId,
        status,
        DATE(checkInTime) as checkInDate
      FROM attendance_records
      WHERE userId = ?
      ORDER BY checkInTime DESC
    `).bind(parseInt(userId)).all();

    console.log('✅ 학생 출석 기록:', userRecords);

    // 2. 이번 달 출석 통계
    const thisMonthStats = await DB.prepare(`
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(DISTINCT DATE(checkInTime)) as distinctDays,
        MIN(checkInTime) as firstCheckIn,
        MAX(checkInTime) as lastCheckIn
      FROM attendance_records
      WHERE userId = ?
        AND strftime('%Y-%m', checkInTime) = strftime('%Y-%m', 'now')
    `).bind(parseInt(userId)).first();

    console.log('✅ 이번 달 통계:', thisMonthStats);

    // 3. 전체 출석 통계
    const allTimeStats = await DB.prepare(`
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(DISTINCT DATE(checkInTime)) as distinctDays,
        MIN(checkInTime) as firstCheckIn,
        MAX(checkInTime) as lastCheckIn
      FROM attendance_records
      WHERE userId = ?
    `).bind(parseInt(userId)).first();

    console.log('✅ 전체 통계:', allTimeStats);

    // 4. 날짜별 출석 목록
    const dateList = await DB.prepare(`
      SELECT DISTINCT DATE(checkInTime) as date
      FROM attendance_records
      WHERE userId = ?
      ORDER BY date DESC
    `).bind(parseInt(userId)).all();

    console.log('✅ 날짜 목록:', dateList);

    const response = {
      success: true,
      userId: parseInt(userId),
      records: userRecords.results || [],
      stats: {
        thisMonth: {
          totalRecords: thisMonthStats?.totalRecords || 0,
          distinctDays: thisMonthStats?.distinctDays || 0,
          firstCheckIn: thisMonthStats?.firstCheckIn,
          lastCheckIn: thisMonthStats?.lastCheckIn
        },
        allTime: {
          totalRecords: allTimeStats?.totalRecords || 0,
          distinctDays: allTimeStats?.distinctDays || 0,
          firstCheckIn: allTimeStats?.firstCheckIn,
          lastCheckIn: allTimeStats?.lastCheckIn
        }
      },
      dateList: (dateList.results || []).map((d: any) => d.date),
      serverTime: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('❌ 학생 출석 데이터 조회 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch user attendance data",
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
