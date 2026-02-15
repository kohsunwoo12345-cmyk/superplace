interface Env {
  DB: D1Database;
}

// PATCH: 출석 상태 수정 (관리자/학원장만 가능)
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { attendanceId, status, note, modifiedBy } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!attendanceId || !status) {
      return new Response(
        JSON.stringify({ error: "attendanceId and status are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 유효한 상태 값 확인
    const validStatuses = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 수정자 권한 확인 (관리자 또는 학원장)
    if (modifiedBy) {
      const modifier = await DB.prepare(
        "SELECT role FROM users WHERE id = ?"
      ).bind(modifiedBy).first();

      if (!modifier || (modifier.role !== 'admin' && modifier.role !== 'director')) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Only admin or director can modify attendance" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 출석 기록 업데이트
    await DB.prepare(`
      UPDATE attendance_records
      SET status = ?, note = ?, modifiedBy = ?, modifiedAt = datetime('now')
      WHERE id = ?
    `).bind(status, note || null, modifiedBy || null, attendanceId).run();

    // 업데이트된 기록 조회
    const updatedRecord = await DB.prepare(
      `SELECT ar.*, u.name as userName, u.email as userEmail,
              m.name as modifierName
       FROM attendance_records ar
       LEFT JOIN users u ON ar.userId = u.id
       LEFT JOIN users m ON ar.modifiedBy = m.id
       WHERE ar.id = ?`
    ).bind(attendanceId).first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Attendance updated successfully",
        attendance: updatedRecord
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Attendance update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update attendance",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST: 수동 출석 추가 (관리자/학원장만 가능)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { userId, classId, academyId, status, note, checkInTime, createdBy } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId || !classId || !status) {
      return new Response(
        JSON.stringify({ error: "userId, classId, and status are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 생성자 권한 확인
    if (createdBy) {
      const creator = await DB.prepare(
        "SELECT role FROM users WHERE id = ?"
      ).bind(createdBy).first();

      if (!creator || (creator.role !== 'admin' && creator.role !== 'director')) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Only admin or director can create attendance manually" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 출석 기록 생성
    const id = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const recordTime = checkInTime || new Date().toISOString();

    await DB.prepare(`
      INSERT INTO attendance_records (
        id, userId, attendanceCode, checkInTime, checkInType, 
        academyId, classId, status, note, modifiedBy, modifiedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      userId,
      'MANUAL',
      recordTime,
      'MANUAL',
      academyId || null,
      classId,
      status,
      note || null,
      createdBy || null
    ).run();

    // 생성된 기록 조회
    const newRecord = await DB.prepare(
      `SELECT ar.*, u.name as userName, u.email as userEmail
       FROM attendance_records ar
       LEFT JOIN users u ON ar.userId = u.id
       WHERE ar.id = ?`
    ).bind(id).first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Attendance created successfully",
        attendance: newRecord
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Attendance creation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create attendance",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// DELETE: 출석 기록 삭제 (관리자/학원장만 가능)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const attendanceId = url.searchParams.get('id');
    const deletedBy = url.searchParams.get('deletedBy');

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!attendanceId) {
      return new Response(
        JSON.stringify({ error: "attendanceId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 삭제자 권한 확인
    if (deletedBy) {
      const deleter = await DB.prepare(
        "SELECT role FROM users WHERE id = ?"
      ).bind(deletedBy).first();

      if (!deleter || (deleter.role !== 'admin' && deleter.role !== 'director')) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Only admin or director can delete attendance" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 출석 기록 삭제
    await DB.prepare(
      `DELETE FROM attendance_records WHERE id = ?`
    ).bind(attendanceId).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Attendance deleted successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Attendance deletion error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete attendance",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
