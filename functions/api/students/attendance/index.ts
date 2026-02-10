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

    let attendanceRecords = [];
    
    // Try attendance_records_v2 first (newer table)
    try {
      const queryV2 = `
        SELECT 
          id,
          userId,
          code,
          checkInTime,
          status,
          academyId,
          checkInTime as date
        FROM attendance_records_v2
        WHERE userId = ?
        ORDER BY checkInTime DESC
        LIMIT ?
      `;
      const resultV2 = await DB.prepare(queryV2).bind(parseInt(studentId), limit).all();
      
      if (resultV2.results && resultV2.results.length > 0) {
        attendanceRecords = resultV2.results.map((r: any) => ({
          id: r.id,
          userId: r.userId,
          date: r.checkInTime ? r.checkInTime.split(' ')[0] : null,
          status: r.status?.toLowerCase() || 'present',
          checkInTime: r.checkInTime,
          checkOutTime: null,
          notes: null,
          createdAt: r.checkInTime
        }));
        console.log(`✅ Found ${attendanceRecords.length} records from attendance_records_v2`);
      }
    } catch (v2Error: any) {
      console.warn('⚠️ attendance_records_v2 not available:', v2Error.message);
    }
    
    // Fallback to attendance table if no records from v2
    if (attendanceRecords.length === 0) {
      try {
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
        const result = await DB.prepare(query).bind(parseInt(studentId), limit).all();
        attendanceRecords = result.results || [];
        console.log(`✅ Found ${attendanceRecords.length} records from attendance table`);
      } catch (dbError: any) {
        console.warn('⚠️ attendance table may not exist:', dbError.message);
        attendanceRecords = [];
      }
    }

    // 출결 통계 계산
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r: any) => r.status?.toLowerCase() === 'present' || r.status === 'PRESENT').length,
      late: attendanceRecords.filter((r: any) => r.status?.toLowerCase() === 'late' || r.status === 'LATE').length,
      absent: attendanceRecords.filter((r: any) => r.status?.toLowerCase() === 'absent' || r.status === 'ABSENT').length,
      excused: attendanceRecords.filter((r: any) => r.status?.toLowerCase() === 'excused' || r.status === 'EXCUSED').length,
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
