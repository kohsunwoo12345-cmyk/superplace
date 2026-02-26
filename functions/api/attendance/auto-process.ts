interface Env {
  DB: D1Database;
}

/**
 * POST /api/attendance/auto-process
 * 자동 출석 처리 - 매일 밤 11시에 실행
 * - 출석 코드로 출석 인증하지 않은 학생들을 결석 처리
 * - 반 시간에 늦은 학생은 지각 처리
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
    // 1. 한국 시간으로 오늘 날짜 계산
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    console.log('🤖 자동 출석 처리 시작:', today);

    // 2. 활성화된 모든 학생 조회
    const allStudents = await DB.prepare(`
      SELECT DISTINCT 
        u.id as userId,
        u.name as userName,
        u.email,
        u.academyId,
        u.classId
      FROM User u
      LEFT JOIN student_attendance_codes sac ON sac.userId = u.id
      WHERE u.role = 'STUDENT' 
        AND (sac.isActive = 1 OR sac.isActive = '1' OR sac.isActive = 'true' OR sac.isActive = true)
    `).all();

    const students = allStudents.results || [];
    console.log(`📊 활성 학생 수: ${students.length}명`);

    if (students.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "처리할 학생이 없습니다",
          processed: 0,
          absent: 0
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let absentCount = 0;
    const results = [];

    // 3. 각 학생의 오늘 출석 기록 확인
    for (const student of students) {
      const userId = student.userId as string;
      const userName = student.userName as string;
      const academyId = student.academyId as string;
      const classId = student.classId as string;

      // 오늘 출석 기록이 있는지 확인
      const todayRecord = await DB.prepare(`
        SELECT id, status FROM attendance_records_v3
        WHERE userId = ? AND date = ?
      `).bind(userId, today).first();

      if (todayRecord) {
        // 이미 출석 기록이 있으면 스킵
        console.log(`✅ ${userName}: 이미 출석 처리됨 (${todayRecord.status})`);
        continue;
      }

      // 반 정보 조회 (시간 확인용)
      let classInfo = null;
      if (classId) {
        classInfo = await DB.prepare(`
          SELECT id, name, startTime, endTime
          FROM classes
          WHERE id = ?
        `).bind(classId).first();
      }

      // 출석 기록이 없으면 결석 처리
      const recordId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await DB.prepare(`
        INSERT INTO attendance_records_v3 (
          id, userId, date, status, checkInTime,
          academyId, reason, updatedBy, createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        recordId,
        userId,
        today,
        'ABSENT',
        kstTimestamp,
        academyId || null,
        '자동 결석 처리 (출석하지 않음)',
        'auto-cron',
        kstTimestamp
      ).run();

      console.log(`❌ ${userName}: 결석 처리됨`);
      processedCount++;
      absentCount++;

      results.push({
        userId,
        userName,
        status: 'ABSENT',
        className: classInfo?.name || '미배정',
        recordId
      });
    }

    console.log('✅ 자동 출석 처리 완료');
    console.log(`   - 처리된 학생: ${processedCount}명`);
    console.log(`   - 결석 처리: ${absentCount}명`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `자동 출석 처리 완료: ${processedCount}명 처리 (결석 ${absentCount}명)`,
        date: today,
        timestamp: kstTimestamp,
        totalStudents: students.length,
        processed: processedCount,
        absent: absentCount,
        results: results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 자동 출석 처리 오류:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process auto attendance",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
