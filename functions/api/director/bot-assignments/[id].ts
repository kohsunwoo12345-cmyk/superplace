interface Env {
  DB: D1Database;
}

// DELETE: 봇 할당 삭제
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const assignmentId = context.params.id as string;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🗑️ Deleting director bot assignment:', assignmentId);

    // 할당 삭제
    await DB.prepare(`
      DELETE FROM director_bot_assignments
      WHERE id = ?
    `).bind(assignmentId).run();

    console.log('✅ Director bot assignment deleted');

    return new Response(
      JSON.stringify({
        success: true,
        message: "할당이 삭제되었습니다"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to delete assignment:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete assignment",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
