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
    const userId = url.searchParams.get("userId");

    const today = getKoreanDate();

    // 학원의 모든 숙제 제출 조회 - homework_gradings_v2 테이블과 JOIN
    // LEFT JOIN으로 변경하여 사용자 정보가 없어도 제출 기록은 표시
    // users 테이블과 User 테이블 모두 조회 시도
    let query = `
      SELECT 
        hs.id,
        hs.userId,
        COALESCE(users_lower.name, users_upper.name, '알 수 없음') as userName,
        COALESCE(users_lower.email, users_upper.email, '이메일 없음') as userEmail,
        COALESCE(users_lower.academyId, users_upper.academyId, hs.academyId) as academyId,
        hs.code,
        hs.imageUrl,
        hs.submittedAt,
        hs.status,
        hg.score,
        hg.feedback,
        hg.strengths,
        hg.suggestions,
        hg.subject,
        hg.completion,
        hg.gradedAt,
        hg.gradedBy,
        hg.totalQuestions,
        hg.correctAnswers,
        hg.problemAnalysis,
        hg.weaknessTypes,
        hg.detailedAnalysis,
        hg.studyDirection
      FROM homework_submissions_v2 hs
      LEFT JOIN users users_lower ON hs.userId = CAST(users_lower.id AS TEXT)
      LEFT JOIN User users_upper ON hs.userId = users_upper.id
      LEFT JOIN homework_gradings_v2 hg ON hs.id = hg.submissionId
      WHERE 1=1
    `;

    const bindings: any[] = [];

    if (academyId) {
      query += ` AND (COALESCE(users_lower.academyId, users_upper.academyId, hs.academyId) = ?)`;
      bindings.push(parseInt(academyId));
    }

    if (userId) {
      query += ` AND hs.userId = ?`;
      bindings.push(userId);
    }

    query += ` ORDER BY hs.submittedAt DESC LIMIT 100`;

    console.log('🔍 SQL 쿼리:', query);
    console.log('🔍 바인딩:', bindings);

    const submissions = await DB.prepare(query).bind(...bindings).all();
    
    console.log(`📊 숙제 제출 ${submissions.results?.length || 0}건 조회`);
    if (submissions.results && submissions.results.length > 0) {
      console.log('📋 첫 번째 결과:', submissions.results[0]);
    }

    // 결과 가공
    const processedResults = (submissions.results || []).map((row: any) => {
      // 이미지 URL 파싱
      let imageCount = 0;
      if (row.imageUrl) {
        try {
          const images = JSON.parse(row.imageUrl);
          imageCount = Array.isArray(images) ? images.length : 1;
        } catch {
          imageCount = 1;
        }
      }
      
      // problemAnalysis와 weaknessTypes JSON 파싱
      let problemAnalysis = [];
      let weaknessTypes = [];
      
      if (row.problemAnalysis) {
        try {
          problemAnalysis = JSON.parse(row.problemAnalysis);
        } catch (e) {
          console.error('problemAnalysis 파싱 오류:', e);
        }
      }
      
      if (row.weaknessTypes) {
        try {
          weaknessTypes = JSON.parse(row.weaknessTypes);
        } catch (e) {
          console.error('weaknessTypes 파싱 오류:', e);
        }
      }
      
      return {
        submissionId: row.id,
        userId: row.userId,
        userName: row.userName,
        userEmail: row.userEmail,
        academyId: row.academyId,
        code: row.code,
        imageUrl: row.imageUrl,
        imageCount,
        submittedAt: row.submittedAt,
        status: row.status,
        grading: {
          score: row.score || 0,
          feedback: row.feedback || '',
          subject: row.subject || '미지정',
          totalQuestions: row.totalQuestions || 0,
          correctAnswers: row.correctAnswers || 0,
          problemAnalysis: problemAnalysis,
          weaknessTypes: weaknessTypes,
          strengths: row.strengths || '',
          suggestions: row.suggestions || '',
          detailedAnalysis: row.detailedAnalysis || '',
          studyDirection: row.studyDirection || '',
          gradedAt: row.gradedAt,
          gradedBy: row.gradedBy,
          completion: row.completion
        },
      };
    });
    
    // 통계 계산
    const totalSubmissions = processedResults.length;
    const averageScore =
      totalSubmissions > 0
        ? processedResults.reduce(
            (sum: number, s: any) => sum + (s.grading.score || 0),
            0
          ) / totalSubmissions
        : 0;

    const todaySubmissions = processedResults.filter((s: any) =>
      s.submittedAt && s.submittedAt.startsWith(today)
    ).length;

    // 검토 대기 (status가 'processing' 또는 'failed')
    const pendingReview = processedResults.filter(
      (s: any) => s.status === 'processing' || s.status === 'failed'
    ).length;

    console.log(`📊 통계: 전체 ${totalSubmissions}, 오늘 ${todaySubmissions}, 대기 ${pendingReview}`);

    return new Response(
      JSON.stringify({
        success: true,
        results: processedResults,
        statistics: {
          total: totalSubmissions,
          averageScore: Math.round(averageScore),
          todaySubmissions,
          pending: pendingReview,
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
