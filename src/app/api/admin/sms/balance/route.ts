import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// SMS 포인트 잔액 조회
export async function GET(request: NextRequest) {
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

    // 포인트 잔액 조회
    const balance = await db
      .prepare("SELECT * FROM SMSBalance WHERE id = 'default'")
      .first();

    return NextResponse.json({
      success: true,
      balance: balance?.balance || 0,
      totalCharged: balance?.total_charged || 0,
      totalUsed: balance?.total_used || 0,
    });
  } catch (error: unknown) {
    console.error("포인트 잔액 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
