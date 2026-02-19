import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// SMS 템플릿 목록 조회
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

    // 템플릿 목록 조회
    const templates = await db
      .prepare(`
        SELECT 
          t.*,
          u.name as creator_name
        FROM SMSTemplate t
        LEFT JOIN User u ON t.createdById = u.id
        ORDER BY t.createdAt DESC
      `)
      .all();

    return NextResponse.json({
      success: true,
      templates: templates.results || [],
    });
  } catch (error: unknown) {
    console.error("템플릿 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// SMS 템플릿 생성
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
    const { title, content, folder_id } = body;

    // 필수 입력 검증
    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용을 입력해주세요" }, { status: 400 });
    }

    const templateId = generateId();
    const now = new Date().toISOString();

    // 템플릿 생성
    await db
      .prepare(`
        INSERT INTO SMSTemplate (
          id, title, content, folder_id, createdById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        templateId,
        title,
        content,
        folder_id || null,
        session.userId,
        now,
        now
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "템플릿이 생성되었습니다",
      templateId,
    });
  } catch (error: unknown) {
    console.error("템플릿 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
