// 학생 출결 조회 API - 간단 버전
export async function onRequestGet(context) {
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

    // attendance_records_v2에서 조회 (문자열 비교만)
    const result = await DB.prepare(`
      SELECT 
        id,
        userId,
        code,
        checkInTime,
        status,
        academyId
      FROM attendance_records_v2
      WHERE CAST(userId AS TEXT) = ?
      ORDER BY checkInTime DESC
      LIMIT ?
    `).bind(String(studentId), limit).all();
    
    const records = result.results || [];
    console.log(`✅ Found ${records.length} records for student ${studentId}`);
    
    // 형식 변환
    const attendanceRecords = records.map(r => ({
      id: r.id,
      userId: r.userId,
      date: r.checkInTime ? r.checkInTime.substring(0, 10) : null,
      status: r.status?.toLowerCase() || 'present',
      checkInTime: r.checkInTime,
      createdAt: r.checkInTime,
      notes: null,
    }));

    // 통계 계산
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(r => 
        r.status === 'present' || r.status === 'verified'
      ).length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      excused: attendanceRecords.filter(r => r.status === 'excused').length,
    };

    const attendanceRate = stats.total > 0 
      ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
      : '0.0';

    console.log('📊 Student attendance stats:', stats);

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
  } catch (error) {
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
}
