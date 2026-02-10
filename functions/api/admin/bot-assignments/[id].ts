// API: 봇 할당 삭제
// DELETE /api/admin/bot-assignments/[id]

interface Env {
  DB: D1Database;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const assignmentId = context.params.id as string;

    if (!assignmentId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "할당 ID가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 할당 삭제
    const result = await db
      .prepare("DELETE FROM bot_assignments WHERE id = ?")
      .bind(assignmentId)
      .run();

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "할당을 찾을 수 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "봇 할당이 취소되었습니다",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("봇 할당 삭제 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 할당 취소 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
