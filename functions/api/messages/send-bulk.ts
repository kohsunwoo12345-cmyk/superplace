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

    let user: any = null;
    let userPoints = 0;
    let hasPointsColumn = false;

    try {
      // points 컬럼이 있는지 확인
      const checkColumn = await env.DB.prepare("PRAGMA table_info(users)").all();
      hasPointsColumn = checkColumn.results.some((col: any) => col.name === 'points');

      if (hasPointsColumn) {
        user = await env.DB.prepare("SELECT points FROM users WHERE id = ?")
          .bind(userId)
          .first();
        userPoints = user?.points ?? 0;
      }
    } catch (error) {
      console.warn("⚠️ points 컬럼 확인 실패, 테스트 모드로 진행", error);
    }

    // points 컬럼이 없거나 포인트가 부족한 경우
    if (!hasPointsColumn) {
      console.log("ℹ️ points 컬럼이 없습니다. 테스트 모드로 진행합니다.");
    } else if (userPoints < totalCost) {
      return new Response(
        JSON.stringify({
          error: "포인트가 부족합니다",
          required: totalCost,
          current: userPoints,
          note: "관리자에게 포인트 충전을 요청하세요.",
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

      // 포인트 차감 (points 컬럼이 있는 경우에만)
      if (hasPointsColumn) {
        try {
          await env.DB.prepare(
            "UPDATE users SET points = points - ? WHERE id = ?"
          )
            .bind(totalCost, userId)
            .run();
        } catch (error) {
          console.warn("⚠️ 포인트 차감 실패 (무시)", error);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          successCount: messages.length,
          failCount: 0,
          totalCost: hasPointsColumn ? totalCost : 0,
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
    if (successCount > 0 && hasPointsColumn) {
      try {
        await env.DB.prepare(
          "UPDATE users SET points = points - ? WHERE id = ?"
        )
          .bind(actualCost, userId)
          .run();
      } catch (error) {
        console.warn("⚠️ 포인트 차감 실패 (테스트 모드일 수 있음)", error);
      }
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
