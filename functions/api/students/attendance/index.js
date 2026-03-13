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

    // 1. attendance_records_v3 (QR/코드 출석) 조회
    const v3Result = await DB.prepare(`
      SELECT 
        id,
        userId,
        code,
        checkInTime,
        status,
        academyId
      FROM attendance_records_v3
      WHERE userId = ?
      ORDER BY checkInTime DESC
      LIMIT ?
    `).bind(studentId, limit).all();
    
    const v3Records = (v3Result.results || []).map(r => ({
      id: r.id,
      userId: r.userId,
      date: r.checkInTime ? r.checkInTime.substring(0, 10) : null,
      status: r.status?.toLowerCase() || 'present',
      checkInTime: r.checkInTime,
      createdAt: r.checkInTime,
      notes: r.code ? `코드: ${r.code}` : null,
      source: 'v3'
    }));

    // 2. Attendance (수동 출석 관리) 조회
    const manualResult = await DB.prepare(`
      SELECT 
        id,
        userId,
        date,
        status,
        note,
        createdAt
      FROM Attendance
      WHERE userId = ?
      ORDER BY date DESC, createdAt DESC
      LIMIT ?
    `).bind(studentId, limit).all();

    const manualRecords = (manualResult.results || []).map(r => ({
      id: r.id,
      userId: r.userId,
      date: r.date,
      status: r.status?.toLowerCase() === 'tardy' ? 'late' : r.status?.toLowerCase() || 'present',
      checkInTime: r.createdAt,
      createdAt: r.createdAt,
      notes: r.note,
      source: 'manual'
    }));

    // 3. 데이터 통합 및 정렬 (최신순)
    // 같은 날짜에 중복된 기록이 있을 경우 수동 기록이나 더 상세한 기록을 우선할 수 있으나, 일단 모두 표시
    const allRecords = [...v3Records, ...manualRecords]
      .sort((a, b) => {
        // 날짜 우선 비교
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        // 같은 날짜면 생성 시간 비교
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      })
      .slice(0, limit);

    console.log(`✅ Found ${allRecords.length} total records for student ${studentId} (v3: ${v3Records.length}, manual: ${manualRecords.length})`);
    
    const attendanceRecords = allRecords;

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
