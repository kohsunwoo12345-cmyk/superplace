interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json();
    const { userId, attendanceDates } = body;

    if (!userId || !attendanceDates || !Array.isArray(attendanceDates)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "userId and attendanceDates (array) are required" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 실제 출석 데이터 생성: userId ${userId}, ${attendanceDates.length}일`);

    // attendance_records 테이블 확인 및 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        attendanceCode TEXT,
        checkInTime TEXT NOT NULL DEFAULT (datetime('now')),
        checkInType TEXT DEFAULT 'CODE',
        academyId INTEGER,
        classId TEXT,
        status TEXT DEFAULT 'PRESENT',
        note TEXT
      )
    `).run();

    const createdRecords = [];

    for (const dateStr of attendanceDates) {
      // YYYY-MM-DD 형식 검증
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        continue;
      }

      const recordId = `attendance-real-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const checkInTime = `${dateStr}T09:00:00.000Z`;

      await DB.prepare(`
        INSERT INTO attendance_records (
          id,
          userId,
          checkInTime,
          academyId,
          classId,
          status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        recordId,
        parseInt(userId),
        checkInTime,
        1,
        'REAL-CLASS',
        'PRESENT'
      ).run();

      createdRecords.push({
        id: recordId,
        date: dateStr,
        checkInTime
      });

      // 중복 방지를 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 최종 출석 통계 조회
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(DISTINCT DATE(checkInTime)) as distinctDays
      FROM attendance_records
      WHERE userId = ?
        AND strftime('%Y-%m', checkInTime) = strftime('%Y-%m', 'now')
    `).bind(parseInt(userId)).first();

    const response = {
      success: true,
      userId: parseInt(userId),
      created: {
        count: createdRecords.length,
        records: createdRecords
      },
      stats: {
        totalRecords: stats?.totalRecords || 0,
        distinctDays: stats?.distinctDays || 0
      },
      message: `실제 출석 데이터 ${createdRecords.length}건 생성 완료`
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('❌ 실제 출석 데이터 생성 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create real attendance data",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
