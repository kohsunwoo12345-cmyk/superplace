interface Env {
  DB: D1Database;
}

/**
 * POST /api/attendance/manual-update
 * 수동으로 출석 상태 업데이트 (학원장/선생님 전용)
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { userId, date, status, reason, updatedBy } = body;

    // 필수 파라미터 체크
    if (!userId || !date || !status) {
      return new Response(
        JSON.stringify({ success: false, error: "userId, date, status는 필수입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 유효한 상태 값 체크
    const validStatuses = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `유효하지 않은 상태입니다. 가능한 값: ${validStatuses.join(', ')}` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📝 수동 출석 처리 요청:', { userId, date, status, reason, updatedBy });

    // 1. 사용자 정보 조회
    const user = await DB.prepare(`
      SELECT id, name, email, academyId FROM User WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "사용자를 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. 한국 시간으로 현재 시간 계산
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    // 3. 해당 날짜의 기존 출석 기록 확인
    const existingRecord = await DB.prepare(`
      SELECT id FROM attendance_records_v3 
      WHERE userId = ? AND date = ?
    `).bind(userId, date).first();

    let recordId: string;

    if (existingRecord) {
      // 기존 기록 업데이트
      recordId = existingRecord.id as string;
      await DB.prepare(`
        UPDATE attendance_records_v3
        SET status = ?, 
            checkInTime = ?,
            reason = ?,
            updatedBy = ?,
            updatedAt = ?
        WHERE id = ?
      `).bind(
        status,
        kstTimestamp,
        reason || null,
        updatedBy || 'manual',
        kstTimestamp,
        recordId
      ).run();

      console.log('✅ 기존 출석 기록 업데이트:', recordId);
    } else {
      // 새 기록 생성
      recordId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await DB.prepare(`
        INSERT INTO attendance_records_v3 (
          id, userId, date, status, checkInTime, 
          academyId, reason, updatedBy, createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        recordId,
        userId,
        date,
        status,
        kstTimestamp,
        user.academyId || null,
        reason || null,
        updatedBy || 'manual',
        kstTimestamp
      ).run();

      console.log('✅ 새 출석 기록 생성:', recordId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "출석 상태가 업데이트되었습니다",
        record: {
          id: recordId,
          userId,
          userName: user.name,
          date,
          status,
          checkInTime: kstTimestamp,
          reason: reason || null
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 수동 출석 처리 오류:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update attendance",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
