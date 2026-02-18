export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// Cloudflare D1 database binding type
interface Env {
  DB: D1Database;
}

// GET: 랜딩페이지 조회 (slug 기반)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug가 필요합니다." },
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

    // Get landing page
    const landingPage = await db
      .prepare(
        `SELECT 
          lp.*,
          u.name as studentName,
          f.name as folderName
        FROM LandingPage lp
        LEFT JOIN User u ON lp.studentId = u.id
        LEFT JOIN LandingPageFolder f ON lp.folderId = f.id
        WHERE lp.slug = ? AND lp.isActive = 1`
      )
      .bind(slug)
      .first();

    if (!landingPage) {
      return NextResponse.json(
        { error: "랜딩페이지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Increment view count
    await db
      .prepare(`UPDATE LandingPage SET viewCount = viewCount + 1 WHERE slug = ?`)
      .bind(slug)
      .run();

    // Get pixel scripts
    const pixelScripts = await db
      .prepare(
        `SELECT * FROM LandingPagePixelScript 
        WHERE landingPageId = ? AND isActive = 1
        ORDER BY scriptType`
      )
      .bind(landingPage.id)
      .all();

    // Parse JSON fields
    const result = {
      ...landingPage,
      inputData: landingPage.inputData ? JSON.parse(landingPage.inputData as string) : [],
      pixelScripts: pixelScripts.results || [],
      showQrCode: landingPage.showQrCode === 1,
      isActive: landingPage.isActive === 1,
    };

    return NextResponse.json({
      success: true,
      landingPage: result,
    });
  } catch (error: any) {
    console.error("랜딩페이지 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "랜딩페이지 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
