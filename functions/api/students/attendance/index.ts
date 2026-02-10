interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/attendance?studentId={studentId}
 * 학생의 출결 기록 조회
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
    const studentId = url.searchParams.get("studentId");
    const limit = parseInt(url.searchParams.get("limit") || "30");

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📊 Fetching attendance for student:', studentId);

    // 출결 기록 조회
    const query = `
      SELECT 
        id,
        user_id as userId,
        class_id as classId,
        date,
        status,
        check_in_time as checkInTime,
        check_out_time as checkOutTime,
        notes,
        created_at as createdAt
      FROM attendance
      WHERE user_id = ?
      ORDER BY date DESC, created_at DESC
      LIMIT ?
    `;

    let attendanceRecords = [];
    
    try {
      const result = await DB.prepare(query).bind(parseInt(studentId), limit).all();
      attendanceRecords = result.results || [];
      console.log(`✅ Found ${attendanceRecords.length} attendance records`);
    } catch (dbError: any) {
      console.warn('⚠️ attendance table may not exist:', dbError.message);
      attendanceRecords = [];
    }

    // 출결 통계 계산
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r: any) => r.status === 'present').length,
      late: attendanceRecords.filter((r: any) => r.status === 'late').length,
      absent: attendanceRecords.filter((r: any) => r.status === 'absent').length,
      excused: attendanceRecords.filter((r: any) => r.status === 'excused').length,
    };

    // 출석률 계산
    const attendanceRate = stats.total > 0 
      ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
      : '0.0';

    return new Response(
      JSON.stringify({
        success: true,
        attendance: attendanceRecords,
        stats: {
          ...stats,
          attendanceRate: parseFloat(attendanceRate),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Fetch attendance error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "출결 정보 조회 중 오류가 발생했습니다",
        attendance: [],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
