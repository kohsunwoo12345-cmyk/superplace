interface Env {
  DB: D1Database;
}

/**
 * 숙제 제출 이력 조회 API
 * GET /api/homework/history?userId=123
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 숙제 제출 및 채점 이력 조회
    const history = await DB.prepare(`
      SELECT 
        hs.id,
        hs.userId,
        hs.attendanceId,
        hs.submittedAt,
        hs.status,
        hg.score,
        hg.feedback,
        hg.strengths,
        hg.suggestions,
        hg.subject,
        hg.completion,
        hg.effort,
        hg.pageCount,
        hg.gradedAt,
        hg.gradedBy
      FROM homework_submissions hs
      LEFT JOIN homework_gradings hg ON hg.submissionId = hs.id
      WHERE hs.userId = ?
      ORDER BY hs.submittedAt DESC
      LIMIT 50
    `).bind(userId).all();

    return new Response(
      JSON.stringify({
        success: true,
        history: history.results,
        count: history.results.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Homework history error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch homework history",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
