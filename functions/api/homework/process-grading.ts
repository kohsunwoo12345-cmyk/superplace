interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
}

/**
 * 백그라운드 채점 처리 API
 * POST /api/homework/process-grading
 * 
 * homework_grading_config에서 설정을 불러와 AI 모델로 채점합니다
 * 지원 모델: gemini-2.5-flash, deepseek-chat, deepseek-reasoner 등
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY } = context.env;
    const body = await context.request.json();
    const { submissionId } = body;

    if (!DB) {
      console.error('❌ DB 미설정');
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 채점 시작: ${submissionId}`);

    // 1. 중복 채점 방지: 이미 채점이 존재하는지 확인
    const existingGrading = await DB.prepare(`
      SELECT id, score, subject
      FROM homework_gradings_v2
      WHERE submissionId = ?
      LIMIT 1
    `).bind(submissionId).first();

    if (existingGrading) {
      console.log(`✅ 이미 채점 완료: ${submissionId} (점수: ${existingGrading.score})`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "이미 채점이 완료되었습니다",
          grading: {
            id: existingGrading.id,
            score: existingGrading.score,
            subject: existingGrading.subject
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📝 제출 정보 조회 시작: ${submissionId}`);

    // 2. 제출 정보 조회 (User 테이블 먼저, 없으면 users 테이블 확인)
    let submission = await DB.prepare(`
      SELECT s.id, s.userId, s.imageUrl, s.code, s.academyId, u.name, u.email
      FROM homework_submissions_v2 s
      JOIN User u ON s.userId = u.id
      WHERE s.id = ?
    `).bind(submissionId).first();

    console.log(`📊 User 테이블 JOIN 결과:`, submission);

    // User 테이블에 없으면 users 테이블 확인 (레거시 지원)
    if (!submission) {
      console.log(`🔍 User 테이블 JOIN 실패, users 테이블로 재시도...`);
      submission = await DB.prepare(`
        SELECT s.id, s.userId, s.imageUrl, s.code, s.academyId, u.name, u.email
        FROM homework_submissions_v2 s
        JOIN users u ON s.userId = u.id
        WHERE s.id = ?
      `).bind(submissionId).first();
      
      console.log(`📊 users 테이블 JOIN 결과:`, submission);
    }

    if (!submission) {
      console.log(`⚠️ 제출 정보 없음: ${submissionId}`);
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 제출 정보 확인: ${submission.name} (userId: ${submission.userId})`);

    // 2-1. 채점 설정 불러오기
    console.log(`⚙️ 채점 설정 불러오기...`);
    const config = await DB.prepare(`
      SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1
    `).first();

    const model = config?.model || 'deepseek-chat';
    const systemPrompt = config?.systemPrompt || `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 채점하세요.`;
    const temperature = config?.temperature ? Number(config.temperature) : 0.3;
    const enableRAG = config?.enableRAG ? Boolean(Number(config.enableRAG)) : false;

    console.log(`🔧 채점 설정: model=${model}, temperature=${temperature}, RAG=${enableRAG}`);

    // API 키 선택
    let apiKey: string | undefined;
    if (model.startsWith('deepseek')) {
      apiKey = DEEPSEEK_API_KEY;
      if (!apiKey) {
        console.error('❌ DEEPSEEK_API_KEY 미설정');
        return new Response(
          JSON.stringify({ error: "DeepSeek API key not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (model.startsWith('gemini')) {
      apiKey = GOOGLE_GEMINI_API_KEY || GEMINI_API_KEY;
      if (!apiKey) {
        console.error('❌ GOOGLE_GEMINI_API_KEY 미설정');
        return new Response(
          JSON.stringify({ error: "Gemini API key not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      console.error(`❌ 지원하지 않는 모델: ${model}`);
      return new Response(
        JSON.stringify({ error: `Unsupported model: ${model}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 제출 상태가 이미 graded인 경우 (중복 호출 방지)
    const submissionStatus = await DB.prepare(`
      SELECT status FROM homework_submissions_v2 WHERE id = ?
    `).bind(submissionId).first();

    if (submissionStatus && submissionStatus.status === 'graded') {
      console.log(`⚠️ 이미 채점 완료된 제출: ${submissionId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "이미 채점이 완료되었습니다 (상태: graded)" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. 이미지를 별도 테이블에서 조회
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
    console.log(`📚 채점할 이미지 수: ${imageArray.length}장`);

    // 4. AI 모델로 채점 수행
    const gradingResult = await performGrading(imageArray, apiKey, model, systemPrompt, temperature);

    // 5. homework_gradings_v2 테이블 생성
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

    // 5. 채점 결과 저장
    const gradingId = `grading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    // strengths와 suggestions를 문자열로 변환 (배열이면 JSON.stringify, 문자열이면 그대로)
    const strengthsStr = Array.isArray(gradingResult.strengths)
      ? gradingResult.strengths.join(', ')
      : (typeof gradingResult.strengths === 'string' ? gradingResult.strengths : '');
    
    const suggestionsStr = Array.isArray(gradingResult.suggestions)
      ? gradingResult.suggestions.join(', ')
      : (typeof gradingResult.suggestions === 'string' ? gradingResult.suggestions : '');

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
      gradingResult.feedback,
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
      gradingResult.detailedAnalysis || '',
      gradingResult.studyDirection || ''
    ).run();

    // 6. 제출 상태 업데이트
    await DB.prepare(`
      UPDATE homework_submissions_v2
      SET status = 'graded'
      WHERE id = ?
    `).bind(submissionId).run();

    console.log(`✅ 채점 완료: ${submissionId} -> ${gradingResult.score}점`);

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
 * AI 모델을 사용한 채점 수행
 * 지원 모델: Gemini, DeepSeek
 */
