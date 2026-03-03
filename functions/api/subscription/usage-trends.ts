// 사용량 트렌드 분석 API
// 월별/주별 사용량 통계 제공

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const period = url.searchParams.get('period') || 'weekly'; // weekly, monthly
    
    if (!academyId) {
      return new Response(JSON.stringify({ 
        error: "academyId required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log(`📊 트렌드 분석: academyId=${academyId}, period=${period}`);
    
    // ============================================
    // 현재 사용량
    // ============================================
    const currentUsage = await getCurrentUsage(DB, academyId);
    
    // ============================================
    // 기간별 트렌드 (usage_logs 활용)
    // ============================================
    let dateFormat = '';
    let groupBy = '';
    let limit = 12;
    
    if (period === 'weekly') {
      // 주별: 최근 12주
      dateFormat = "strftime('%Y-W%W', createdAt)"; // 2026-W10
      groupBy = dateFormat;
      limit = 12;
    } else if (period === 'monthly') {
      // 월별: 최근 12개월
      dateFormat = "strftime('%Y-%m', createdAt)"; // 2026-03
      groupBy = dateFormat;
      limit = 12;
    } else if (period === 'daily') {
      // 일별: 최근 30일
      dateFormat = "date(createdAt)"; // 2026-03-03
      groupBy = dateFormat;
      limit = 30;
    }
    
    // AI 분석 트렌드
    const aiTrend = await DB.prepare(`
      SELECT ${dateFormat} as period, COUNT(*) as count
      FROM usage_logs ul
      JOIN User u ON ul.userId = u.id
      WHERE u.academyId = ? AND ul.type = 'ai_analysis'
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT ?
    `).bind(academyId, limit).all();
    
    // 유사문제 트렌드
    const similarTrend = await DB.prepare(`
      SELECT ${dateFormat} as period, COUNT(*) as count
      FROM usage_logs ul
      JOIN User u ON ul.userId = u.id
      WHERE u.academyId = ? AND ul.type = 'similar_problem'
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT ?
    `).bind(academyId, limit).all();
    
    // 숙제 검사 트렌드 (gradedAt 기준)
    const homeworkTrend = await DB.prepare(`
      SELECT ${dateFormat.replace('createdAt', 'hg.gradedAt')} as period, COUNT(*) as count
      FROM homework_gradings hg
      JOIN homework_submissions hs ON hg.submissionId = hs.id
      WHERE hs.academyId = ?
      GROUP BY ${groupBy.replace('createdAt', 'hg.gradedAt')}
      ORDER BY period DESC
      LIMIT ?
    `).bind(academyId, limit).all();
    
    // 랜딩페이지 생성 트렌드
    const landingTrend = await DB.prepare(`
      SELECT ${dateFormat.replace('createdAt', 'lp.createdAt')} as period, COUNT(*) as count
      FROM landing_pages lp
      WHERE lp.academyId = ?
      GROUP BY ${groupBy.replace('createdAt', 'lp.createdAt')}
      ORDER BY period DESC
      LIMIT ?
    `).bind(academyId, limit).all();
    
    // ============================================
    // 학생 수 트렌드 (createdAt 기준으로 누적)
    // ============================================
    const studentTrend = await DB.prepare(`
      SELECT ${dateFormat.replace('createdAt', 'u.createdAt')} as period, COUNT(*) as count
      FROM User u
      WHERE u.academyId = ? AND u.role = 'STUDENT' AND u.withdrawnAt IS NULL
      GROUP BY ${groupBy.replace('createdAt', 'u.createdAt')}
      ORDER BY period DESC
      LIMIT ?
    `).bind(academyId, limit).all();
    
    return new Response(JSON.stringify({
      success: true,
      period,
      currentUsage,
      trends: {
        students: studentTrend.results.reverse(),
        homework: homeworkTrend.results.reverse(),
        aiAnalysis: aiTrend.results.reverse(),
        similarProblems: similarTrend.results.reverse(),
        landingPages: landingTrend.results.reverse()
      },
      summary: {
        totalAIAnalysis: aiTrend.results.reduce((sum: number, row: any) => sum + row.count, 0),
        totalSimilarProblems: similarTrend.results.reduce((sum: number, row: any) => sum + row.count, 0),
        totalHomework: homeworkTrend.results.reduce((sum: number, row: any) => sum + row.count, 0),
        totalLandingPages: landingTrend.results.reduce((sum: number, row: any) => sum + row.count, 0)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("트렌드 분석 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "트렌드 분석 실패",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

async function getCurrentUsage(DB: D1Database, academyId: string) {
  const studentCount = await DB.prepare(`
    SELECT COUNT(*) as count FROM User 
    WHERE academyId = ? AND role = 'STUDENT' AND withdrawnAt IS NULL
  `).bind(academyId).first();
  
  const homeworkCount = await DB.prepare(`
    SELECT COUNT(*) as count 
    FROM homework_gradings hg
    JOIN homework_submissions hs ON hg.submissionId = hs.id
    WHERE hs.academyId = ?
  `).bind(academyId).first();
  
  const aiCount = await DB.prepare(`
    SELECT COUNT(*) as count 
    FROM usage_logs ul
    JOIN User u ON ul.userId = u.id
    WHERE u.academyId = ? AND ul.type = 'ai_analysis'
  `).bind(academyId).first();
  
  const similarCount = await DB.prepare(`
    SELECT COUNT(*) as count 
    FROM usage_logs ul
    JOIN User u ON ul.userId = u.id
    WHERE u.academyId = ? AND ul.type = 'similar_problem'
  `).bind(academyId).first();
  
  const landingCount = await DB.prepare(`
    SELECT COUNT(*) as count 
    FROM landing_pages
    WHERE academyId = ?
  `).bind(academyId).first();
  
  return {
    students: studentCount?.count || 0,
    homework: homeworkCount?.count || 0,
    aiAnalysis: aiCount?.count || 0,
    similarProblems: similarCount?.count || 0,
    landingPages: landingCount?.count || 0
  };
}
