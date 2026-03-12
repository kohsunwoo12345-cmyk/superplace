interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    // 1. 전체 레코드 수 확인
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM attendance_records_v2
    `).first();
    
    // 2. 최근 200개 레코드 가져오기 (statistics API와 동일)
    const recentRecords = await DB.prepare(`
      SELECT id, userId, code, checkInTime, status, academyId
      FROM attendance_records_v2
      ORDER BY checkInTime DESC
      LIMIT 200
    `).all();
    
    // 3. 오늘 날짜 계산 (KST)
    const now = new Date();
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const year = kstTime.getFullYear();
    const month = String(kstTime.getMonth() + 1).padStart(2, '0');
    const day = String(kstTime.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    // 4. 오늘 날짜로 필터링
    const records = recentRecords.results || [];
    const todayRecords = records.filter((r: any) => 
      r.checkInTime && r.checkInTime.substring(0, 10) === today
    );
    
    return new Response(JSON.stringify({
      success: true,
      today,
      totalRecordsInDB: countResult?.total || 0,
      recentRecordsCount: records.length,
      firstFiveCheckInTimes: records.slice(0, 5).map((r: any) => r.checkInTime),
      todayRecordsInRecent200: todayRecords.length,
      todayRecordsSample: todayRecords.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        checkInTime: r.checkInTime,
        status: r.status
      }))
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: "Debug query failed",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
