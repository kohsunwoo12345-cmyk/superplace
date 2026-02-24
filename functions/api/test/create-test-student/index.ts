/**
 * POST /api/test/create-test-student
 * 테스트용 학생 및 출석 코드 생성
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. 테스트 학생 생성
    const testUserId = Math.floor(900000 + Math.random() * 100000); // 900000-999999
    const testEmail = `test${testUserId}@test.com`;
    const testName = `테스트학생${testUserId}`;
    
    // User 테이블에 추가
    await DB.prepare(`
      INSERT OR REPLACE INTO User (id, email, name, role, academyId)
      VALUES (?, ?, ?, 'STUDENT', 1)
    `).bind(testUserId, testEmail, testName).run();

    console.log('✅ Test student created:', testUserId, testName);

    // 2. 6자리 출석 코드 생성
    const attendanceCode = String(Math.floor(100000 + Math.random() * 900000));

    // 3. student_attendance_codes 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS student_attendance_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `).run();

    // 4. 출석 코드 등록
    await DB.prepare(`
      INSERT INTO student_attendance_codes (userId, code, isActive)
      VALUES (?, ?, 1)
    `).bind(testUserId, attendanceCode).run();

    console.log('✅ Attendance code created:', attendanceCode);

    return new Response(
      JSON.stringify({
        success: true,
        testStudent: {
          userId: testUserId,
          email: testEmail,
          name: testName,
          attendanceCode: attendanceCode,
        },
        instructions: {
          step1: `https://superplacestudy.pages.dev/attendance-verify 페이지로 이동`,
          step2: `출석 코드 ${attendanceCode} 입력`,
          step3: "숙제 제출 페이지로 전환되는지 확인",
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Test student creation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "테스트 학생 생성 실패",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
