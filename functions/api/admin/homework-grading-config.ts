/**
 * 숙제 검사 AI 설정 API
 * 
 * 관리자가 숙제 검사 시 사용할 프롬프트와 RAG 지식을 설정/조회
 */

interface Env {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: any;
}

// GET: 현재 설정 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 테이블 생성 (없을 경우)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_grading_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemPrompt TEXT NOT NULL,
        model TEXT DEFAULT 'gemini-2.5-flash',
        temperature REAL DEFAULT 0.7,
        maxTokens INTEGER DEFAULT 2000,
        enableRAG INTEGER DEFAULT 0,
        knowledgeBase TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 현재 설정 조회 (가장 최신 것 하나만)
    const config = await DB.prepare(
      `SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    if (!config) {
      // 기본 설정 반환
      return new Response(JSON.stringify({
        config: {
          id: null,
          systemPrompt: getDefaultPrompt(),
          model: 'gemini-2.5-flash',
          temperature: 0.7,
          maxTokens: 2000,
          enableRAG: 0,
          knowledgeBase: '',
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      config: {
        ...config,
        enableRAG: config.enableRAG ? 1 : 0,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Get homework grading config error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to get config",
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// POST: 설정 저장/업데이트
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json();
    const {
      systemPrompt,
      model = 'gemini-2.5-flash',
      temperature = 0.7,
      maxTokens = 2000,
      enableRAG = 0,
      knowledgeBase = '',
    } = body;

    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "systemPrompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('💾 Saving homework grading config:', {
      model,
      promptLength: systemPrompt.length,
      enableRAG,
      knowledgeBaseLength: knowledgeBase?.length || 0,
    });

    // 테이블 생성 (없을 경우)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_grading_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systemPrompt TEXT NOT NULL,
        model TEXT DEFAULT 'gemini-2.5-flash',
        temperature REAL DEFAULT 0.7,
        maxTokens INTEGER DEFAULT 2000,
        enableRAG INTEGER DEFAULT 0,
        knowledgeBase TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 새 설정 저장
    const result = await DB.prepare(`
      INSERT INTO homework_grading_config (
        systemPrompt, model, temperature, maxTokens, enableRAG, knowledgeBase
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      systemPrompt,
      model,
      temperature,
      maxTokens,
      enableRAG ? 1 : 0,
      knowledgeBase || null
    ).run();

    console.log('✅ Homework grading config saved');

    return new Response(
      JSON.stringify({ 
        success: true,
        configId: result.meta.last_row_id,
        message: "Configuration saved successfully" 
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Save homework grading config error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to save config",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function getDefaultPrompt(): string {
  return `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요
3. 정답 여부를 판단하세요
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
  "feedback": "전반적인 피드백",
  "strengths": "잘한 점",
  "suggestions": "개선할 점"
}`;
}
