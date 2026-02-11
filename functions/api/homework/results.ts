interface Env {
  DB: D1Database;
}

/**
 * 숙제 제출 결과 조회 API (관리자/학원장/선생님용)
 * GET /api/homework/results
 * Query Parameters:
 * - date: YYYY-MM-DD (특정 날짜 조회, 기본값: 오늘)
 * - startDate: YYYY-MM-DD (기간 시작)
 * - endDate: YYYY-MM-DD (기간 종료)
 * - role: ADMIN, PRINCIPAL, TEACHER
 * - academyId: 학원 ID (학원장/선생님용)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    
    // 쿼리 파라미터 추출
    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const role = url.searchParams.get('role') || 'ADMIN';
    const academyId = url.searchParams.get('academyId');
    const email = url.searchParams.get('email');

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📊 숙제 결과 조회:', { date, startDate, endDate, role, academyId, email });

    // 관리자 여부 확인
    // 1. role이 ADMIN이거나
    // 2. email이 admin@superplace.co.kr이면 관리자
    const isAdmin = role === 'ADMIN' || email === 'admin@superplace.co.kr';

    // 날짜 필터 조건 생성
    let dateFilter = '';
    if (date) {
      // 특정 날짜 조회
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) = '${date}'`;
    } else if (startDate && endDate) {
      // 기간 조회
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      // 기본값: 오늘 날짜 (한국 시간 KST 기준)
      const now = new Date();
      const kstOffset = 9 * 60; // 한국 시간은 UTC+9
      const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
      const today = kstDate.toISOString().split('T')[0];
      console.log('🇰🇷 한국 시간 기준 오늘:', today);
      dateFilter = `AND SUBSTR(hs.submittedAt, 1, 10) = '${today}'`;
    }

    // academyId 필터 (관리자가 아닌 경우)
    let academyFilter = '';
    if (!isAdmin && academyId) {
      academyFilter = `AND u.academyId = ${parseInt(academyId)}`;
    }

    // 숙제 제출 및 채점 결과 조회
    const query = `
      SELECT 
        hs.id as submissionId,
        hs.userId,
        u.name as userName,
        u.email as userEmail,
        u.academyId,
        hs.submittedAt,
        hs.code,
        hs.imageUrl,
        hg.id as gradingId,
        hg.score,
        hg.feedback,
        hg.strengths,
        hg.suggestions,
        hg.subject,
        hg.completion,
        hg.effort,
        hg.pageCount,
        hg.gradedAt,
        hg.totalQuestions,
        hg.correctAnswers,
        hg.problemAnalysis,
        hg.weaknessTypes,
        hg.detailedAnalysis,
        hg.studyDirection
      FROM homework_submissions_v2 hs
      LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
      LEFT JOIN users u ON u.id = hs.userId
      WHERE 1=1
      ${dateFilter}
      ${academyFilter}
      ORDER BY hs.submittedAt DESC
    `;

    console.log('🔍 실행 쿼리:', query);

    const result = await DB.prepare(query).all();
    const submissions = result.results || [];

    console.log(`✅ 조회된 숙제: ${submissions.length}개`);

    // 통계 계산
    const now = new Date();
    const kstOffset = 9 * 60; // 한국 시간 UTC+9
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstDate.toISOString().split('T')[0];
    
    const stats = {
      totalSubmissions: submissions.length,
      averageScore: submissions.length > 0 
        ? submissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / submissions.length 
        : 0,
      todaySubmissions: submissions.filter((s: any) => {
        return s.submittedAt && s.submittedAt.startsWith(today);
      }).length,
      pendingReview: submissions.filter((s: any) => !s.gradingId).length,
    };

    // 결과 포맷팅
    const formattedSubmissions = submissions.map((s: any) => {
      // imageUrl이 JSON 배열이면 파싱, 아니면 기존 로직 사용
      let imageCount = 1;
      try {
        const parsed = JSON.parse(s.imageUrl || '[]');
        imageCount = Array.isArray(parsed) ? parsed.length : 1;
      } catch {
        // 기존 형식 "N images" 처리
        imageCount = s.imageUrl ? parseInt(s.imageUrl.split(' ')[0]) || 1 : 1;
      }
      
      return {
        id: s.submissionId,
        userId: s.userId,
        userName: s.userName || '알 수 없음',
        userEmail: s.userEmail || '',
        academyId: s.academyId,
        code: s.code,
        imageUrl: s.imageUrl,
        imageCount: imageCount,
        score: s.score || 0,
        feedback: s.feedback || '',
        strengths: s.strengths || '',
        suggestions: s.suggestions || '',
        subject: s.subject || 'Homework',
        completion: s.completion || 'pending',
        effort: s.effort || 0,
        pageCount: s.pageCount || 0,
        submittedAt: s.submittedAt || '',
        gradedAt: s.gradedAt || '',
        totalQuestions: s.totalQuestions || 0,
        correctAnswers: s.correctAnswers || 0,
        problemAnalysis: s.problemAnalysis ? JSON.parse(s.problemAnalysis) : [],
        weaknessTypes: s.weaknessTypes ? JSON.parse(s.weaknessTypes) : [],
        // Gemini AI가 생성한 상세 분석 사용
        detailedAnalysis: s.detailedAnalysis || s.feedback || '',
        weaknesses: s.weaknessTypes ? JSON.parse(s.weaknessTypes) : [],
        conceptsNeeded: extractConcepts(s.weaknessTypes),
        mistakes: extractMistakes(s.problemAnalysis),
        suggestionsArray: s.suggestions ? s.suggestions.split('\n').filter(Boolean) : [],
        studyDirection: s.studyDirection || generateStudyDirection(s.score, s.weaknessTypes)
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        submissions: formattedSubmissions,
        stats,
        query: {
          date,
          startDate,
          endDate,
          role,
          academyId,
          isAdmin
        }
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    );

  } catch (error: any) {
    console.error("❌ 숙제 결과 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "숙제 결과 조회 중 오류가 발생했습니다",
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
};

// 필요한 개념 추출
function extractConcepts(weaknessTypesJson: string | null): string[] {
  if (!weaknessTypesJson) return [];
  try {
    const types = JSON.parse(weaknessTypesJson);
    return types.map((type: string) => `${type} 개념 복습`);
  } catch {
    return [];
  }
}

// 실수 추출
function extractMistakes(problemAnalysisJson: string | null): string[] {
  if (!problemAnalysisJson) return [];
  try {
    const analysis = JSON.parse(problemAnalysisJson);
    return analysis
      .filter((p: any) => !p.isCorrect)
      .map((p: any) => `${p.problem} 문제: ${p.answer} (정답이 아님)`);
  } catch {
    return [];
  }
}

// 학습 방향 생성
function generateStudyDirection(score: number, weaknessTypesJson: string | null): string {
  if (score >= 90) {
    return "현재 수준을 잘 유지하고 있습니다. 심화 문제에 도전해보세요.";
  } else if (score >= 70) {
    const types = weaknessTypesJson ? JSON.parse(weaknessTypesJson) : [];
    if (types.length > 0) {
      return `${types.join(', ')} 부분을 집중적으로 복습하면 더 높은 점수를 받을 수 있습니다.`;
    }
    return "꾸준히 학습하면 더 높은 점수를 받을 수 있습니다.";
  } else {
    return "기본 개념부터 천천히 복습하는 것을 권장합니다. 선생님과 상담이 필요할 수 있습니다.";
  }
}
