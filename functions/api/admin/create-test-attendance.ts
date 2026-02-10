interface Env {
  DB: D1Database;
}

/**
 * 테스트용 출석 데이터 생성 API
 * POST /api/admin/create-test-attendance
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🎯 테스트 출석 데이터 생성 시작');

    // 1. attendance_records 테이블 확인 및 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        attendanceCode TEXT,
        checkInTime TEXT DEFAULT (datetime('now')),
        checkInType TEXT DEFAULT 'CODE',
        academyId INTEGER,
        classId TEXT,
        status TEXT DEFAULT 'PRESENT',
        note TEXT
      )
    `).run();

    console.log('✅ attendance_records 테이블 확인');

    // 2. 학생 목록 조회 (academyId=1인 학생들)
    const students = await DB.prepare(`
      SELECT id, name, email, academyId 
      FROM users 
      WHERE role = 'STUDENT' 
      AND (CAST(academyId AS TEXT) = '1' OR CAST(academyId AS TEXT) = '1.0' OR academyId = 1)
      LIMIT 10
    `).all();

    console.log(`✅ 학생 ${students.results?.length || 0}명 조회`);

    if (!students.results || students.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: '학생이 없습니다. academyId=1인 학생을 먼저 생성하세요.',
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. 각 학생에 대해 이번 달 출석 데이터 생성 (2-5일 랜덤)
    let totalCreated = 0;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    for (const student of students.results) {
      const attendanceDays = Math.floor(Math.random() * 4) + 2; // 2-5일
      console.log(`📝 학생 ${student.name} (ID: ${student.id})에 ${attendanceDays}일 출석 생성`);

      for (let i = 0; i < attendanceDays; i++) {
        // 이번 달의 랜덤한 날짜 생성
        const day = Math.floor(Math.random() * currentDate.getDate()) + 1;
        const checkInDate = new Date(currentYear, currentMonth, day, 9, 0, 0);
        
        const id = `attendance-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          await DB.prepare(`
            INSERT INTO attendance_records (
              id, userId, attendanceCode, checkInTime, checkInType, 
              academyId, classId, status, note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            student.id,
            'TEST-CODE',
            checkInDate.toISOString(),
            'TEST',
            student.academyId || 1,
            'TEST-CLASS',
            'PRESENT',
            '테스트 출석 데이터'
          ).run();
          
          totalCreated++;
        } catch (insertError: any) {
          // 중복 데이터 무시
          if (!insertError.message.includes('UNIQUE')) {
            console.error('❌ 출석 데이터 삽입 실패:', insertError.message);
          }
        }
      }
    }

    console.log(`✅ 총 ${totalCreated}개의 출석 데이터 생성 완료`);

    // 4. 생성된 데이터 확인
    const verifyResult = await DB.prepare(`
      SELECT 
        u.id as userId,
        u.name as userName,
        COUNT(DISTINCT DATE(ar.checkInTime)) as attendanceDays
      FROM users u
      LEFT JOIN attendance_records ar ON u.id = ar.userId
      WHERE u.role = 'STUDENT'
      AND (CAST(u.academyId AS TEXT) = '1' OR CAST(u.academyId AS TEXT) = '1.0' OR u.academyId = 1)
      GROUP BY u.id, u.name
      ORDER BY attendanceDays DESC
      LIMIT 10
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: `테스트 출석 데이터 ${totalCreated}개 생성 완료`,
        studentsCount: students.results.length,
        totalAttendanceRecords: totalCreated,
        verification: verifyResult.results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 테스트 출석 데이터 생성 오류:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create test attendance data",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
