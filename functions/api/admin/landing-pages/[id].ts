// Cloudflare Pages Function
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
  params: { id: string };
}) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = context.params;
    const db = context.env.DB;

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
      return new Response(
        JSON.stringify({ error: "랜딩페이지를 찾을 수 없습니다." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
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
      inputData: landingPage.inputData
        ? JSON.parse(landingPage.inputData as string)
        : [],
      pixelScripts: pixelScripts.results || [],
      showQrCode: landingPage.showQrCode === 1,
      isActive: landingPage.isActive === 1,
    };

    return new Response(
      JSON.stringify({
        success: true,
        landingPage: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("랜딩페이지 상세 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "랜딩페이지 상세 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequestDelete(context: {
  request: Request;
  env: Env;
  params: { id: string };
}) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = context.params;
    const db = context.env.DB;

    // Delete landing page (cascades to submissions and pixel scripts)
    await db.prepare(`DELETE FROM LandingPage WHERE id = ?`).bind(id).run();

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
