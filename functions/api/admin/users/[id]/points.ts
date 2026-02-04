interface Env {
  DB: D1Database;
}

// 포인트 지급/차감 API
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;
    const body = await context.request.json();
    const { amount, reason, type } = body; // type: 'add' or 'subtract'

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!amount || !reason || !type) {
      return new Response(
        JSON.stringify({ error: "Amount, reason, and type are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 현재 포인트 조회
    const user = await DB.prepare(
      "SELECT points FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentPoints = user.points || 0;
    const pointsChange = type === 'add' ? amount : -amount;
    const newPoints = Math.max(0, currentPoints + pointsChange);

    // 포인트 업데이트
    await DB.prepare(
      "UPDATE users SET points = ? WHERE id = ?"
    ).bind(newPoints, userId).run();

    // 포인트 변경 이력 저장
    await DB.prepare(
      `INSERT INTO user_activity_logs (
        id, userId, action, details, createdAt
      ) VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(
      `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type === 'add' ? 'POINTS_ADD' : 'POINTS_SUBTRACT',
      JSON.stringify({ 
        amount: Math.abs(pointsChange), 
        reason, 
        before: currentPoints, 
        after: newPoints 
      })
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `포인트가 ${type === 'add' ? '지급' : '차감'}되었습니다.`,
        points: {
          before: currentPoints,
          change: pointsChange,
          after: newPoints
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Points update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update points",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
