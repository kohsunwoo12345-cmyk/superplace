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

    console.log('🗑️ 모든 테스트 출석 데이터 삭제 시작');

    // 모든 테스트 출석 데이터 삭제 (ID에 'test'가 포함된 것만)
    const deleteResult = await DB.prepare(`
      DELETE FROM attendance_records
      WHERE id LIKE '%test%'
    `).run();

    console.log('✅ 삭제 완료:', deleteResult);

    // 남은 출석 기록 조회
    const remainingRecords = await DB.prepare(`
      SELECT 
        userId,
        COUNT(*) as recordCount,
        COUNT(DISTINCT DATE(checkInTime)) as distinctDays
      FROM attendance_records
      GROUP BY userId
      ORDER BY userId
    `).all();

    // 전체 통계
    const totalRemaining = await DB.prepare(`
      SELECT COUNT(*) as total
      FROM attendance_records
    `).first();

    const response = {
      success: true,
      deleted: {
        success: deleteResult.success,
        changes: deleteResult.meta?.changes || 0,
        message: `테스트 출석 데이터 ${deleteResult.meta?.changes || 0}건 삭제 완료`
      },
      remaining: {
        total: totalRemaining?.total || 0,
        byUser: remainingRecords.results || []
      },
      message: `✅ 모든 테스트 데이터 삭제 완료. 이제 각 학생의 실제 출석 데이터만 표시됩니다.`
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('❌ 테스트 데이터 삭제 실패:', error);
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
