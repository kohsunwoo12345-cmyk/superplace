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

    let attendanceRecords: any[] = [];
    
    // 패턴 1: attendance_records_v2 (출석 코드로 생성된 최신 테이블)
    try {
      const result = await DB.prepare(`
        SELECT 
          id,
          userId,
          code,
          checkInTime,
          status,
          academyId
        FROM attendance_records_v2
        WHERE CAST(userId AS TEXT) = ? OR userId = ?
        ORDER BY checkInTime DESC
        LIMIT ?
      `).bind(String(studentId), parseInt(studentId) || studentId, limit).all();
      
      const records = result.results || [];
      
      // attendance_records_v2 형식을 attendanceRecords 형식으로 변환
      attendanceRecords = records.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        date: r.checkInTime ? r.checkInTime.substring(0, 10) : null, // YYYY-MM-DD 추출
        status: r.status?.toLowerCase() || 'present', // PRESENT, LATE -> present, late
        checkInTime: r.checkInTime,
        createdAt: r.checkInTime,
        notes: null,
      }));
      
      console.log(`✅ Found ${attendanceRecords.length} attendance records (attendance_records_v2)`);
    } catch (e1: any) {
      console.warn('⚠️ attendance_records_v2 테이블 조회 실패, 다른 패턴 시도:', e1.message);
    }
    
    // 패턴 2: attendance (snake_case) - 기존 레거시 테이블
    if (attendanceRecords.length === 0) {
      try {
        const result = await DB.prepare(`
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
        `).bind(parseInt(studentId), limit).all();
        attendanceRecords = result.results || [];
        console.log(`✅ Found ${attendanceRecords.length} attendance records (attendance)`);
      } catch (e2: any) {
        console.warn('⚠️ attendance 테이블 조회 실패, 다른 패턴 시도:', e2.message);
      }
    }
    
    // 패턴 3: Attendance (PascalCase)
    if (attendanceRecords.length === 0) {
      try {
        const result = await DB.prepare(`
          SELECT 
            id,
            userId,
            classId,
            date,
            status,
            checkInTime,
            checkOutTime,
            notes,
            createdAt
          FROM Attendance
          WHERE userId = ?
          ORDER BY date DESC, createdAt DESC
          LIMIT ?
        `).bind(parseInt(studentId), limit).all();
        attendanceRecords = result.results || [];
        console.log(`✅ Found ${attendanceRecords.length} attendance records (Attendance)`);
      } catch (e3: any) {
        console.warn('⚠️ Attendance 테이블도 조회 실패, 빈 배열 반환:', e3.message);
        attendanceRecords = [];
      }
    }

    // 출결 통계 계산 (status는 소문자로 정규화)
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r: any) => 
        r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'verified'
      ).length,
      late: attendanceRecords.filter((r: any) => 
        r.status?.toLowerCase() === 'late'
      ).length,
      absent: attendanceRecords.filter((r: any) => 
        r.status?.toLowerCase() === 'absent'
      ).length,
      excused: attendanceRecords.filter((r: any) => 
        r.status?.toLowerCase() === 'excused'
      ).length,
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
