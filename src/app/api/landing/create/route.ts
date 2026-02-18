export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// Cloudflare D1 database binding type
interface Env {
  DB: D1Database;
}

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

    // Generate ID and QR code URL
    const id = `lp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const qrCodeUrl = showQrCode
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'https://superplace-study.pages.dev'}/lp/${slug}`)}`
      : null;

    const env = process.env as unknown as Env;
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

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
