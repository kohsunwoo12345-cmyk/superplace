import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";


// SOLAPI API 설정
const SOLAPI_API_URL = "https://api.solapi.com";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// HMAC SHA256 서명 생성 (SOLAPI 인증용)
async function createSignature(apiKey: string, apiSecret: string, timestamp: string, salt: string) {
  const message = timestamp + salt;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// SMS 발송
export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    // 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // 토큰 검증
    const session = await db
      .prepare("SELECT * FROM Session WHERE token = ? AND expiresAt > datetime('now')")
      .bind(token)
      .first();

    if (!session) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { senderPhone, receivers, message, reserveTime } = body;

    // 필수 입력 검증
    if (!senderPhone || !receivers || !Array.isArray(receivers) || receivers.length === 0 || !message) {
      return NextResponse.json({ error: "필수 입력 항목을 모두 입력해주세요" }, { status: 400 });
    }

    // 발신번호 검증 (승인된 번호인지 확인)
    const sender = await db
      .prepare("SELECT * FROM SMSSender WHERE phone_number = ? AND verified = 1")
      .bind(senderPhone)
      .first();

    if (!sender) {
      return NextResponse.json({ error: "승인되지 않은 발신번호입니다" }, { status: 403 });
    }

    // SOLAPI API 키 확인
    const solapiApiKey = env.SOLAPI_API_KEY;
    const solapiApiSecret = env.SOLAPI_API_SECRET;

    if (!solapiApiKey || !solapiApiSecret) {
      return NextResponse.json({ error: "SOLAPI API 키가 설정되지 않았습니다" }, { status: 500 });
    }

    // 메시지 타입 결정 (SMS: 90바이트 이하, LMS: 90바이트 초과)
    const messageBytes = new Blob([message]).size;
    const messageType = messageBytes > 90 ? "LMS" : "SMS";

    // SOLAPI API 요청 준비
    const timestamp = Date.now().toString();
    const salt = Math.random().toString(36).substring(2, 15);
    const signature = await createSignature(solapiApiKey, solapiApiSecret, timestamp, salt);

    // 메시지 전송
    const messages = receivers.map((receiver: any) => ({
      to: receiver.phone.replace(/[^0-9]/g, ""),
      from: senderPhone.replace(/[^0-9]/g, ""),
      text: message,
      type: messageType,
      ...(receiver.name && { customFields: { name: receiver.name } }),
    }));

    // SOLAPI API 호출
    const solapiResponse = await fetch(`${SOLAPI_API_URL}/messages/v4/send-many`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `HMAC-SHA256 apiKey=${solapiApiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        messages,
        ...(reserveTime && { scheduledDate: reserveTime }),
      }),
    });

    if (!solapiResponse.ok) {
      const errorData = await solapiResponse.json();
      console.error("SOLAPI API 오류:", errorData);
      throw new Error(errorData.errorMessage || "SMS 발송 실패");
    }

    const solapiResult = await solapiResponse.json();

    // DB에 발송 로그 저장
    const now = new Date().toISOString();
    const logs = [];

    for (const receiver of receivers) {
      const logId = generateId();
      
      await db
        .prepare(`
          INSERT INTO SMSLog (
            id, sender_id, sender_phone, receiver_name, receiver_phone,
            message, message_type, status, cost, reserve_time,
            sent_at, createdById, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'success', 0, ?, ?, ?, ?)
        `)
        .bind(
          logId,
          sender.id,
          senderPhone,
          receiver.name || "Unknown",
          receiver.phone,
          message,
          messageType,
          reserveTime || null,
          now,
          session.userId,
          now
        )
        .run();

      logs.push({
        id: logId,
        receiver: receiver.phone,
        status: "success",
      });
    }

    return NextResponse.json({
      success: true,
      message: "SMS 발송이 완료되었습니다",
      messageCount: receivers.length,
      messageType,
      logs,
      solapiResult,
    });
  } catch (error: unknown) {
    console.error("SMS 발송 오류:", error);
    const errorMessage = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
