interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  Novita_AI_API?: string;
  PYTHON_WORKER_URL_?: string; // Python Worker URL (optional)
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
    const { DB, GOOGLE_GEMINI_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, Novita_AI_API, PYTHON_WORKER_URL_ } = context.env;
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
      JOIN users u ON s.userId = u.id
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
    if (model.startsWith('deepseek/')) {
      // Novita AI를 통한 DeepSeek 호출
      apiKey = Novita_AI_API;
      if (!apiKey) {
        console.error('❌ Novita_AI_API 미설정');
        return new Response(
          JSON.stringify({ error: "Novita AI API key not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (model.startsWith('deepseek')) {
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
    let gradingResult = await performGrading(imageArray, apiKey, model, systemPrompt, temperature);

    // 5. Python Worker로 수학 문제 검증 (옵션)
    if (PYTHON_WORKER_URL_ && gradingResult.problemAnalysis && gradingResult.problemAnalysis.length > 0) {
      try {
        console.log(`🐍 Python Worker로 수학 문제 검증 시작...`);
        const { enhanceProblemAnalysisWithPython } = await import('./python-helper');
        gradingResult.problemAnalysis = await enhanceProblemAnalysisWithPython(
          gradingResult.problemAnalysis,
          PYTHON_WORKER_URL_
        );
        console.log(`✅ Python 검증 완료`);
      } catch (pythonError: any) {
        console.warn(`⚠️ Python 검증 실패 (계속 진행):`, pythonError.message);
      }
    }

    // 6. homework_gradings_v2 테이블 생성
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, 'DeepSeek AI', ?, ?, ?, ?, ?, ?)
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
 * deepseek/ prefix가 있으면 Novita AI endpoint 사용
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

  // 관리자가 설정한 프롬프트를 system message로 사용
  console.log(`📋 System 프롬프트 (첫 200자): ${systemPrompt.substring(0, 200)}...`);
  console.log(`📝 이미지 개수: ${imageArray.length}장`);

  // Novita AI를 사용하는 경우 (deepseek/ prefix)
  const apiEndpoint = model.startsWith('deepseek/') 
    ? 'https://api.novita.ai/v3/openai/chat/completions'
    : 'https://api.deepseek.com/v1/chat/completions';
  
  console.log(`🔗 API Endpoint: ${apiEndpoint}, Model: ${model}`);

  const deepseekResponse = await fetch(
    apiEndpoint,
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
              { type: "text", text: `제공된 ${imageArray.length}장의 숙제 이미지를 분석하여 채점하세요.` },
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
    
    // detailedResults를 problemAnalysis로 변환 (관리자 프롬프트 호환성)
    if (result.detailedResults && !result.problemAnalysis) {
      result.problemAnalysis = result.detailedResults.map((item: any) => ({
        page: item.questionNumber || 1,
        problem: item.problem || '문제 내용 없음',
        answer: item.studentAnswer || '',
        isCorrect: item.isCorrect || false,
        type: '일반',
        concept: '',
        explanation: item.explanation || ''
      }));
    }
    
    // 기본 필드 보완
    // score 정규화: AI가 0~1 범위로 반환한 경우 100을 곱해 백분율로 변환
    let rawScore = result.score;
    if (rawScore === undefined || rawScore === null) {
      rawScore = result.totalQuestions > 0
        ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
        : 0;
    } else if (rawScore > 0 && rawScore <= 1) {
      // 0~1 범위인 경우 백분율로 변환
      rawScore = Math.round(rawScore * 100);
    } else {
      // 소수점 반올림
      rawScore = Math.round(rawScore);
    }
    result.score = rawScore;
    result.subject = result.subject || '일반';
    result.feedback = result.feedback || result.overallFeedback || '채점 완료';
    result.strengths = result.strengths || '노력';
    result.suggestions = result.suggestions || result.improvements || '계속 학습';
    result.completion = result.completion || 'good';
    
    console.log(`✅ DeepSeek 채점 완료: ${result.score}점, 문제 분석: ${result.problemAnalysis?.length || 0}개`);
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

  // 관리자가 설정한 프롬프트 사용
  const finalPrompt = `${systemPrompt}\n\n제공된 ${imageArray.length}장의 이미지를 분석하세요.`;
  console.log(`📋 사용할 프롬프트 (첫 200자): ${finalPrompt.substring(0, 200)}...`);
  
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }, ...imageParts] }],
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
    
    // detailedResults를 problemAnalysis로 변환 (관리자 프롬프트 호환성)
    if (result.detailedResults && !result.problemAnalysis) {
      result.problemAnalysis = result.detailedResults.map((item: any) => ({
        page: item.questionNumber || 1,
        problem: item.problem || '문제 내용 없음',
        answer: item.studentAnswer || '',
        isCorrect: item.isCorrect || false,
        type: '일반',
        concept: '',
        explanation: item.explanation || ''
      }));
    }
    
    // 기본 필드 보완
    // score 정규화: AI가 0~1 범위로 반환한 경우 100을 곱해 백분율로 변환
    let rawScore = result.score;
    if (rawScore === undefined || rawScore === null) {
      rawScore = result.totalQuestions > 0
        ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
        : 0;
    } else if (rawScore > 0 && rawScore <= 1) {
      // 0~1 범위인 경우 백분율로 변환
      rawScore = Math.round(rawScore * 100);
    } else {
      // 소수점 반올림
      rawScore = Math.round(rawScore);
    }
    result.score = rawScore;
    result.subject = result.subject || '일반';
    result.feedback = result.feedback || result.overallFeedback || '채점 완료';
    result.strengths = result.strengths || '노력';
    result.suggestions = result.suggestions || result.improvements || '계속 학습';
    result.completion = result.completion || 'good';
    
    console.log(`✅ Gemini 채점 완료: ${result.score}점, 문제 분석: ${result.problemAnalysis?.length || 0}개`);
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
