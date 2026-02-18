export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

// Cloudflare D1 database binding type
interface Env {
  DB: D1Database;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, data } = body;

    if (!slug || !data) {
      return NextResponse.json(
        { error: "필수 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const env = process.env as unknown as Env;
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

    // Get landing page ID
    const landingPage = await db
      .prepare(`SELECT id FROM LandingPage WHERE slug = ? AND isActive = 1`)
      .bind(slug)
      .first();

    if (!landingPage) {
      return NextResponse.json(
        { error: "랜딩페이지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Insert submission
    await db
      .prepare(
        `INSERT INTO LandingPageSubmission 
        (id, landingPageId, slug, data, ipAddress, userAgent, submittedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        id,
        landingPage.id,
        slug,
        JSON.stringify(data),
        ipAddress,
        userAgent
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "신청이 완료되었습니다.",
      submission_id: id,
    });
  } catch (error: any) {
    console.error("폼 제출 오류:", error);
    return NextResponse.json(
      { error: error.message || "폼 제출 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 신청자 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    const env = process.env as unknown as Env;
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

    let query = `
      SELECT 
        s.id, s.slug, s.data, s.ipAddress, s.userAgent, s.submittedAt,
        lp.title as landingPageTitle
      FROM LandingPageSubmission s
      LEFT JOIN LandingPage lp ON s.landingPageId = lp.id
    `;

    if (slug) {
      query += ` WHERE s.slug = ?`;
    }

    query += ` ORDER BY s.submittedAt DESC`;

    const result = slug
      ? await db.prepare(query).bind(slug).all()
      : await db.prepare(query).all();

    // Parse JSON data
    const submissions = (result.results || []).map((sub: any) => ({
      ...sub,
      data: JSON.parse(sub.data),
    }));

    return NextResponse.json({
      success: true,
      submissions,
      total: submissions.length,
    });
  } catch (error: any) {
    console.error("신청자 목록 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "신청자 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
