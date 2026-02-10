interface Env {
  DB: D1Database;
}

/**
 * POST /api/admin/add-student-code-column
 * users 테이블에 student_code 컬럼 추가
 */
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
    console.log('🔧 Adding student_code column to users table...');

    // student_code 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE users ADD COLUMN student_code TEXT
      `).run();
      
      console.log('✅ student_code column added successfully');
    } catch (alterError: any) {
      // 컬럼이 이미 존재하는 경우 무시
      if (alterError.message.includes('duplicate column name')) {
        console.log('⚠️ student_code column already exists');
      } else {
        throw alterError;
      }
    }

    // 기존 학생들에게 자동으로 코드 생성
    console.log('🔄 Generating codes for existing students...');
    
    const students = await DB.prepare(`
      SELECT id FROM users WHERE UPPER(role) = 'STUDENT'
    `).all();

    let generatedCount = 0;
    for (const student of (students.results || [])) {
      const studentId = (student as any).id;
      const timestamp = Date.now().toString(36).toUpperCase();
      const studentCode = `STU-${studentId}-${timestamp}`;
      
      await DB.prepare(`
        UPDATE users SET student_code = ? WHERE id = ?
      `).bind(studentCode, studentId).run();
      
      generatedCount++;
    }

    console.log(`✅ Generated ${generatedCount} student codes`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `student_code 컬럼 추가 및 ${generatedCount}개 코드 생성 완료`,
        generatedCount: generatedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Add student_code column error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "컬럼 추가 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
