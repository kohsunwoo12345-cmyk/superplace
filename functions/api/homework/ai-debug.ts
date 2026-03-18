interface Env {
  DB: D1Database;
}

/**
 * AI 응답 디버그 데이터 조회
 * GET /api/homework/ai-debug?submissionId=xxx
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const submissionId = url.searchParams.get('submissionId');

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let query = `SELECT * FROM ai_response_debug`;
    const params: string[] = [];

    if (submissionId) {
      query += ` WHERE submissionId = ?`;
      params.push(submissionId);
    }

    query += ` ORDER BY createdAt DESC LIMIT 10`;

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        count: result.results?.length || 0,
        responses: result.results || []
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ AI 디버그 조회 오류:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to get AI debug data",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
