/**
 * POST /api/students/clear-weak-concepts-cache
 * 학생의 부족한 개념 분석 캐시 삭제 (관리자용)
 */

interface Env {
  DB: D1Database;
}

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

    console.log('🗑️ Clearing cached weak concepts for student:', studentId);

    const result = await DB.prepare(`
      DELETE FROM student_weak_concepts WHERE studentId = ?
    `).bind(parseInt(studentId)).run();

    console.log('✅ Cache cleared successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: "캐시가 삭제되었습니다. 부족한 개념 분석을 다시 실행해주세요.",
        deleted: result.meta?.changes || 0
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Clear cache error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "캐시 삭제 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
