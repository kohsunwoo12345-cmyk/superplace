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

    console.log('🔍 전체 출석 데이터 조회 시작');

    // 1. 전체 출석 기록 조회
    const allRecords = await DB.prepare(`
      SELECT 
        id,
        userId,
        checkInTime,
        academyId,
        classId,
        status
      FROM attendance_records
      ORDER BY userId, checkInTime
    `).all();

    console.log('✅ 전체 출석 기록:', allRecords);

    // 2. 학생별 출석 통계
    const userStats = await DB.prepare(`
      SELECT 
        userId,
        COUNT(*) as totalRecords,
        COUNT(DISTINCT DATE(checkInTime)) as distinctDays,
        MIN(checkInTime) as firstCheckIn,
        MAX(checkInTime) as lastCheckIn
      FROM attendance_records
      GROUP BY userId
      ORDER BY userId
    `).all();

    console.log('✅ 학생별 출석 통계:', userStats);

    // 3. 이번 달 출석 통계
    const thisMonthStats = await DB.prepare(`
      SELECT 
        userId,
        COUNT(*) as totalRecords,
        COUNT(DISTINCT DATE(checkInTime)) as distinctDays
      FROM attendance_records
      WHERE strftime('%Y-%m', checkInTime) = strftime('%Y-%m', 'now')
      GROUP BY userId
      ORDER BY userId
    `).all();

    console.log('✅ 이번 달 출석 통계:', thisMonthStats);

    // 4. userId 타입 확인
    const typeCheck = await DB.prepare(`
      SELECT 
        typeof(userId) as userIdType,
        userId,
        COUNT(*) as count
      FROM attendance_records
      GROUP BY userId
      ORDER BY userId
    `).all();

    console.log('✅ userId 타입 확인:', typeCheck);

    const response = {
      success: true,
      totalRecords: allRecords.results?.length || 0,
      allRecords: allRecords.results || [],
      userStats: userStats.results || [],
      thisMonthStats: thisMonthStats.results || [],
      typeCheck: typeCheck.results || [],
      serverTime: new Date().toISOString(),
      diagnostics: {
        hasRecords: (allRecords.results?.length || 0) > 0,
        uniqueUsers: new Set(allRecords.results?.map((r: any) => r.userId)).size,
        dateRange: {
          earliest: allRecords.results?.[0]?.checkInTime,
          latest: allRecords.results?.[allRecords.results.length - 1]?.checkInTime
        }
      }
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('❌ 출석 데이터 조회 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch attendance data",
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
