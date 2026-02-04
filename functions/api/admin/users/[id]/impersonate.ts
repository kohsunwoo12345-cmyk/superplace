interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 사용자 정보 조회
    const user = await DB.prepare(
      `SELECT id, email, name, role, academyId FROM users WHERE id = ?`
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 임시 토큰 생성
    const token = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 활동 로그 기록
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await DB.prepare(`
      INSERT INTO user_activity_logs (
        id, userId, action, details, ip, createdAt
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      logId,
      userId,
      "ADMIN_IMPERSONATE",
      "관리자가 이 계정으로 로그인함",
      context.request.headers.get("CF-Connecting-IP") || "unknown"
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        user,
        token,
        message: "Impersonation successful",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to impersonate user",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
