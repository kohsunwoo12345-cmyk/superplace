import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// 전체 등록 신청 조회 (관리자만)
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

    // 사용자 정보 조회 (관리자 권한 확인)
    const user = await db
      .prepare("SELECT * FROM User WHERE id = ?")
      .bind(session.userId)
      .first();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    // 모든 등록 신청 조회 (신청자 정보 포함)
    const registrations = await db
      .prepare(`
        SELECT 
          r.*,
          u.name as createdBy_name,
          u.email as createdBy_email
        FROM SMSRegistration r
        LEFT JOIN User u ON r.createdById = u.id
        ORDER BY r.createdAt DESC
      `)
      .all();

    // 결과 포맷팅
    const formattedRegistrations = (registrations.results || []).map((reg: any) => ({
      ...reg,
      createdBy: {
        name: reg.createdBy_name,
        email: reg.createdBy_email,
      },
    }));

    return NextResponse.json({
      success: true,
      registrations: formattedRegistrations,
    });
  } catch (error: unknown) {
    console.error("SMS 등록 전체 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
