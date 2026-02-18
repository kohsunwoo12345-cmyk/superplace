// Cloudflare Pages Function
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(JSON.stringify({ error: "slug가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

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
      return new Response(
        JSON.stringify({ error: "랜딩페이지를 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
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
