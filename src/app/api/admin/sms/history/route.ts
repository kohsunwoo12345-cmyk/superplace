import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";


// SMS 발송 이력 조회
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

    // URL 파라미터에서 페이지 정보 가져오기
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // 발송 이력 조회
    const logs = await db
      .prepare(`
        SELECT 
          l.*,
          u.name as sender_name,
          u.email as sender_email
        FROM SMSLog l
        LEFT JOIN User u ON l.createdById = u.id
        ORDER BY l.createdAt DESC
        LIMIT ? OFFSET ?
      `)
      .bind(limit, offset)
      .all();

    // 전체 건수 조회
    const countResult = await db
      .prepare("SELECT COUNT(*) as count FROM SMSLog")
      .first();
    const totalCount = countResult?.count || 0;

    return NextResponse.json({
      success: true,
      logs: logs.results || [],
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error: unknown) {
    console.error("SMS 발송 이력 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
