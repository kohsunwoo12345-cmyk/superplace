// 출석 상태 수정 API
interface Env {
  DB: D1Database;
}

function getKoreanDateTime(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kstTime.toISOString().replace('T', ' ').substring(0, 19);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { userId, date, status } = body;

    console.log("📝 Attendance update request:", { userId, date, status });

    if (!userId || !date || !status) {
      return new Response(JSON.stringify({
        success: false,
        message: "필수 파라미터가 누락되었습니다. (userId, date, status)"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 허용된 상태 확인
    const allowedStatuses = ["VERIFIED", "LATE", "ABSENT"];
    if (!allowedStatuses.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        message: `유효하지 않은 상태입니다. 허용된 상태: ${allowedStatuses.join(", ")}`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 해당 날짜의 출석 기록 찾기
    const existingRecord = await DB.prepare(`
      SELECT id, userId, checkInTime, status
      FROM attendance_records_v3
      WHERE userId = ? AND substr(checkInTime, 1, 10) = ?
      LIMIT 1
    `).bind(userId, date).first();

    console.log("🔍 Existing record:", existingRecord);

    if (existingRecord) {
      // 기존 레코드 업데이트
      await DB.prepare(`
        UPDATE attendance_records_v3
        SET status = ?, checkInTime = ?
        WHERE id = ?
      `).bind(status, `${date} ${getKoreanDateTime().split(' ')[1]}`, existingRecord.id).run();

      console.log("✅ Updated existing record:", existingRecord.id);

      return new Response(JSON.stringify({
        success: true,
        message: "출석 상태가 수정되었습니다.",
        record: {
          id: existingRecord.id,
          userId,
          date,
          status,
          updated: true
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // 새 레코드 생성
      const newId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const checkInTime = `${date} ${getKoreanDateTime().split(' ')[1]}`;
      
      // 사용자 정보 조회 (academyId 가져오기)
      let academyId = null;
      try {
        const userRecord = await DB.prepare(`
          SELECT id, academyId FROM users WHERE id = ?
        `).bind(userId).first();
        
        if (!userRecord) {
          const usersRecord = await DB.prepare(`
            SELECT id, academyId FROM users WHERE id = ?
          `).bind(userId).first();
          academyId = usersRecord?.academyId;
        } else {
          academyId = userRecord.academyId;
        }
      } catch (e) {
        console.warn("Could not fetch user academyId:", e);
      }

      await DB.prepare(`
        INSERT INTO attendance_records_v3 (id, userId, checkInTime, status, academyId, code)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(newId, userId, checkInTime, status, academyId, "MANUAL").run();

      console.log("✅ Created new record:", newId);

      return new Response(JSON.stringify({
        success: true,
        message: "출석 기록이 생성되었습니다.",
        record: {
          id: newId,
          userId,
          date,
          status,
          created: true
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error: any) {
    console.error("❌ Attendance update error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "출석 수정 중 오류가 발생했습니다.",
      message: error.message,
      details: error.toString(),
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
