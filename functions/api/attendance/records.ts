interface Env {
  DB: D1Database;
}

/**
 * GET /api/attendance/records
 * 특정 날짜의 출석 기록 조회
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const academyId = url.searchParams.get('academyId');
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    console.log('📊 출석 기록 조회:', { date, academyId, userId, startDate, endDate });

    // 출석 기록 조회 쿼리
    let query = `
      SELECT 
        ar.id,
        ar.userId,
        ar.date,
        ar.status,
        ar.checkInTime,
        ar.reason,
        ar.updatedBy,
        u.name as userName,
        u.email as userEmail,
        u.classId
      FROM attendance_records_v3 ar
      LEFT JOIN User u ON u.id = ar.userId
      WHERE 1=1
    `;

    const params: any[] = [];

    // 날짜 필터링 (단일 날짜 또는 범위)
    if (date) {
      query += ' AND ar.date = ?';
      params.push(date);
    } else if (startDate && endDate) {
      query += ' AND ar.date >= ? AND ar.date <= ?';
      params.push(startDate, endDate);
    }

    // 학원 필터링
    if (academyId) {
      query += ' AND ar.academyId = ?';
      params.push(academyId);
    }

    // 사용자 필터링
    if (userId) {
      query += ' AND ar.userId = ?';
      params.push(userId);
    }

    query += ' ORDER BY ar.date DESC, ar.checkInTime DESC';

    console.log('🔍 Executing query:', query);
    console.log('📝 Params:', params);

    const result = await DB.prepare(query).bind(...params).all();
    const records = result.results || [];

    console.log(`✅ 출석 기록 ${records.length}개 조회됨`);

    return new Response(
      JSON.stringify({
        success: true,
        date,
        count: records.length,
        records: records.map((r: any) => ({
          id: r.id,
          userId: r.userId,
          userName: r.userName,
          userEmail: r.userEmail,
          date: r.date,
          status: r.status,
          checkInTime: r.checkInTime,
          reason: r.reason,
          updatedBy: r.updatedBy,
          classId: r.classId
        }))
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 출석 기록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch attendance records",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
