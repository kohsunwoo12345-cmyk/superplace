// Cloudflare Pages Function
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json();
    const { slug, data } = body;

    if (!slug || !data) {
      return new Response(
        JSON.stringify({ error: "필수 데이터가 누락되었습니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = context.env.DB;

    // Get landing page ID
    const landingPage = await db
      .prepare(`SELECT id FROM LandingPage WHERE slug = ? AND isActive = 1`)
      .bind(slug)
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

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const ipAddress = context.request.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = context.request.headers.get("user-agent") || "unknown";

    // Insert submission
    await db
      .prepare(
        `INSERT INTO LandingPageSubmission 
        (id, landingPageId, slug, data, ipAddress, userAgent, submittedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(id, landingPage.id, slug, JSON.stringify(data), ipAddress, userAgent)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "신청이 완료되었습니다.",
        submission_id: id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("폼 제출 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "폼 제출 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
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

    const url = new URL(context.request.url);
    const slug = url.searchParams.get("slug");

    const db = context.env.DB;

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

    return new Response(
      JSON.stringify({
        success: true,
        submissions,
        total: submissions.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("신청자 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "신청자 목록 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
