import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";


// 등록 신청 승인
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;
    const registrationId = params.id;

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

    // 등록 신청 조회
    const registration = await db
      .prepare("SELECT * FROM SMSRegistration WHERE id = ?")
      .bind(registrationId)
      .first();

    if (!registration) {
      return NextResponse.json({ error: "등록 신청을 찾을 수 없습니다" }, { status: 404 });
    }

    if (registration.status !== "pending") {
      return NextResponse.json({ error: "이미 처리된 신청입니다" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 신청 승인
    await db
      .prepare(`
        UPDATE SMSRegistration 
        SET status = 'approved', 
            approvedById = ?, 
            approvedAt = ?,
            updatedAt = ?
        WHERE id = ?
      `)
      .bind(session.userId, now, now, registrationId)
      .run();

    // SMSSender에 발신번호 등록
    const senderId = `sender-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(`
        INSERT INTO SMSSender (
          id, phone_number, description, verified, createdById, createdAt, updatedAt
        ) VALUES (?, ?, ?, 1, ?, ?, ?)
      `)
      .bind(
        senderId,
        registration.phone_number,
        `${registration.company_name} - ${registration.representative_name}`,
        session.userId,
        now,
        now
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "등록 신청이 승인되었습니다",
    });
  } catch (error: unknown) {
    console.error("SMS 등록 승인 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
