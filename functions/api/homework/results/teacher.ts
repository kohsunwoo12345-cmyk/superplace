interface Env {
  DB: D1Database;
}

// 한국 날짜 (KST) 생성 함수
function getKoreanDate(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // URL에서 파라미터 추출
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");

    const today = getKoreanDate();

    // 학원의 모든 숙제 제출 조회 - homework_submissions_v2 및 homework_gradings_v2 테이블 사용
    let query = `
      SELECT 
        hs.id,
        hs.userId,
        u.name as userName,
        u.email as userEmail,
        hg.score,
        hg.feedback,
        hg.subject,
        hg.completion,
        hg.effort,
        hs.submittedAt,
        hg.gradedAt,
        hs.imageUrl,
        hg.strengths,
        hg.suggestions
      FROM homework_submissions_v2 hs
      JOIN users u ON hs.userId = u.id
      LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
      WHERE 1=1
    `;

    const bindings: any[] = [];

    if (academyId) {
      query += ` AND u.academyId = ?`;
      bindings.push(parseInt(academyId));
    }

    query += ` ORDER BY hs.submittedAt DESC LIMIT 100`;

    const submissions = await DB.prepare(query).bind(...bindings).all();

    // 통계 계산
    const totalSubmissions = submissions.results?.length || 0;
    const averageScore =
      totalSubmissions > 0
        ? (submissions.results || []).reduce(
            (sum: number, s: any) => sum + (s.score || 0),
            0
          ) / totalSubmissions
        : 0;

    const todaySubmissions = (submissions.results || []).filter((s: any) =>
      s.submittedAt && s.submittedAt.startsWith(today)
    ).length;

    // 검토 대기 (점수가 60점 미만인 경우)
    const pendingReview = (submissions.results || []).filter(
      (s: any) => s.score && s.score < 60
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        submissions: submissions.results || [],
        stats: {
          totalSubmissions,
          averageScore: Math.round(averageScore),
          todaySubmissions,
          pendingReview,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get teacher homework results error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get homework results",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
