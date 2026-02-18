// Cloudflare Pages Function
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

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

    return new Response(
      JSON.stringify({
        success: true,
        folders: folders.results || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("폴더 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "폴더 목록 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "폴더 이름을 입력해주세요." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = context.env.DB;
    const id = `folder_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db
      .prepare(
        `INSERT INTO LandingPageFolder (id, name, description, createdById, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(id, name.trim(), description || null, "admin")
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "폴더가 생성되었습니다.",
        folder: { id, name: name.trim(), description },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("폴더 생성 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "폴더 생성 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequestPut(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const { id, name, description } = body;

    if (!id || !name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "필수 항목이 누락되었습니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = context.env.DB;

    await db
      .prepare(
        `UPDATE LandingPageFolder 
        SET name = ?, description = ?, updatedAt = datetime('now')
        WHERE id = ?`
      )
      .bind(name.trim(), description || null, id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "폴더가 수정되었습니다.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("폴더 수정 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "폴더 수정 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequestDelete(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "폴더 ID가 필요합니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = context.env.DB;

    // Check if folder has pages
    const pagesResult = await db
      .prepare(`SELECT COUNT(*) as count FROM LandingPage WHERE folderId = ?`)
      .bind(id)
      .first();

    if (pagesResult && (pagesResult.count as number) > 0) {
      return new Response(
        JSON.stringify({
          error: "폴더에 랜딩페이지가 있어 삭제할 수 없습니다.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await db.prepare(`DELETE FROM LandingPageFolder WHERE id = ?`).bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "폴더가 삭제되었습니다.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("폴더 삭제 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "폴더 삭제 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
