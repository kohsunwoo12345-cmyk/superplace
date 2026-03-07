// Send Bulk SMS Messages
// POST /api/messages/send-bulk
// Body: { messages: Array<{ to, from, text, studentId?, studentName? }> }

interface Env {
  DB: D1Database;
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
}

interface Message {
  to: string;
  from: string;
  text: string;
  studentId?: string;
  studentName?: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  const { request, env } = context;

  try {
    // 토큰 검증
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "인증이 필요합니다" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const [userId, email, role] = token.split("|");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 토큰입니다" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { messages } = body as { messages: Message[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "발송할 메시지가 없습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 포인트 확인
    const SMS_COST = 20;
    const totalCost = messages.length * SMS_COST;

    const user = await env.DB.prepare(
      "SELECT points FROM users WHERE id = ?"
    )
      .bind(userId)
      .first();

    if (!user || (user.points as number) < totalCost) {
      return new Response(
        JSON.stringify({
          error: "포인트가 부족합니다",
          required: totalCost,
          current: user?.points || 0,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Solapi 설정
    const SOLAPI_API_KEY = env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      console.warn("⚠️ Solapi 키가 설정되지 않았습니다. 테스트 모드로 동작합니다.");
      
      // 테스트 모드: DB에만 기록
      for (const message of messages) {
        await env.DB.prepare(`
          INSERT INTO sms_logs (userId, senderNumber, recipientNumber, content, status, studentId, studentName, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)
          .bind(
            userId,
            message.from,
            message.to,
            message.text,
            'TEST_SUCCESS',
            message.studentId || null,
            message.studentName || null
          )
          .run();
      }

      // 포인트 차감
      await env.DB.prepare(
        "UPDATE users SET points = points - ? WHERE id = ?"
      )
        .bind(totalCost, userId)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          successCount: messages.length,
          failCount: 0,
          totalCost,
          mode: 'TEST',
          message: '테스트 모드로 발송되었습니다 (실제 발송되지 않음)',
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 실제 Solapi 발송
    const results = await Promise.allSettled(
      messages.map(async (message) => {
        try {
          // Solapi API 호출
          const response = await fetch("https://api.solapi.com/messages/v4/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`,
            },
            body: JSON.stringify({
              message: {
                to: message.to.replace(/-/g, ""),
                from: message.from.replace(/-/g, ""),
                text: message.text,
              },
            }),
          });

          const result = await response.json();

          // DB에 로그 저장
          await env.DB.prepare(`
            INSERT INTO sms_logs (userId, senderNumber, recipientNumber, content, status, statusMessage, studentId, studentName, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
            .bind(
              userId,
              message.from,
              message.to,
              message.text,
              response.ok ? 'SUCCESS' : 'FAILED',
              response.ok ? 'Sent' : result.error || 'Unknown error',
              message.studentId || null,
              message.studentName || null
            )
            .run();

          return { success: response.ok, message };
        } catch (error: any) {
          // 실패 로그 저장
          await env.DB.prepare(`
            INSERT INTO sms_logs (userId, senderNumber, recipientNumber, content, status, statusMessage, studentId, studentName, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
            .bind(
              userId,
              message.from,
              message.to,
              message.text,
              'FAILED',
              error.message,
              message.studentId || null,
              message.studentName || null
            )
            .run();

          return { success: false, message, error: error.message };
        }
      })
    );

    // 결과 집계
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failCount = results.length - successCount;

    // 성공한 건수만큼 포인트 차감
    const actualCost = successCount * SMS_COST;
    if (successCount > 0) {
      await env.DB.prepare(
        "UPDATE users SET points = points - ? WHERE id = ?"
      )
        .bind(actualCost, userId)
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        successCount,
        failCount,
        totalCost: actualCost,
        message: `${successCount}건 발송 완료, ${failCount}건 실패`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("대량 발송 실패:", error);
    return new Response(
      JSON.stringify({
        error: "발송 실패",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
