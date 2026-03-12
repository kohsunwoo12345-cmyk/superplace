// 출석 기록 v3 테이블 확인 API
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. 테이블 존재 확인
    let tableExists = false;
    try {
      await DB.prepare(`SELECT 1 FROM attendance_records_v3 LIMIT 1`).first();
      tableExists = true;
    } catch (e: any) {
      tableExists = false;
    }

    if (!tableExists) {
      return new Response(JSON.stringify({
        error: "attendance_records_v3 table does not exist",
        suggestion: "테이블이 존재하지 않습니다. 마이그레이션이 필요합니다."
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 전체 레코드 수 확인
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM attendance_records_v3
    `).first();

    // 3. 최근 10개 레코드 조회
    const recentRecords = await DB.prepare(`
      SELECT 
        id,
        userId,
        code,
        checkInTime,
        status,
        academyId,
        substr(checkInTime, 1, 10) as date
      FROM attendance_records_v3
      ORDER BY checkInTime DESC
      LIMIT 10
    `).all();

    // 4. userId별 통계
    const userStats = await DB.prepare(`
      SELECT 
        userId,
        COUNT(*) as recordCount,
        MIN(checkInTime) as firstRecord,
        MAX(checkInTime) as lastRecord
      FROM attendance_records_v3
      GROUP BY userId
      ORDER BY recordCount DESC
      LIMIT 10
    `).all();

    // 5. 월별 통계
    const monthlyStats = await DB.prepare(`
      SELECT 
        substr(checkInTime, 1, 7) as month,
        COUNT(*) as count
      FROM attendance_records_v3
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all();

    // 6. 상태별 통계
    const statusStats = await DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance_records_v3
      GROUP BY status
    `).all();

    return new Response(JSON.stringify({
      success: true,
      tableExists: true,
      totalRecords: countResult?.total || 0,
      recentRecords: recentRecords.results || [],
      userStats: userStats.results || [],
      monthlyStats: monthlyStats.results || [],
      statusStats: statusStats.results || [],
      message: "attendance_records_v3 테이블 정상 조회됨"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("❌ Error checking attendance_records_v3:", error);
    return new Response(JSON.stringify({
      error: "Failed to check attendance_records_v3",
      message: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
