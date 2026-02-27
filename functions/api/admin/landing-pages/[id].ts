// Cloudflare Pages Function - 랜딩페이지 단일 조회 및 수정
interface Env {
  DB: D1Database;
}

// 토큰 파싱 함수
function parseToken(authHeader: string | null): { id: string; email: string; role: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

// GET: 단일 랜딩페이지 조회
export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;
    const { id } = context.params;

    // 랜딩페이지 조회
    const landingPage = await db
      .prepare('SELECT * FROM landing_pages WHERE id = ?')
      .bind(id)
      .first();

    if (!landingPage) {
      return new Response(JSON.stringify({ error: "Landing page not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        landingPage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("랜딩페이지 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "랜딩페이지 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// PUT: 랜딩페이지 수정
export async function onRequestPut(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;
    const { id } = context.params;
    const body = await context.request.json();

    const {
      title,
      subtitle,
      html_content,
      og_title,
      og_description,
      status,
    } = body;

    console.log("📝 Updating landing page:", id, { title, status });

    // 랜딩페이지 업데이트
    const result = await db
      .prepare(`
        UPDATE landing_pages 
        SET 
          title = ?,
          html_content = ?,
          og_title = ?,
          og_description = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        title,
        html_content,
        og_title || title,
        og_description || "",
        status || "active",
        id
      )
      .run();

    console.log("✅ Landing page updated:", result);

    // 업데이트된 데이터 조회
    const updatedPage = await db
      .prepare('SELECT * FROM landing_pages WHERE id = ?')
      .bind(id)
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "랜딩페이지가 수정되었습니다.",
        landingPage: updatedPage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("랜딩페이지 수정 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "랜딩페이지 수정 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// DELETE: 랜딩페이지 삭제
export async function onRequestDelete(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;
    const { id } = context.params;

    console.log("🗑️ Deleting landing page:", id);

    await db
      .prepare('DELETE FROM landing_pages WHERE id = ?')
      .bind(id)
      .run();

    console.log("✅ Landing page deleted");

    return new Response(
      JSON.stringify({
        success: true,
        message: "랜딩페이지가 삭제되었습니다.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("랜딩페이지 삭제 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "랜딩페이지 삭제 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
