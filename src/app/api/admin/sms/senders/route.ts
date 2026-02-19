import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";


// 승인된 발신번호 목록 조회
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

    // 승인된 발신번호 목록 조회
    const senders = await db
      .prepare(`
        SELECT 
          s.id,
          s.phone_number,
          s.description,
          s.verified,
          s.createdAt
        FROM SMSSender s
        WHERE s.verified = 1
        ORDER BY s.createdAt DESC
      `)
      .all();

    return NextResponse.json({
      success: true,
      senders: senders.results || [],
    });
  } catch (error: unknown) {
    console.error("발신번호 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
