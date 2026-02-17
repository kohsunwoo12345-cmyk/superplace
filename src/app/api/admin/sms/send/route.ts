import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { senderId, receivers, message, reserveTime } = body;

    if (!senderId || !receivers || !message) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요." },
        { status: 400 }
      );
    }

    // 메시지 타입 결정
    const byteSize = new Blob([message]).size;
    const messageType = byteSize > 90 ? "LMS" : "SMS";

    // 요금 계산 (예시)
    const costPerMessage = messageType === "LMS" ? 50 : 20;
    const totalCost = costPerMessage * receivers.length;

    // TODO: 실제 SMS 발송 로직 (Aligo API 등)
    // 현재는 시뮬레이션

    // 발송 이력 저장 (실제로는 DB에 저장)
    const logs = receivers.map((receiver: any) => ({
      id: Date.now() + Math.random(),
      receiver_name: receiver.name,
      receiver_phone: receiver.phone,
      message,
      message_type: messageType,
      status: "success", // 실제로는 API 응답에 따라 결정
      cost: costPerMessage,
      sent_at: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: `${receivers.length}건의 문자가 발송되었습니다.`,
      totalCost,
      logs,
    });
  } catch (error) {
    console.error("SMS 발송 오류:", error);
    return NextResponse.json(
      { error: "SMS 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
