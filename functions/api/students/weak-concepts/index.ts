interface Env {
  DB: D1Database;
}

interface HomeworkSubmission {
  id: string;
  userId: number;
  score: number;
  subject: string;
  feedback: string;
  strengths: string;
  suggestions: string;
  weaknessTypes: string | string[];
  detailedAnalysis: string;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  gradedAt: string;
}

interface WeakConcept {
  concept: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  relatedTopics: string[];
  evidence: string;
}

interface DailyProgress {
  date: string;
  score: number;
  subject: string;
  status: string;
  note: string;
}

/**
 * POST /api/students/weak-concepts
 * 숙제 제출 데이터를 기반으로 학생의 부족한 개념 분석
 * Gemini API 없이 기존 채점 데이터에서 직접 분석
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Analyzing weak concepts from homework for student:', studentId);

    // 1. 학생의 숙제 제출 내역 가져오기 (최근 30개)
    let homeworkSubmissions: HomeworkSubmission[] = [];
    
    try {
      const query = `
        SELECT 
          hs.id,
          hs.userId,
          hs.submittedAt,
          hg.score,
          hg.subject,
          hg.feedback,
          hg.strengths,
          hg.suggestions,
          hg.weaknessTypes,
          hg.detailedAnalysis,
          hg.totalQuestions,
          hg.correctAnswers,
          hg.gradedAt
        FROM homework_submissions_v2 hs
        LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
        WHERE hs.userId = ? AND hg.score IS NOT NULL
        ORDER BY hs.submittedAt DESC
        LIMIT 30
      `;
      
      const result = await DB.prepare(query).bind(parseInt(studentId)).all();
      homeworkSubmissions = result.results as any[] || [];
      console.log(`✅ Found ${homeworkSubmissions.length} homework submissions for student ${studentId}`);
      
      if (homeworkSubmissions.length > 0) {
        console.log(`📋 Sample homework data:`, JSON.stringify(homeworkSubmissions[0], null, 2));
      }
    } catch (dbError: any) {
      console.error('❌ Database query error:', dbError.message);
      homeworkSubmissions = [];
    }

    // 2. 숙제 제출 내역이 없는 경우
    if (homeworkSubmissions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          weakConcepts: [],
          summary: "분석할 숙제 제출 내역이 없습니다.",
          recommendations: [{
            concept: "숙제 제출",
            action: "숙제를 제출하여 학습 상태를 분석받으세요."
          }],
          dailyProgress: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. 채점 데이터에서 직접 부족한 개념 추출
    const weakConceptsMap = new Map<string, { count: number; descriptions: string[], submissions: string[] }>();
    const allSubjects = new Set<string>();
    let totalScore = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;

    homeworkSubmissions.forEach((hw, index) => {
      if (hw.subject) allSubjects.add(hw.subject);
      totalScore += hw.score || 0;
      totalCorrect += hw.correctAnswers || 0;
      totalQuestions += hw.totalQuestions || 0;

      // weaknessTypes 파싱 (배열 또는 JSON 문자열)
      let weaknesses: string[] = [];
      if (hw.weaknessTypes) {
        try {
          if (typeof hw.weaknessTypes === 'string') {
            // JSON 배열 문자열인 경우
            if (hw.weaknessTypes.startsWith('[')) {
              weaknesses = JSON.parse(hw.weaknessTypes);
            } else {
              // 쉼표로 구분된 문자열인 경우
              weaknesses = hw.weaknessTypes.split(',').map(w => w.trim()).filter(w => w.length > 0);
            }
          } else if (Array.isArray(hw.weaknessTypes)) {
            weaknesses = hw.weaknessTypes;
          }
        } catch (e) {
          console.warn('Failed to parse weaknessTypes:', hw.weaknessTypes);
          weaknesses = [];
        }
      }

      // 각 약점 유형별로 집계
      weaknesses.forEach(weakness => {
        if (!weakConceptsMap.has(weakness)) {
          weakConceptsMap.set(weakness, { count: 0, descriptions: [], submissions: [] });
        }
        const data = weakConceptsMap.get(weakness)!;
        data.count += 1;
        if (hw.suggestions && !data.descriptions.includes(hw.suggestions)) {
          data.descriptions.push(hw.suggestions);
        }
        data.submissions.push(`숙제 ${index + 1}`);
      });
    });

    // 4. 부족한 개념 리스트 생성 (빈도순으로 정렬, 최대 5개)
    const weakConcepts: WeakConcept[] = Array.from(weakConceptsMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([concept, data]) => {
        const severity: 'high' | 'medium' | 'low' = 
          data.count >= 3 ? 'high' : data.count >= 2 ? 'medium' : 'low';
        
        return {
          concept,
          description: data.descriptions.join(' ').slice(0, 200) || `${concept}에 대한 이해가 부족합니다.`,
          severity,
          relatedTopics: Array.from(allSubjects),
          evidence: data.submissions.join(', ')
        };
      });

    // 5. 학습 개선 방안 생성
    const recommendations = weakConcepts.slice(0, 3).map(wc => ({
      concept: wc.concept,
      action: `${wc.concept} 개념을 복습하고, 관련 문제를 반복 연습하세요. 특히 ${wc.evidence}에서 나타난 실수를 분석하고 개선하세요.`
    }));

    // 6. 매일 학습 기록 생성
    const dailyProgress: DailyProgress[] = homeworkSubmissions.slice(0, 10).map((hw, idx) => {
      const prevScore = idx < homeworkSubmissions.length - 1 ? homeworkSubmissions[idx + 1].score : hw.score;
      const status = hw.score > prevScore ? '개선됨' : hw.score === prevScore ? '유지' : '하락';
      
      return {
        date: hw.submittedAt?.split(' ')[0] || 'N/A',
        score: hw.score || 0,
        subject: hw.subject || 'N/A',
        status,
        note: `${hw.correctAnswers || 0}/${hw.totalQuestions || 0} 정답`
      };
    });

    // 7. 전반적인 요약 생성
    const avgScore = totalScore / homeworkSubmissions.length;
    const avgCorrectRate = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100) : 0;
    const subjects = Array.from(allSubjects).join(', ');
    
    const summary = `평균 점수 ${avgScore.toFixed(1)}점 (정답률 ${avgCorrectRate.toFixed(1)}%). ` +
      `최근 ${homeworkSubmissions.length}개의 ${subjects} 숙제를 분석했습니다. ` +
      (weakConcepts.length > 0 
        ? `특히 ${weakConcepts[0].concept}에서 반복적인 실수가 나타났습니다.`
        : `전반적으로 양호한 학습 상태입니다.`);

    console.log(`✅ Analysis complete: ${weakConcepts.length} weak concepts found`);

    return new Response(
      JSON.stringify({
        success: true,
        weakConcepts,
        summary,
        recommendations,
        dailyProgress,
        homeworkCount: homeworkSubmissions.length,
        averageScore: avgScore.toFixed(1),
        correctRate: avgCorrectRate.toFixed(1)
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Weak concepts analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "부족한 개념 분석 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
