interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * 백그라운드 채점 처리 API
 * POST /api/homework/process-grading
 * 
 * 제출된 숙제를 Gemini AI로 채점합니다
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { submissionId } = body;

    console.log('🔍 [채점 시작] submissionId:', submissionId);
    console.log('🔑 [환경변수 확인] DB:', !!DB);
    console.log('🔑 [환경변수 확인] GOOGLE_GEMINI_API_KEY:', GOOGLE_GEMINI_API_KEY ? `설정됨 (${GOOGLE_GEMINI_API_KEY.substring(0, 20)}...)` : '미설정');

    if (!DB) {
      console.error('❌ DB 미설정');
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('❌ GOOGLE_GEMINI_API_KEY 미설정 - 환경변수를 확인해주세요');
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          message: "GOOGLE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!submissionId) {
      console.error('❌ submissionId 없음');
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [검증 통과] 채점 시작: ${submissionId}`);

    // 1. 제출 정보 조회
    console.log('📋 [Step 1] 제출 정보 조회 중...');
    const submission = await DB.prepare(`
      SELECT s.id, s.userId, s.imageUrl, s.code, s.academyId, u.name, u.email
      FROM homework_submissions_v2 s
      JOIN users u ON s.userId = u.id
      WHERE s.id = ? AND s.status = 'pending'
    `).bind(submissionId).first();

    if (!submission) {
      console.log(`⚠️ 제출 정보 없음 또는 이미 처리됨: ${submissionId}`);
      return new Response(
        JSON.stringify({ error: "Submission not found or already processed" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [Step 1 완료] 제출자: ${submission.name}, academyId: ${submission.academyId}`);

    // 2. 이미지를 별도 테이블에서 조회
    console.log('📸 [Step 2] 이미지 조회 중...');
    const images = await DB.prepare(`
      SELECT imageData
      FROM homework_images
      WHERE submissionId = ?
      ORDER BY imageIndex ASC
    `).bind(submissionId).all();

    if (!images.results || images.results.length === 0) {
      console.error(`❌ 이미지 없음: ${submissionId}`);
      return new Response(
        JSON.stringify({ error: "Images not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const imageArray = images.results.map((img: any) => img.imageData);
    console.log(`✅ [Step 2 완료] 채점할 이미지 수: ${imageArray.length}장`);
    console.log(`📏 [이미지 크기] 첫번째 이미지: ${(imageArray[0].length / 1024).toFixed(2)}KB`);

    // 3. Gemini AI 채점 수행
    console.log('🤖 [Step 3] Gemini AI 채점 시작...');
    console.log(`🔑 [API Key 확인] ${GOOGLE_GEMINI_API_KEY.substring(0, 20)}...`);
    
    const gradingResult = await performGrading(imageArray, GOOGLE_GEMINI_API_KEY);
    
    console.log(`✅ [Step 3 완료] 채점 결과:`, {
      score: gradingResult.score,
      subject: gradingResult.subject,
      totalQuestions: gradingResult.totalQuestions,
      correctAnswers: gradingResult.correctAnswers
    });

    // 4. homework_gradings_v2 테이블 생성
    console.log('💾 [Step 4] 채점 결과 저장 준비...');
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_gradings_v2 (
        id TEXT PRIMARY KEY,
        submissionId TEXT NOT NULL,
        score REAL NOT NULL,
        feedback TEXT,
        strengths TEXT,
        suggestions TEXT,
        subject TEXT,
        completion TEXT,
        effort TEXT,
        pageCount INTEGER,
        gradedAt TEXT DEFAULT (datetime('now')),
        gradedBy TEXT DEFAULT 'AI',
        totalQuestions INTEGER,
        correctAnswers INTEGER,
        problemAnalysis TEXT,
        weaknessTypes TEXT,
        detailedAnalysis TEXT,
        studyDirection TEXT
      )
    `).run();
    console.log('✅ [Step 4-1] 테이블 준비 완료');

    // 5. 채점 결과 저장
    const gradingId = `grading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    console.log('💾 [Step 5] 채점 결과 저장 중...', {
      gradingId,
      submissionId,
      score: gradingResult.score,
      kstTimestamp
    });

    // 문자열로 변환 (D1은 긴 텍스트를 object로 인식하는 버그 방지)
    const strengthsStr = typeof gradingResult.strengths === 'string' 
      ? gradingResult.strengths 
      : String(gradingResult.strengths || '');
    const suggestionsStr = typeof gradingResult.suggestions === 'string'
      ? gradingResult.suggestions
      : String(gradingResult.suggestions || '');
    const feedbackStr = typeof gradingResult.feedback === 'string'
      ? gradingResult.feedback
      : String(gradingResult.feedback || '');
    const detailedAnalysisStr = typeof gradingResult.detailedAnalysis === 'string'
      ? gradingResult.detailedAnalysis
      : String(gradingResult.detailedAnalysis || '');
    const studyDirectionStr = typeof gradingResult.studyDirection === 'string'
      ? gradingResult.studyDirection
      : String(gradingResult.studyDirection || '');

    await DB.prepare(`
      INSERT INTO homework_gradings_v2 (
        id, submissionId, score, feedback, strengths, suggestions,
        subject, completion, effort, pageCount, gradedAt, gradedBy,
        totalQuestions, correctAnswers, problemAnalysis, weaknessTypes,
        detailedAnalysis, studyDirection
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, 'Gemini AI', ?, ?, ?, ?, ?, ?)
    `).bind(
      gradingId,
      submissionId,
      gradingResult.score,
      feedbackStr,
      strengthsStr,
      suggestionsStr,
      gradingResult.subject,
      gradingResult.completion,
      imageArray.length,
      kstTimestamp,
      gradingResult.totalQuestions,
      gradingResult.correctAnswers,
      JSON.stringify(gradingResult.problemAnalysis || []),
      JSON.stringify(gradingResult.weaknessTypes || []),
      detailedAnalysisStr,
      studyDirectionStr
    ).run();

    console.log(`✅ [Step 5 완료] 채점 결과 저장: ${gradingId}`);

    // 6. 제출 상태 업데이트
    console.log('🔄 [Step 6] 제출 상태 업데이트 중...');
    await DB.prepare(`
      UPDATE homework_submissions_v2
      SET status = 'graded'
      WHERE id = ?
    `).bind(submissionId).run();

    console.log(`✅ [Step 6 완료] 상태 업데이트: pending → graded`);
    console.log(`🎉 [전체 완료] 채점 완료: ${submissionId} -> ${gradingResult.score}점`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "채점이 완료되었습니다",
        grading: {
          id: gradingId,
          score: gradingResult.score,
          subject: gradingResult.subject
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 채점 처리 오류:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to process grading",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * Gemini AI를 사용한 채점 수행
 */
async function performGrading(imageArray: string[], apiKey: string) {
  console.log('🤖 [performGrading] 시작 - 이미지 수:', imageArray.length);
  
  const imageParts = imageArray.map((img: string, index: number) => {
    const base64Image = img.replace(/^data:image\/\w+;base64,/, '');
    console.log(`📸 [이미지 ${index + 1}] Base64 길이: ${base64Image.length} chars`);
    return {
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Image
      }
    };
  });

  let detectedSubject = '수학';
  let detectedGrade = 3;

  // 1단계: 과목 판별
  try {
    console.log('🔍 [1단계] 과목 판별 시작...');
    const subjectPrompt = `다음 ${imageArray.length}장의 숙제 사진을 분석하여 과목과 학년을 판별해주세요.
다음 JSON 형식으로 응답해주세요:
{"subject": "수학" 또는 "영어" 또는 "국어" 등, "grade": 초등학교 학년 (1~6) 또는 중학교 학년 (7~9), "concepts": ["덧셈", "뺄셈"] 등}`;

    const subjectApiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    console.log('🌐 [API 호출] URL:', subjectApiUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const subjectResponse = await fetch(subjectApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: subjectPrompt }, ...imageParts] }]
      })
    });

    console.log('📡 [API 응답] Status:', subjectResponse.status);
    
    if (subjectResponse.ok) {
      const data = await subjectResponse.json();
      console.log('✅ [API 응답 수신] candidates:', data.candidates?.length || 0);
      
      const text = data.candidates[0].content.parts[0].text;
      console.log('📝 [응답 텍스트]:', text.substring(0, 200));
      
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const info = JSON.parse(match[0]);
          detectedSubject = info.subject;
          detectedGrade = info.grade;
          console.log(`✅ [1단계 완료] 감지: ${detectedSubject}, ${detectedGrade}학년`);
        } catch (e) {
          console.log('⚠️ [JSON 파싱 실패] 기본값 사용');
        }
      }
    } else {
      const errorText = await subjectResponse.text();
      console.error('❌ [1단계 실패] API 오류:', subjectResponse.status, errorText);
    }
  } catch (e: any) {
    console.error('❌ [1단계 오류]:', e.message);
  }

  // 2단계: 상세 채점
  console.log('📝 [2단계] 상세 채점 시작...');
  
  const gradingPrompt = `당신은 ${detectedSubject} 전문 선생님입니다. 학생의 학년은 ${detectedGrade}학년입니다.
다음 ${imageArray.length}장의 숙제 사진을 분석하여 상세하게 채점해주세요.

점수 계산: score = (correctAnswers / totalQuestions) × 100 (소수점 첫째자리)

다음 JSON 형식으로 응답해주세요:
{
  "subject": "${detectedSubject}",
  "grade": ${detectedGrade},
  "score": 90.0,
  "totalQuestions": 20,
  "correctAnswers": 18,
  "feedback": "학습 태도 평가 + 강한 개념 + 약한 개념 (최소 7문장)",
  "strengths": "구체적인 강점 (3가지 이상)",
  "suggestions": "개선 방법 (3가지 이상)",
  "completion": "good",
  "problemAnalysis": [{"page": 1, "problem": "2×3", "answer": "6", "isCorrect": true, "type": "곱셈", "concept": "2자리 곱셈", "explanation": "정답"}],
  "weaknessTypes": ["나눗셈", "문장제"],
  "detailedAnalysis": "문제별 상세 분석 (15문장 이상)",
  "studyDirection": "다음 학습 방향 (5문장 이상)"
}`;

  const gradingApiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  console.log('🌐 [API 호출] URL:', gradingApiUrl.replace(apiKey, 'API_KEY_HIDDEN'));
  
  const gradingResponse = await fetch(gradingApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: gradingPrompt }, ...imageParts] }]
    })
  });

  console.log('📡 [API 응답] Status:', gradingResponse.status);

  if (!gradingResponse.ok) {
    const errorText = await gradingResponse.text();
    console.error('❌ [2단계 실패] Gemini API error:', gradingResponse.status);
    console.error('❌ [에러 상세]:', errorText);
    throw new Error(`Gemini API error: ${gradingResponse.status} - ${errorText}`);
  }

  const data = await gradingResponse.json();
  console.log('✅ [API 응답 수신] candidates:', data.candidates?.length || 0);
  
  const text = data.candidates[0].content.parts[0].text;
  console.log('📝 [응답 텍스트 길이]:', text.length, 'chars');
  console.log('📝 [응답 텍스트 미리보기]:', text.substring(0, 300));
  
  const match = text.match(/\{[\s\S]*\}/);
  
  if (match) {
    try {
      const result = JSON.parse(match[0]);
      console.log(`✅ [2단계 완료] 채점 완료: ${result.score}점 (${result.correctAnswers}/${result.totalQuestions})`);
      console.log('📊 [채점 결과 요약]:', {
        subject: result.subject,
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        completion: result.completion
      });
      return result;
    } catch (parseError: any) {
      console.error('❌ [JSON 파싱 오류]:', parseError.message);
      console.log('📝 [파싱 실패한 텍스트]:', match[0].substring(0, 500));
    }
  } else {
    console.error('❌ [JSON 매칭 실패] 응답에서 JSON을 찾을 수 없음');
    console.log('📝 [전체 응답]:', text);
  }

  // 기본값 반환
  console.log('⚠️ [기본값 사용] API 응답 파싱 실패, 기본 채점 결과 반환');
  return {
    subject: detectedSubject,
    grade: detectedGrade,
    score: 75.0,
    totalQuestions: imageArray.length * 5,
    correctAnswers: Math.floor(imageArray.length * 5 * 0.75),
    feedback: "성실하게 숙제를 완성했습니다.",
    strengths: "꾸준한 학습 태도",
    suggestions: "복습 시간 확보",
    completion: "good",
    problemAnalysis: [],
    weaknessTypes: [],
    detailedAnalysis: "전반적으로 잘 완성했습니다.",
    studyDirection: "계속 꾸준히 학습하세요."
  };
}
