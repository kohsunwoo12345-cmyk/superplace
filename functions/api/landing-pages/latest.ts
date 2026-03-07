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

    // 학생 ID로 학생 정보 조회
    const student = await env.DB.prepare(`
      SELECT id, name, academyId FROM students WHERE id = ?
    `)
      .bind(studentId)
      .first();

    if (!student) {
      return new Response(
        JSON.stringify({ 
          url: null,
          message: "학생을 찾을 수 없습니다" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 해당 학원의 최신 랜딩페이지 조회 (학생별 필터링은 나중에 추가 가능)
    const landingPage = await env.DB.prepare(`
      SELECT * FROM landing_pages
      WHERE academyId = ?
      ORDER BY createdAt DESC
      LIMIT 1
    `)
      .bind(student.academyId)
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

    // URL 생성 (학생 ID를 쿼리 파라미터로 추가)
    const landingPageUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?student=${studentId}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: landingPageUrl,
        landingPage: {
          id: landingPage.id,
          title: landingPage.title,
          createdAt: landingPage.createdAt,
        },
        studentInfo: {
          id: student.id,
          name: student.name,
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
