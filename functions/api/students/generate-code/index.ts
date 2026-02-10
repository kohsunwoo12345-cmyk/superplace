interface Env {
  DB: D1Database;
}

/**
 * POST /api/students/generate-code
 * 학생의 고유 코드 생성 (QR 코드용)
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
    const { studentId } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔑 Generating student code for:', studentId);

    // 학생 코드 생성 (형식: STU-{studentId}-{timestamp})
    const timestamp = Date.now().toString(36).toUpperCase();
    const studentCode = `STU-${studentId}-${timestamp}`;

    // DB에 학생 코드 저장 (users 테이블에 student_code 컬럼이 있다고 가정)
    try {
      await DB.prepare(`
        UPDATE users
        SET student_code = ?
        WHERE id = ?
      `).bind(studentCode, parseInt(studentId)).run();
      
      console.log('✅ Student code generated and saved:', studentCode);
    } catch (dbError: any) {
      console.warn('⚠️ Failed to save student code to DB:', dbError.message);
      // DB 저장 실패해도 코드는 반환
    }

    return new Response(
      JSON.stringify({
        success: true,
        studentCode: studentCode,
        message: "학생 코드가 생성되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Generate student code error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "학생 코드 생성 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * GET /api/students/generate-code?studentId={studentId}
 * 학생의 현재 코드 조회
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Fetching student code for:', studentId);

    // DB에서 학생 코드 조회
    let studentCode = null;
    
    try {
      const result = await DB.prepare(`
        SELECT student_code as studentCode
        FROM users
        WHERE id = ?
      `).bind(parseInt(studentId)).first();
      
      studentCode = result?.studentCode || null;
      console.log('✅ Found student code:', studentCode);
    } catch (dbError: any) {
      console.warn('⚠️ Failed to fetch student code from DB:', dbError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        studentCode: studentCode,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Fetch student code error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "학생 코드 조회 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
