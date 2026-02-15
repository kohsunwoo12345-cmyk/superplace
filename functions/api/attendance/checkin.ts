interface Env {
  DB: D1Database;
}

// POST: 출석 체크인 (코드 입력)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { code } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!code) {
      return new Response(
        JSON.stringify({ error: "code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        attendanceCode TEXT NOT NULL,
        checkInTime TEXT DEFAULT (datetime('now')),
        checkInType TEXT DEFAULT 'CODE',
        academyId INTEGER,
        classId TEXT,
        status TEXT DEFAULT 'PRESENT',
        note TEXT,
        modifiedBy INTEGER,
        modifiedAt TEXT
      )
    `).run();

    // 코드 확인
    const attendanceCode = await DB.prepare(
      `SELECT * FROM student_attendance_codes 
       WHERE code = ? AND isActive = 1`
    ).bind(code).first();

    if (!attendanceCode) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid or expired code" 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 만료 체크
    if (attendanceCode.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(attendanceCode.expiresAt);
      if (now > expiresAt) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Code has expired" 
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 오늘 이미 체크인했는지 확인
    const existingRecord = await DB.prepare(
      `SELECT * FROM attendance_records 
       WHERE userId = ? AND date(checkInTime) = date('now') AND classId = ?`
    ).bind(attendanceCode.userId, attendanceCode.classId).first();

    if (existingRecord) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Already checked in today",
          record: existingRecord
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Class 정보 조회하여 수업 시간 확인
    const classInfo = await DB.prepare(
      `SELECT * FROM classes WHERE id = ?`
    ).bind(attendanceCode.classId).first();

    const now = new Date();
    let status = 'PRESENT'; // 기본 출석

    // Class에 스케줄 정보가 있으면 정확한 시간 비교
    if (classInfo && classInfo.schedules) {
      try {
        const schedules = JSON.parse(classInfo.schedules);
        const currentDay = now.getDay(); // 0-6 (일-토)
        const currentTime = now.toTimeString().substring(0, 5); // HH:MM

        // 오늘 해당하는 스케줄 찾기
        const todaySchedule = schedules.find((schedule: any) => 
          schedule.dayOfWeek && schedule.dayOfWeek.includes(currentDay)
        );

        if (todaySchedule && todaySchedule.startTime) {
          // 수업 시작 시간보다 1분이라도 늦으면 지각
          if (currentTime > todaySchedule.startTime) {
            status = 'LATE';
          }
        }
      } catch (error) {
        console.error("Schedule parsing error:", error);
        // 파싱 실패 시 기본 로직 사용 (9시 기준)
        const hour = now.getHours();
        status = hour >= 9 ? 'LATE' : 'PRESENT';
      }
    } else {
      // 스케줄 정보가 없으면 기본 로직 (9시 기준)
      const hour = now.getHours();
      status = hour >= 9 ? 'LATE' : 'PRESENT';
    }

    // 출석 기록 생성
    const id = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await DB.prepare(`
      INSERT INTO attendance_records (
        id, userId, attendanceCode, checkInType, academyId, classId, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      attendanceCode.userId,
      code,
      'CODE',
      attendanceCode.academyId,
      attendanceCode.classId,
      status
    ).run();

    // 사용자 정보 조회
    const user = await DB.prepare(
      "SELECT id, email, name, role FROM users WHERE id = ?"
    ).bind(attendanceCode.userId).first();

    const statusMessage = 
      status === 'LATE' ? '지각 처리되었습니다' : 
      status === 'PRESENT' ? '출석 완료!' : 
      '출석 확인되었습니다';

    return new Response(
      JSON.stringify({
        success: true,
        message: statusMessage,
        attendance: {
          id,
          userId: attendanceCode.userId,
          userName: user?.name,
          userEmail: user?.email,
          checkInTime: now.toISOString(),
          status,
          academyId: attendanceCode.academyId,
          classId: attendanceCode.classId
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Check-in error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check in",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
