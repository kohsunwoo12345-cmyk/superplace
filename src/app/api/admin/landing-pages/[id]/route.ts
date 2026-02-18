export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

// Cloudflare D1 database binding type
interface Env {
  DB: D1Database;
}

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT: 랜딩페이지 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const {
      title,
      subtitle,
      description,
      templateType,
      templateHtml,
      inputData,
      ogTitle,
      ogDescription,
      thumbnail,
      folderId,
      showQrCode,
      qrCodePosition,
      pixelScripts,
      isActive,
    } = body;

    const env = process.env as unknown as Env;
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

    // Update landing page
    await db
      .prepare(
        `UPDATE LandingPage SET
          title = ?,
          subtitle = ?,
          description = ?,
          templateType = ?,
          templateHtml = ?,
          inputData = ?,
          ogTitle = ?,
          ogDescription = ?,
          thumbnail = ?,
          folderId = ?,
          showQrCode = ?,
          qrCodePosition = ?,
          isActive = ?,
          updatedAt = datetime('now')
        WHERE id = ?`
      )
      .bind(
        title,
        subtitle || null,
        description || null,
        templateType,
        templateHtml || null,
        JSON.stringify(inputData || []),
        ogTitle || null,
        ogDescription || null,
        thumbnail || null,
        folderId || null,
        showQrCode ? 1 : 0,
        qrCodePosition,
        isActive ? 1 : 0,
        id
      )
      .run();

    // Update pixel scripts if provided
    if (pixelScripts !== undefined) {
      // Delete existing scripts
      await db
        .prepare(`DELETE FROM LandingPagePixelScript WHERE landingPageId = ?`)
        .bind(id)
        .run();

      // Insert new scripts
      if (Array.isArray(pixelScripts) && pixelScripts.length > 0) {
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
    }

    return NextResponse.json({
      success: true,
      message: "랜딩페이지가 수정되었습니다.",
    });
  } catch (error: any) {
    console.error("랜딩페이지 수정 오류:", error);
    return NextResponse.json(
      { error: error.message || "랜딩페이지 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 랜딩페이지 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const env = process.env as unknown as Env;
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

    // Delete landing page (cascades to submissions and pixel scripts)
    await db
      .prepare(`DELETE FROM LandingPage WHERE id = ?`)
      .bind(id)
      .run();

    return NextResponse.json({
      success: true,
      message: "랜딩페이지가 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("랜딩페이지 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "랜딩페이지 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET: 랜딩페이지 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const env = process.env as unknown as Env;
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

    // Get landing page details
    const landingPage = await db
      .prepare(
        `SELECT 
          lp.*,
          u.name as studentName,
          f.name as folderName
        FROM LandingPage lp
        LEFT JOIN User u ON lp.studentId = u.id
        LEFT JOIN LandingPageFolder f ON lp.folderId = f.id
        WHERE lp.id = ?`
      )
      .bind(id)
      .first();

    if (!landingPage) {
      return NextResponse.json(
        { error: "랜딩페이지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get pixel scripts
    const pixelScripts = await db
      .prepare(
        `SELECT * FROM LandingPagePixelScript 
        WHERE landingPageId = ?
        ORDER BY scriptType`
      )
      .bind(id)
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
    console.error("랜딩페이지 상세 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "랜딩페이지 상세 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
