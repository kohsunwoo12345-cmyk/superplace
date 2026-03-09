/**
 * 숙제 검사 AI 설정 관리 API
 * - 프롬프트 설정
 * - AI 모델 선택
 * - RAG 지식 파일 관리
 */

interface Env {
  DB: D1Database;
  AI: any;
  VECTORIZE: VectorizeIndex;
}

/**
 * GET: 현재 숙제 검사 AI 설정 불러오기
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    // 테이블 생성 (없을 경우)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_grading_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemPrompt TEXT NOT NULL,
        model TEXT DEFAULT 'gemini-2.5-flash',
        temperature REAL DEFAULT 0.3,
        maxTokens INTEGER DEFAULT 2000,
        topK INTEGER DEFAULT 40,
        topP REAL DEFAULT 0.95,
        enableRAG INTEGER DEFAULT 0,
        knowledgeBase TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 현재 설정 불러오기 (가장 최근 항목)
    const config = await DB.prepare(
      `SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    // 기본 설정이 없으면 기본값 반환
    if (!config) {
      const defaultPrompt = `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요
3. 정답 여부를 판단하세요 (문제에 정답이 표시되어 있거나, 일반적인 학습 지식으로 판단)
4. 각 문제에 대한 피드백을 제공하세요

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "totalQuestions": 문제 총 개수,
  "correctAnswers": 맞은 문제 수,
  "detailedResults": [
    {
      "questionNumber": 1,
      "isCorrect": true/false,
      "studentAnswer": "학생이 작성한 답",
      "correctAnswer": "정답",
      "explanation": "채점 근거 및 설명"
    }
  ],
  "overallFeedback": "전체적인 피드백",
  "strengths": "잘한 점",
  "improvements": "개선할 점"
}`;

      return Response.json({
        success: true,
        config: {
          id: 0,
          systemPrompt: defaultPrompt,
          model: 'gemini-2.5-flash',
          temperature: 0.3,
          maxTokens: 2000,
          topK: 40,
          topP: 0.95,
          enableRAG: 0,
          knowledgeBase: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      });
    }

    return Response.json({
      success: true,
      config: {
        ...config,
        temperature: Number(config.temperature),
        maxTokens: Number(config.maxTokens),
        topK: Number(config.topK),
        topP: Number(config.topP),
        enableRAG: Number(config.enableRAG),
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to get homework grading config:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message,
        details: error.stack 
      },
      { status: 500 }
    );
  }
};

/**
 * POST: 숙제 검사 AI 설정 저장
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json() as any;

    const {
      systemPrompt,
      model = 'gemini-2.5-flash',
      temperature = 0.3,
      maxTokens = 2000,
      topK = 40,
      topP = 0.95,
      enableRAG = 0,
      knowledgeBase = null,
    } = body;

    // 테이블 생성 (없을 경우)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_grading_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemPrompt TEXT NOT NULL,
        model TEXT DEFAULT 'gemini-2.5-flash',
        temperature REAL DEFAULT 0.3,
        maxTokens INTEGER DEFAULT 2000,
        topK INTEGER DEFAULT 40,
        topP REAL DEFAULT 0.95,
        enableRAG INTEGER DEFAULT 0,
        knowledgeBase TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 기존 설정이 있는지 확인
    const existing = await DB.prepare(
      `SELECT id FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    if (existing) {
      // 업데이트
      await DB.prepare(`
        UPDATE homework_grading_config
        SET systemPrompt = ?,
            model = ?,
            temperature = ?,
            maxTokens = ?,
            topK = ?,
            topP = ?,
            enableRAG = ?,
            knowledgeBase = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        systemPrompt,
        model,
        temperature,
        maxTokens,
        topK,
        topP,
        enableRAG,
        knowledgeBase,
        existing.id
      ).run();

      console.log('✅ Homework grading config updated:', { id: existing.id, model, enableRAG });

      return Response.json({
        success: true,
        message: '숙제 검사 AI 설정이 업데이트되었습니다.',
        configId: existing.id
      });
    } else {
      // 새로 추가
      const result = await DB.prepare(`
        INSERT INTO homework_grading_config 
        (systemPrompt, model, temperature, maxTokens, topK, topP, enableRAG, knowledgeBase)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        systemPrompt,
        model,
        temperature,
        maxTokens,
        topK,
        topP,
        enableRAG,
        knowledgeBase
      ).run();

      console.log('✅ Homework grading config created:', { model, enableRAG });

      return Response.json({
        success: true,
        message: '숙제 검사 AI 설정이 저장되었습니다.',
        configId: result.meta.last_row_id
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('❌ Failed to save homework grading config:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message,
        details: error.stack 
      },
      { status: 500 }
    );
  }
};
