/**
 * DELETE /api/kakao/delete-student-cache?studentId={studentId}
 * 학생의 부족한 개념 분석 캐시 삭제 (재분석 필요 시)
 */

interface Env {
  DB: D1Database;
}

export const onRequestDelete = async (context: { request: Request; env: Env }) => {
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

    console.log('🗑️ Deleting cached analysis for student:', studentId);

    await DB.prepare(`
      DELETE FROM student_weak_concepts WHERE studentId = ?
    `).bind(parseInt(studentId)).run();

    console.log('✅ Cache deleted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: "캐시가 삭제되었습니다. 다시 분석을 실행해주세요."
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Delete cache error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "캐시 삭제 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
