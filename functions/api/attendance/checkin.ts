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
        note TEXT
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

    // 🆕 학원의 구독 상태 확인 (학원장 기준)
    if (attendanceCode.academyId) {
      // 해당 학원의 학원장 찾기
      const director = await DB.prepare(`
        SELECT id FROM users 
        WHERE academyId = ? AND role = 'DIRECTOR'
        LIMIT 1
      `).bind(attendanceCode.academyId).first();

      if (director) {
        // 학원장의 활성 구독 확인
        const subscription = await DB.prepare(`
          SELECT * FROM user_subscriptions 
          WHERE userId = ? AND status = 'active'
          ORDER BY createdAt DESC
          LIMIT 1
        `).bind(director.id).first();

        if (!subscription) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "SUBSCRIPTION_REQUIRED",
              message: "학원의 요금제 구독이 필요합니다. 학원장에게 문의해주세요.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // 구독 만료 여부 확인
        const now = new Date();
        const endDate = new Date(subscription.endDate as string);
        
        if (now > endDate) {
          // 만료된 구독 상태 업데이트
          await DB.prepare(`
            UPDATE user_subscriptions 
            SET status = 'expired', updatedAt = datetime('now')
            WHERE id = ?
          `).bind(subscription.id).run();

          return new Response(
            JSON.stringify({ 
              success: false,
              error: "SUBSCRIPTION_EXPIRED",
              message: "학원의 구독이 만료되었습니다. 학원장에게 갱신을 요청해주세요.",
              expiredDate: subscription.endDate,
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
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
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await DB.prepare(
      `SELECT * FROM attendance_records 
       WHERE userId = ? AND date(checkInTime) = date('now')`
    ).bind(attendanceCode.userId).first();

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

    // 출석 기록 생성
    const id = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const hour = now.getHours();
    
    // 지각 판단 (9시 이후 체크인은 지각)
    const status = hour >= 9 ? 'LATE' : 'PRESENT';

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

    return new Response(
      JSON.stringify({
        success: true,
        message: status === 'LATE' ? '지각 처리되었습니다' : '출석 완료!',
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
