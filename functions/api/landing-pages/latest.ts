// Get Latest Landing Page for Student
// GET /api/landing-pages/latest?studentId={studentId}

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  const { request, env } = context;

  try {
    // 토큰 검증
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "인증이 필요합니다" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const [userId, email, role] = token.split("|");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 토큰입니다" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // studentId 파라미터 추출
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: "학생 ID가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 해당 학생의 최신 랜딩페이지 조회
    const landingPage = await env.DB.prepare(`
      SELECT * FROM landing_pages
      WHERE studentId = ?
      ORDER BY createdAt DESC
      LIMIT 1
    `)
      .bind(studentId)
      .first();

    if (!landingPage) {
      return new Response(
        JSON.stringify({ 
          url: null,
          message: "랜딩페이지가 없습니다" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // URL 생성
    const landingPageUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: landingPageUrl,
        landingPage: {
          id: landingPage.id,
          title: landingPage.title,
          createdAt: landingPage.createdAt,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("랜딩페이지 조회 실패:", error);
    return new Response(
      JSON.stringify({ 
        error: "랜딩페이지 조회 실패",
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
