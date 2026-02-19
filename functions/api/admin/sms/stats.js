// GET /api/admin/sms/stats - SMS 통계 조회
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const db = env.DB;

    // 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "인증 토큰이 필요합니다" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    
    // 토큰 검증
    const session = await db
      .prepare("SELECT * FROM Session WHERE token = ? AND expiresAt > datetime('now')")
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: "유효하지 않은 토큰입니다" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 총 발송 건수
    const totalSentResult = await db
      .prepare("SELECT COUNT(*) as count FROM SMSLog WHERE status = 'success'")
      .first();
    const totalSent = totalSentResult?.count || 0;

    // 이번 달 발송 건수
    const thisMonthResult = await db
      .prepare(`
        SELECT COUNT(*) as count FROM SMSLog 
        WHERE status = 'success' 
        AND strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')
      `)
      .first();
    const thisMonth = thisMonthResult?.count || 0;

    // 포인트 잔액
    const balanceResult = await db
      .prepare("SELECT balance FROM SMSBalance WHERE id = 'default'")
      .first();
    const balance = balanceResult?.balance || 0;

    // 템플릿 수
    const templatesResult = await db
      .prepare("SELECT COUNT(*) as count FROM SMSTemplate")
      .first();
    const templates = templatesResult?.count || 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalSent,
          thisMonth,
          balance,
          templates,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("SMS 통계 조회 오류:", error);
    return new Response(
      JSON.stringify({ error: "서버 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
