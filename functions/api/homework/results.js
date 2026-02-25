// 숙제 제출 결과 조회 API
// GET /api/homework/results

import { getUserFromAuth } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    
    if (!DB) {
      return Response.json({ 
        success: false, 
        error: "Database not configured" 
      }, { status: 500 });
    }

    // 인증 확인
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      return Response.json({ 
        success: false, 
        error: "인증이 필요합니다" 
      }, { status: 401 });
    }

    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const role = userPayload.role?.toUpperCase();
    const academyId = userPayload.academyId;

    console.log('📊 숙제 결과 조회:', { date, startDate, endDate, role, academyId });

    // 관리자 여부 확인
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    // 날짜 필터 조건 생성
    let dateFilter = '';
    if (date) {
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) = '${date}'`;
    } else if (startDate && endDate) {
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      // 기본값: 오늘 (한국 시간)
      const now = new Date();
      const kstOffset = 9 * 60;
      const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
      const today = kstDate.toISOString().split('T')[0];
      console.log('🇰🇷 한국 시간 기준 오늘:', today);
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) = '${today}'`;
    }

    // academyId 필터 (관리자가 아닌 경우)
    let academyFilter = '';
    if (!isAdmin && academyId) {
      academyFilter = `AND (u1.academyId = '${academyId}' OR u2.academyId = '${academyId}')`;
    }

    // 숙제 제출 및 채점 결과 조회 - User와 users 테이블 모두 조회
    const query = `
      SELECT 
        hs.id as submissionId,
        hs.userId,
        COALESCE(u1.name, u2.name) as userName,
        COALESCE(u1.email, u2.email) as userEmail,
        COALESCE(u1.academyId, CAST(u2.academyId AS TEXT)) as academyId,
        COALESCE(u1.grade, u2.grade) as grade,
        hs.submittedAt,
        hs.code,
        hs.imageUrl,
        hg.id as gradingId,
        hg.score,
        hg.feedback,
        hg.strengths,
        hg.improvements,
        hg.completion,
        hg.gradedAt
      FROM homework_submissions_v2 hs
      LEFT JOIN User u1 ON u1.id = hs.userId
      LEFT JOIN users u2 ON u2.id = hs.userId
      LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
      WHERE 1=1
        ${dateFilter}
        ${academyFilter}
      ORDER BY hs.submittedAt DESC
    `;

    console.log('🔍 실행할 쿼리:', query);

    const result = await DB.prepare(query).all();
    const results = result.results || [];

    console.log(`✅ 조회 결과: ${results.length}건`);

    // 통계 계산
    const totalSubmissions = results.length;
    const gradedCount = results.filter(r => r.gradingId).length;
    const avgScore = gradedCount > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / gradedCount)
      : 0;

    // 결과 포맷팅
    const formattedResults = results.map(r => ({
      submissionId: r.submissionId,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      academyId: r.academyId,
      grade: r.grade,
      submittedAt: r.submittedAt,
      code: r.code,
      imageUrl: r.imageUrl,
      grading: r.gradingId ? {
        id: r.gradingId,
        score: r.score,
        feedback: r.feedback,
        strengths: r.strengths,
        improvements: r.improvements,
        completion: r.completion,
        gradedAt: r.gradedAt
      } : null
    }));

    return Response.json({
      success: true,
      statistics: {
        total: totalSubmissions,
        graded: gradedCount,
        pending: totalSubmissions - gradedCount,
        averageScore: avgScore
      },
      results: formattedResults
    }, { status: 200 });

  } catch (error) {
    console.error('❌ 숙제 결과 조회 에러:', error);
    return Response.json({ 
      success: false, 
      error: "서버 오류가 발생했습니다",
      message: error.message 
    }, { status: 500 });
  }
}
