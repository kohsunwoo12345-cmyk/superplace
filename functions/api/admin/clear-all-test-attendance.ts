interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🗑️ 모든 테스트 출석 데이터 일괄 삭제 시작');

    // 테스트 데이터 삭제 전 통계
    const beforeStats = await DB.prepare(`
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(DISTINCT userId) as totalUsers
      FROM attendance_records
      WHERE id LIKE '%test%'
    `).first();

    console.log('삭제 전 테스트 데이터:', beforeStats);

    // 모든 테스트 출석 데이터 삭제 (ID에 'test'가 포함된 것)
    const deleteResult = await DB.prepare(`
      DELETE FROM attendance_records
      WHERE id LIKE '%test%'
    `).run();

    console.log('✅ 테스트 데이터 삭제 완료:', deleteResult);

    // 삭제 후 남은 데이터 통계
    const afterStats = await DB.prepare(`
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(DISTINCT userId) as totalUsers
      FROM attendance_records
    `).first();

    console.log('삭제 후 남은 데이터:', afterStats);

    // 학생별 남은 출석 데이터
    const userStats = await DB.prepare(`
      SELECT 
        userId,
        COUNT(*) as recordCount,
        COUNT(DISTINCT DATE(checkInTime)) as distinctDays,
        MIN(checkInTime) as firstCheckIn,
        MAX(checkInTime) as lastCheckIn
      FROM attendance_records
      GROUP BY userId
      ORDER BY userId
    `).all();

    const response = {
      success: true,
      deleted: {
        success: deleteResult.success,
        changes: deleteResult.meta?.changes || 0,
        beforeStats: {
          totalRecords: beforeStats?.totalRecords || 0,
          totalUsers: beforeStats?.totalUsers || 0
        }
      },
      remaining: {
        totalRecords: afterStats?.totalRecords || 0,
        totalUsers: afterStats?.totalUsers || 0,
        userStats: userStats.results || []
      },
      message: `테스트 데이터 ${deleteResult.meta?.changes || 0}건 삭제 완료. ` +
               `남은 실제 출석 데이터: ${afterStats?.totalRecords || 0}건`
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('❌ 테스트 데이터 일괄 삭제 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to delete all test attendance data",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
