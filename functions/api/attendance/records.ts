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

    if (!date) {
      return new Response(
        JSON.stringify({ success: false, error: "date 파라미터가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📊 출석 기록 조회:', { date, academyId });

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
      WHERE ar.date = ?
    `;

    const params: any[] = [date];

    // 학원 필터링
    if (academyId) {
      query += ' AND ar.academyId = ?';
      params.push(academyId);
    }

    query += ' ORDER BY ar.checkInTime DESC';

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
