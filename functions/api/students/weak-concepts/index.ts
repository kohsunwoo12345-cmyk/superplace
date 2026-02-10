interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

interface HomeworkSubmission {
  id: string;
  userId: number;
  score: number;
  subject: string;
  feedback: string;
  strengths: string;
  suggestions: string;
  weaknessTypes: string;
  detailedAnalysis: string;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  gradedAt: string;
}

/**
 * POST /api/students/weak-concepts
 * 숙제 제출 데이터를 기반으로 학생의 부족한 개념 분석
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB, GOOGLE_GEMINI_API_KEY } = env;

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

    // 3. 숙제 데이터 분석 텍스트 생성
    const homeworkAnalysisText = homeworkSubmissions
      .slice(0, 20)
      .map((hw, index) => {
        return `
[숙제 ${index + 1}]
과목: ${hw.subject || '정보 없음'}
제출일: ${hw.submittedAt}
점수: ${hw.score || 0}점 (정답: ${hw.correctAnswers || 0}/${hw.totalQuestions || 0})
피드백: ${hw.feedback || '없음'}
강점: ${hw.strengths || '없음'}
약점: ${hw.suggestions || '없음'}
약점 유형: ${hw.weaknessTypes || '없음'}
상세 분석: ${hw.detailedAnalysis || '없음'}
`;
      })
      .join('\n---\n');

    const prompt = `당신은 학생의 학습 상태를 분석하는 교육 전문가입니다. 다음은 한 학생의 최근 숙제 제출 및 채점 결과입니다. 이 데이터를 바탕으로 학생이 부족한 개념과 개선이 필요한 점을 분석해주세요.

숙제 제출 내역 (최근 ${homeworkSubmissions.length}개):
${homeworkAnalysisText}

위 데이터를 분석하여 다음 형식의 JSON으로 응답해주세요:

{
  "summary": "학생의 전반적인 학습 상태 요약 (3-4문장). 평균 점수, 강점, 약점, 학습 패턴 등을 포함",
  "weakConcepts": [
    {
      "concept": "부족한 개념명 (예: 2차 방정식의 해법)",
      "description": "왜 이 개념이 부족한지 구체적 설명 (2-3문장)",
      "severity": "high/medium/low (빈도와 중요도 기준)",
      "relatedTopics": ["관련된 수학/과학 주제1", "주제2"],
      "evidence": "어떤 숙제에서 이 문제가 나타났는지 (예: 숙제 1, 3, 5에서 반복)"
    }
  ],
  "recommendations": [
    {
      "concept": "개념명",
      "action": "구체적이고 실천 가능한 학습 방법 (2-3문장)"
    }
  ],
  "dailyProgress": [
    {
      "date": "YYYY-MM-DD",
      "score": 85.5,
      "subject": "수학",
      "status": "개선됨/유지/하락",
      "note": "간단한 한줄 평가"
    }
  ]
}

**분석 가이드라인:**
1. 최대 5개의 부족한 개념을 찾아주세요
2. 점수가 낮거나 반복적으로 틀린 문제 유형에 집중하세요
3. 구체적이고 실용적인 학습 방법을 제안하세요
4. dailyProgress는 제출일별로 정리해서 최근 10개만 포함하세요
5. 한국어로 작성하세요`;

    // 4. Gemini API 호출
    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error('❌ GOOGLE_GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GOOGLE_GEMINI_API_KEY environment variable not configured. Please set it in Cloudflare dashboard.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use stable gemini-1.5-flash instead of experimental model
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini API for homework-based weak concept analysis...');
    console.log(`📍 Using endpoint: gemini-1.5-flash`);
    
    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    // 5. Gemini 응답 파싱
    let analysisResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      analysisResult = JSON.parse(jsonText);
      
      console.log('✅ Homework-based weak concept analysis completed successfully');
      console.log(`📊 Found ${analysisResult.weakConcepts?.length || 0} weak concepts`);
      console.log(`📈 Daily progress entries: ${analysisResult.dailyProgress?.length || 0}`);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      
      // 폴백: 간단한 분석 제공
      const avgScore = homeworkSubmissions.reduce((sum, hw) => sum + (hw.score || 0), 0) / homeworkSubmissions.length;
      const subjects = [...new Set(homeworkSubmissions.map(hw => hw.subject).filter(Boolean))];
      
      analysisResult = {
        summary: `평균 점수: ${avgScore.toFixed(1)}점. 분석된 과목: ${subjects.join(', ')}. AI 분석 중 오류가 발생했습니다.`,
        weakConcepts: [],
        recommendations: [{
          concept: "전반적인 학습",
          action: "지속적으로 숙제를 제출하여 학습 패턴을 분석받으세요."
        }],
        dailyProgress: homeworkSubmissions.slice(0, 10).map(hw => ({
          date: hw.submittedAt?.split(' ')[0] || 'N/A',
          score: hw.score || 0,
          subject: hw.subject || 'N/A',
          status: '분석 중',
          note: `${hw.correctAnswers || 0}/${hw.totalQuestions || 0} 정답`
        })),
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...analysisResult,
        homeworkCount: homeworkSubmissions.length,
        averageScore: (homeworkSubmissions.reduce((sum, hw) => sum + (hw.score || 0), 0) / homeworkSubmissions.length).toFixed(1),
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
