export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

// Cloudflare D1 database binding type
interface Env {
  DB: D1Database;
}

// GET: 폴더 목록 조회
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

    // Get all folders with page count
    const folders = await db
      .prepare(
        `SELECT 
          f.id, f.name, f.description, f.createdAt, f.updatedAt,
          COUNT(lp.id) as pagesCount
        FROM LandingPageFolder f
        LEFT JOIN LandingPage lp ON lp.folderId = f.id AND lp.isActive = 1
        GROUP BY f.id
        ORDER BY f.createdAt DESC`
      )
      .all();

    return NextResponse.json({
      success: true,
      folders: folders.results || [],
    });
  } catch (error: any) {
    console.error("폴더 목록 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "폴더 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 폴더 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "폴더 이름을 입력해주세요." },
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

    const id = `folder_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db
      .prepare(
        `INSERT INTO LandingPageFolder (id, name, description, createdById, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(id, name.trim(), description || null, 'admin') // TODO: Get actual user ID
      .run();

    return NextResponse.json({
      success: true,
      message: "폴더가 생성되었습니다.",
      folder: { id, name: name.trim(), description },
    });
  } catch (error: any) {
    console.error("폴더 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "폴더 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 폴더 수정
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { error: "필수 항목이 누락되었습니다." },
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

    await db
      .prepare(
        `UPDATE LandingPageFolder 
        SET name = ?, description = ?, updatedAt = datetime('now')
        WHERE id = ?`
      )
      .bind(name.trim(), description || null, id)
      .run();

    return NextResponse.json({
      success: true,
      message: "폴더가 수정되었습니다.",
    });
  } catch (error: any) {
    console.error("폴더 수정 오류:", error);
    return NextResponse.json(
      { error: error.message || "폴더 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 폴더 삭제
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "폴더 ID가 필요합니다." },
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

    // Check if folder has pages
    const pagesResult = await db
      .prepare(`SELECT COUNT(*) as count FROM LandingPage WHERE folderId = ?`)
      .bind(id)
      .first();

    if (pagesResult && (pagesResult.count as number) > 0) {
      return NextResponse.json(
        { error: "폴더에 랜딩페이지가 있어 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    await db
      .prepare(`DELETE FROM LandingPageFolder WHERE id = ?`)
      .bind(id)
      .run();

    return NextResponse.json({
      success: true,
      message: "폴더가 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("폴더 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "폴더 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