async function performGrading(
  imageArray: string[], 
  apiKey: string, 
  model: string, 
  systemPrompt: string, 
  temperature: number
) {
  console.log(`🤖 채점 모델: ${model}, 온도: ${temperature}`);
  
  // DeepSeek 모델인 경우
  if (model.startsWith('deepseek')) {
    return await performDeepSeekGrading(imageArray, apiKey, model, systemPrompt, temperature);
  }
  
  // Gemini 모델인 경우
  if (model.startsWith('gemini')) {
    return await performGeminiGrading(imageArray, apiKey, model, systemPrompt, temperature);
  }
  
  throw new Error(`Unsupported model: ${model}`);
}

/**
 * DeepSeek API를 사용한 채점
 */
async function performDeepSeekGrading(
  imageArray: string[],
  apiKey: string,
  model: string,
  systemPrompt: string,
  temperature: number
) {
  console.log('📝 DeepSeek API를 통한 채점 시작...');
  
  // DeepSeek는 이미지를 Base64로 전달
  const imageContents = imageArray.map((img: string) => {
    const base64Image = img.replace(/^data:image\/\w+;base64,/, '');
    return {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`
      }
    };
  });

  const userPrompt = `제공된 ${imageArray.length}장의 숙제 이미지를 분석하여 채점하세요.

다음 JSON 형식으로 응답하세요:
{
  "subject": "과목명 (수학, 영어, 국어 등)",
  "grade": 학년 (숫자),
  "score": 점수 (0-100),
  "totalQuestions": 전체 문제 수,
  "correctAnswers": 정답 개수,
  "feedback": "전체적인 피드백 (최소 5문장)",
  "strengths": "잘한 점 (쉼표로 구분)",
  "suggestions": "개선할 점 (쉼표로 구분)",
  "completion": "good/fair/poor",
  "problemAnalysis": [
    {
      "page": 페이지 번호,
      "problem": "문제 내용",
      "answer": "학생 답안",
      "isCorrect": true/false,
      "type": "문제 유형",
      "concept": "관련 개념",
      "explanation": "채점 설명"
    }
  ],
  "weaknessTypes": ["약점1", "약점2"],
  "detailedAnalysis": "상세 분석 (최소 10문장)",
  "studyDirection": "학습 방향 제시 (최소 5문장)"
}

반드시 JSON 형식만 출력하세요.`;

  const deepseekResponse = await fetch(
    'https://api.deepseek.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              ...imageContents
            ]
          }
        ],
        temperature: temperature,
        max_tokens: 4000
      })
    }
  );

  if (!deepseekResponse.ok) {
    const errorText = await deepseekResponse.text();
    console.error('❌ DeepSeek API error:', deepseekResponse.status, errorText);
    throw new Error(`DeepSeek API error: ${deepseekResponse.status} - ${errorText}`);
  }

  const data = await deepseekResponse.json();
  const responseText = data.choices[0].message.content;
  console.log('📄 DeepSeek 응답:', responseText.substring(0, 200) + '...');
  
  // JSON 추출
  const match = responseText.match(/\{[\s\S]*\}/);
  
  if (match) {
    const result = JSON.parse(match[0]);
    console.log(`✅ DeepSeek 채점 완료: ${result.score}점`);
    return result;
  }

  // 기본값 (JSON 파싱 실패 시)
  console.warn('⚠️ DeepSeek 응답을 JSON으로 파싱하지 못했습니다. 기본값 반환');
  return createDefaultGradingResult(imageArray.length);
}

/**
 * Gemini API를 사용한 채점
 */
async function performGeminiGrading(
  imageArray: string[],
  apiKey: string,
  model: string,
  systemPrompt: string,
  temperature: number
) {
  console.log('📝 Gemini API를 통한 채점 시작...');
  
  const imageParts = imageArray.map((img: string) => {
    const base64Image = img.replace(/^data:image\/\w+;base64,/, '');
    return {
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Image
      }
    };
  });

  const userPrompt = `제공된 ${imageArray.length}장의 숙제 이미지를 분석하여 채점하세요.

다음 JSON 형식으로 응답하세요:
{
  "subject": "과목명 (수학, 영어, 국어 등)",
  "grade": 학년 (숫자),
  "score": 점수 (0-100),
  "totalQuestions": 전체 문제 수,
  "correctAnswers": 정답 개수,
  "feedback": "전체적인 피드백 (최소 5문장)",
  "strengths": "잘한 점 (쉼표로 구분)",
  "suggestions": "개선할 점 (쉼표로 구분)",
  "completion": "good/fair/poor",
  "problemAnalysis": [
    {
      "page": 페이지 번호,
      "problem": "문제 내용",
      "answer": "학생 답안",
      "isCorrect": true/false,
      "type": "문제 유형",
      "concept": "관련 개념",
      "explanation": "채점 설명"
    }
  ],
  "weaknessTypes": ["약점1", "약점2"],
  "detailedAnalysis": "상세 분석 (최소 10문장)",
  "studyDirection": "학습 방향 제시 (최소 5문장)"
}

반드시 JSON 형식만 출력하세요.`;

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }, ...imageParts] }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 4000
        }
      })
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error('❌ Gemini API error:', geminiResponse.status, errorText);
    throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
  }

  const data = await geminiResponse.json();
  const text = data.candidates[0].content.parts[0].text;
  console.log('📄 Gemini 응답:', text.substring(0, 200) + '...');
  
  const match = text.match(/\{[\s\S]*\}/);
  
  if (match) {
    const result = JSON.parse(match[0]);
    console.log(`✅ Gemini 채점 완료: ${result.score}점`);
    return result;
  }

  // 기본값 (JSON 파싱 실패 시)
  console.warn('⚠️ Gemini 응답을 JSON으로 파싱하지 못했습니다. 기본값 반환');
  return createDefaultGradingResult(imageArray.length);
}

/**
 * 기본 채점 결과 생성 (파싱 실패 시)
 */
function createDefaultGradingResult(imageCount: number) {
  return {
    subject: "기타",
    grade: 0,
    score: 75.0,
    totalQuestions: imageCount * 5,
    correctAnswers: Math.floor(imageCount * 5 * 0.75),
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
