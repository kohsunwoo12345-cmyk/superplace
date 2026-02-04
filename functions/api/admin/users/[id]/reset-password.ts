interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;
    const body = await context.request.json() as any;

    const { newPassword } = body;

    if (!newPassword) {
      return new Response(
        JSON.stringify({ error: "New password is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 비밀번호 업데이트 (평문 저장 - 관리자가 볼 수 있도록)
    await DB.prepare(`
      UPDATE users 
      SET password = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(newPassword, userId).run();

    // 활동 로그 기록
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await DB.prepare(`
      INSERT INTO user_activity_logs (
        id, userId, action, details, ip, createdAt
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      logId,
      userId,
      "PASSWORD_RESET",
      "관리자에 의한 비밀번호 재설정",
      context.request.headers.get("CF-Connecting-IP") || "unknown"
    ).run();

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Password reset error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to reset password",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
