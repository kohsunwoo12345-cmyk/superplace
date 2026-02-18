export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

// Cloudflare D1 database binding type
interface Env {
  DB: D1Database;
}

// GET: 랜딩페이지 목록 조회 (관리자)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const env = process.env as unknown as Env;
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

    // Get all landing pages with additional info
    const landingPages = await db
      .prepare(
        `SELECT 
          lp.id, lp.slug, lp.title, lp.subtitle, lp.templateType,
          lp.folderId, lp.showQrCode, lp.qrCodeUrl, lp.viewCount,
          lp.isActive, lp.createdAt, lp.updatedAt,
          u.name as studentName, u.id as studentId,
          f.name as folderName,
          (SELECT COUNT(*) FROM LandingPageSubmission WHERE landingPageId = lp.id) as submissions
        FROM LandingPage lp
        LEFT JOIN User u ON lp.studentId = u.id
        LEFT JOIN LandingPageFolder f ON lp.folderId = f.id
        ORDER BY lp.createdAt DESC`
      )
      .all();

    // Parse results
    const results = (landingPages.results || []).map((lp: any) => ({
      ...lp,
      url: `/lp/${lp.slug}`,
      isActive: lp.isActive === 1,
      showQrCode: lp.showQrCode === 1,
    }));

    return NextResponse.json({
      success: true,
      landingPages: results,
      total: results.length,
    });
  } catch (error: any) {
    console.error("랜딩페이지 목록 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "랜딩페이지 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 랜딩페이지 생성 (관리자)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug,
      title,
      subtitle,
      description,
      templateType = 'basic',
      templateHtml,
      inputData = [],
      ogTitle,
      ogDescription,
      thumbnail,
      folderId,
      showQrCode = true,
      qrCodePosition = 'bottom',
      pixelScripts = [],
      studentId,
    } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "필수 항목이 누락되었습니다. (slug, title)" },
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

    // Check if slug already exists
    const existing = await db
      .prepare(`SELECT id FROM LandingPage WHERE slug = ?`)
      .bind(slug)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 slug입니다." },
        { status: 400 }
      );
    }

    const id = `lp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superplace-study.pages.dev';
    const qrCodeUrl = showQrCode
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${baseUrl}/lp/${slug}`)}`
      : null;

    // Insert landing page
    await db
      .prepare(
        `INSERT INTO LandingPage (
          id, slug, title, subtitle, description, templateType, templateHtml,
          inputData, ogTitle, ogDescription, thumbnail, folderId,
          showQrCode, qrCodePosition, qrCodeUrl, pixelScripts, studentId,
          viewCount, isActive, createdById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, datetime('now'), datetime('now'))`
      )
      .bind(
        id,
        slug,
        title,
        subtitle || null,
        description || null,
        templateType,
        templateHtml || null,
        JSON.stringify(inputData),
        ogTitle || null,
        ogDescription || null,
        thumbnail || null,
        folderId || null,
        showQrCode ? 1 : 0,
        qrCodePosition,
        qrCodeUrl,
        JSON.stringify(pixelScripts),
        studentId || null,
        'admin' // TODO: Get actual user ID from auth
      )
      .run();

    // Insert pixel scripts if provided
    if (pixelScripts && Array.isArray(pixelScripts) && pixelScripts.length > 0) {
      for (const script of pixelScripts) {
        const scriptId = `ps_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await db
          .prepare(
            `INSERT INTO LandingPagePixelScript 
            (id, landingPageId, name, scriptType, scriptCode, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
          )
          .bind(
            scriptId,
            id,
            script.name,
            script.scriptType,
            script.scriptCode
          )
          .run();
      }
    }

    return NextResponse.json({
      success: true,
      message: "랜딩페이지가 생성되었습니다.",
      landingPage: {
        id,
        slug,
        url: `/lp/${slug}`,
        qrCodeUrl,
      },
    });
  } catch (error: any) {
    console.error("랜딩페이지 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "랜딩페이지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
