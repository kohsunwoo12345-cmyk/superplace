interface Env {
  DB: D1Database;
}

/**
 * GET /api/reports/student?userId=X&academyId=Y
 * 학생의 보고서 목록 조회
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const academyId = url.searchParams.get('academyId');

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 학생별 보고서 또는 학원 전체 보고서 조회
    let reports;
    
    if (userId) {
      // 특정 학생의 보고서 조회
      reports = await DB.prepare(`
        SELECT 
          r.id,
          r.userId,
          r.academyId,
          r.reportType,
          r.summary,
          r.weaknesses,
          r.suggestions,
          r.averageScore,
          r.createdAt,
          u.name as studentName,
          u.email as studentEmail
        FROM student_reports r
        JOIN users u ON r.userId = u.id
        WHERE r.userId = ?
        ORDER BY r.createdAt DESC
      `).bind(userId).all();
      
    } else if (academyId) {
      // 학원 전체 학생 보고서 조회
      reports = await DB.prepare(`
        SELECT 
          r.id,
          r.userId,
          r.academyId,
          r.reportType,
          r.summary,
          r.weaknesses,
          r.suggestions,
          r.averageScore,
          r.createdAt,
          u.name as studentName,
          u.email as studentEmail
        FROM student_reports r
        JOIN users u ON r.userId = u.id
        WHERE r.academyId = ?
        ORDER BY r.createdAt DESC
        LIMIT 100
      `).bind(academyId).all();
      
    } else {
      return new Response(
        JSON.stringify({ error: "userId or academyId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 각 보고서에 대한 상세 정보 파싱
    const parsedReports = reports.results.map((report: any) => {
      try {
        return {
          ...report,
          summary: report.summary ? JSON.parse(report.summary) : null,
          weaknesses: report.weaknesses ? JSON.parse(report.weaknesses) : [],
        };
      } catch (e) {
        return report;
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        reports: parsedReports,
        count: parsedReports.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Reports fetch error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch reports",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
