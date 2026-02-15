interface Env {
  DB: D1Database;
}

// POST: 오늘 수업이 있는데 출석하지 않은 학생들 자동 결석 처리
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (일-토)
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    const today = now.toISOString().split('T')[0];

    // 오늘 수업이 있는 모든 클래스 조회
    const classes = await DB.prepare(
      `SELECT * FROM classes WHERE isActive = 1`
    ).all();

    let processedCount = 0;
    let absentCount = 0;
    const results: any[] = [];

    for (const classInfo of classes.results || []) {
      try {
        // 스케줄 파싱
        if (!classInfo.schedules) continue;
        
        const schedules = JSON.parse(classInfo.schedules);
        
        // 오늘 수업이 있는지 확인
        const todaySchedule = schedules.find((schedule: any) => 
          schedule.dayOfWeek && schedule.dayOfWeek.includes(currentDay)
        );

        if (!todaySchedule || !todaySchedule.startTime || !todaySchedule.endTime) {
          continue; // 오늘 수업이 없거나 시간 정보가 없으면 스킵
        }

        // 수업 종료 시간이 지났는지 확인
        if (currentTime < todaySchedule.endTime) {
          continue; // 아직 수업이 끝나지 않았으면 스킵
        }

        // 클래스의 모든 학생 조회
        let studentIds: number[] = [];
        if (classInfo.studentIds) {
          try {
            studentIds = JSON.parse(classInfo.studentIds);
          } catch (e) {
            console.error(`Failed to parse studentIds for class ${classInfo.id}:`, e);
            continue;
          }
        }

        // 각 학생의 오늘 출석 기록 확인
        for (const studentId of studentIds) {
          processedCount++;

          // 오늘 이 클래스에 출석 기록이 있는지 확인
          const attendanceRecord = await DB.prepare(
            `SELECT * FROM attendance_records 
             WHERE userId = ? 
             AND classId = ? 
             AND date(checkInTime) = ?`
          ).bind(studentId, classInfo.id, today).first();

          // 출석 기록이 없으면 결석 처리
          if (!attendanceRecord) {
            absentCount++;

            const id = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            await DB.prepare(`
              INSERT INTO attendance_records (
                id, userId, attendanceCode, checkInTime, checkInType, 
                academyId, classId, status, note
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              id,
              studentId,
              'AUTO_ABSENT',
              now.toISOString(),
              'AUTO',
              classInfo.academyId || null,
              classInfo.id,
              'ABSENT',
              '자동 결석 처리'
            ).run();

            results.push({
              classId: classInfo.id,
              className: classInfo.name,
              studentId,
              status: 'ABSENT',
              time: now.toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`Error processing class ${classInfo.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} students, ${absentCount} marked as absent`,
        processedCount,
        absentCount,
        results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Auto-absence processing error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process auto-absence",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// GET: 오늘 결석 처리가 필요한 학생 목록 조회 (미리보기)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().substring(0, 5);
    const today = now.toISOString().split('T')[0];

    const classes = await DB.prepare(
      `SELECT * FROM classes WHERE isActive = 1`
    ).all();

    const needsAbsence: any[] = [];

    for (const classInfo of classes.results || []) {
      try {
        if (!classInfo.schedules) continue;
        
        const schedules = JSON.parse(classInfo.schedules);
        const todaySchedule = schedules.find((schedule: any) => 
          schedule.dayOfWeek && schedule.dayOfWeek.includes(currentDay)
        );

        if (!todaySchedule || !todaySchedule.endTime) continue;
        if (currentTime < todaySchedule.endTime) continue;

        let studentIds: number[] = [];
        if (classInfo.studentIds) {
          studentIds = JSON.parse(classInfo.studentIds);
        }

        for (const studentId of studentIds) {
          const attendanceRecord = await DB.prepare(
            `SELECT * FROM attendance_records 
             WHERE userId = ? AND classId = ? AND date(checkInTime) = ?`
          ).bind(studentId, classInfo.id, today).first();

          if (!attendanceRecord) {
            const student = await DB.prepare(
              "SELECT id, name, email FROM users WHERE id = ?"
            ).bind(studentId).first();

            needsAbsence.push({
              classId: classInfo.id,
              className: classInfo.name,
              studentId,
              studentName: student?.name,
              studentEmail: student?.email,
              scheduleTime: todaySchedule.startTime
            });
          }
        }
      } catch (error) {
        console.error(`Error checking class ${classInfo.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: needsAbsence.length,
        students: needsAbsence
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Preview error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to preview",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
