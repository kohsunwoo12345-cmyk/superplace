interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 사용자의 모든 숙제 제출 기록 조회 (최신순)
    const history = await DB.prepare(`
      SELECT 
        id,
        userId,
        userName,
        academyId,
        attendanceRecordId,
        score,
        feedback,
        strengths,
        suggestions,
        subject,
        completion,
        effort,
        pageCount,
        submittedAt,
        gradedAt
      FROM homework_submissions
      WHERE userId = ?
      ORDER BY submittedAt DESC
      LIMIT 20
    `).bind(parseInt(userId)).all();

    return new Response(
      JSON.stringify({
        success: true,
        history: history.results || [],
        count: history.results?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get homework history error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get homework history",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
