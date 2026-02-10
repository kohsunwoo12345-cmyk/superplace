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

    const body = await context.request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🗑️ 테스트 출석 데이터 삭제: userId ${userId}`);

    // 테스트 출석 데이터 삭제 (ID에 'test'가 포함된 것만)
    const deleteResult = await DB.prepare(`
      DELETE FROM attendance_records
      WHERE userId = ?
        AND id LIKE '%test%'
    `).bind(parseInt(userId)).run();

    console.log('✅ 삭제 완료:', deleteResult);

    // 남은 출석 기록 조회
    const remainingRecords = await DB.prepare(`
      SELECT * FROM attendance_records
      WHERE userId = ?
      ORDER BY checkInTime DESC
    `).bind(parseInt(userId)).all();

    const response = {
      success: true,
      userId: parseInt(userId),
      deleted: {
        success: deleteResult.success,
        changes: deleteResult.meta?.changes || 0
      },
      remaining: {
        count: remainingRecords.results?.length || 0,
        records: remainingRecords.results || []
      },
      message: `테스트 출석 데이터 ${deleteResult.meta?.changes || 0}건 삭제 완료`
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
        error: "Failed to delete test attendance data",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
