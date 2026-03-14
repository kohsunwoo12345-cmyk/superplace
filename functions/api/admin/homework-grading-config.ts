/**
 * 숙제 검사 AI 설정 관리 API
 * - 프롬프트 설정
 * - AI 모델 선택
 * - RAG 지식 파일 관리 (Vectorize 업로드 포함)
 */

interface Env {
  DB: D1Database;
  AI: any;
  VECTORIZE: any;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * 텍스트를 적절한 크기의 청크로 분할
 */
function splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  let currentPos = 0;
  while (currentPos < text.length) {
    chunks.push(text.substring(currentPos, currentPos + chunkSize));
    currentPos += chunkSize;
  }
  return chunks;
}

/**
 * Cloudflare AI를 사용하여 임베딩 생성 (bge-m3 모델 - ai-grading.ts와 일치)
 */
async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  try {
    const response = await env.AI.run('@cf/baai/bge-m3', {
      text: text,
    });
    return response.data[0];
  } catch (error: any) {
    console.error('❌ Embedding generation failed:', error.message);
    throw error;
  }
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
        subject TEXT DEFAULT 'math',
        grade INTEGER DEFAULT 3,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // subject, grade 컬럼 추가 (기존 테이블 업그레이드)
    try {
      await DB.prepare(`ALTER TABLE homework_grading_config ADD COLUMN subject TEXT DEFAULT 'math'`).run();
    } catch (e) {
      // 이미 존재
    }
    try {
      await DB.prepare(`ALTER TABLE homework_grading_config ADD COLUMN grade INTEGER DEFAULT 3`).run();
    } catch (e) {
      // 이미 존재
    }

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
      "studentAnswer": \"학생이 작성한 답\",
      "correctAnswer": \"정답\",
      "explanation": \"채점 근거 및 설명\"
    }
  ],
  "overallFeedback": \"전체적인 피드백\",
  "strengths": \"잘한 점\",
  "improvements": \"개선할 점\"
}`;

      return Response.json({
        success: true,
        message: 'Using default configuration',
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
      message: 'Configuration loaded successfully',
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
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
};

/**
 * POST: 숙제 검사 AI 설정 저장 (Vectorize 업로드 포함)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { DB, AI, VECTORIZE } = env;

  try {
    const body = await request.json() as any;
    let {
      systemPrompt,
      model = 'gemini-2.5-flash',
      temperature = 0.3,
      maxTokens = 2000,
      topK = 40,
      topP = 0.95,
      enableRAG = 0,
      knowledgeBase = null,
      subject = 'math',  // 과목 추가 (기본값: 수학)
      grade = 3          // 학년 추가 (기본값: 3학년)
    } = body;

    // Ensure numeric fields have valid values
    if (topK === undefined || topK === null) topK = 40;
    if (topP === undefined || topP === null) topP = 0.95;
    if (temperature === undefined || temperature === null) temperature = 0.3;
    if (maxTokens === undefined || maxTokens === null) maxTokens = 2000;
    if (enableRAG === undefined || enableRAG === null) enableRAG = 0;
    if (subject === undefined || subject === null) subject = 'math';
    if (grade === undefined || grade === null) grade = 3;

    // 1. RAG 지식 베이스 처리 (Vectorize 업로드)
    if (enableRAG && knowledgeBase && knowledgeBase.length > 0) {
      if (AI && VECTORIZE) {
        try {
          console.log('📚 Processing knowledge base for Vectorize...');
          const chunks = splitTextIntoChunks(knowledgeBase, 1000);
          const vectors = [];
          
          // 최대 20개 청크로 제한 (타임아웃 방지)
          const chunksToProcess = chunks.slice(0, 20);
          
          for (let i = 0; i < chunksToProcess.length; i++) {
            const chunk = chunksToProcess[i];
            const embedding = await generateEmbedding(chunk, env);
            
            vectors.push({
              id: `homework-grading-chunk-${i}`,
              values: embedding,
              metadata: {
                type: 'homework_grading_knowledge',
                chunkIndex: i,
                text: chunk.substring(0, 500),
                updatedAt: new Date().toISOString()
              }
            });
          }
          
          if (vectors.length > 0) {
            await VECTORIZE.upsert(vectors);
            console.log(`✅ Successfully uploaded ${vectors.length} vectors to Vectorize`);
          }
        } catch (ragError: any) {
          console.error('❌ Vectorization failed:', ragError.message);
        }
      }
    }

    // 2. DB 테이블 확인 및 저장
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
        subject TEXT DEFAULT 'math',
        grade INTEGER DEFAULT 3,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    try { await DB.prepare(`ALTER TABLE homework_grading_config ADD COLUMN topK INTEGER DEFAULT 40`).run(); } catch (e) {}
    try { await DB.prepare(`ALTER TABLE homework_grading_config ADD COLUMN topP REAL DEFAULT 0.95`).run(); } catch (e) {}
    try { await DB.prepare(`ALTER TABLE homework_grading_config ADD COLUMN subject TEXT DEFAULT 'math'`).run(); } catch (e) {}
    try { await DB.prepare(`ALTER TABLE homework_grading_config ADD COLUMN grade INTEGER DEFAULT 3`).run(); } catch (e) {}

    const existing = await DB.prepare(
      `SELECT id FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    if (existing) {
      await DB.prepare(`
        UPDATE homework_grading_config
        SET systemPrompt = ?, model = ?, temperature = ?, maxTokens = ?,
            topK = ?, topP = ?, enableRAG = ?, knowledgeBase = ?,
            subject = ?, grade = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        systemPrompt, model, temperature, maxTokens,
        topK, topP, enableRAG, knowledgeBase,
        subject, grade,
        existing.id
      ).run();
      
      return Response.json({
        success: true,
        message: '숙제 검사 AI 설정이 업데이트되었습니다.',
        configId: Number(existing.id)
      });
    } else {
      const result = await DB.prepare(`
        INSERT INTO homework_grading_config 
        (systemPrompt, model, temperature, maxTokens, topK, topP, enableRAG, knowledgeBase, subject, grade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        systemPrompt, model, temperature, maxTokens,
        topK, topP, enableRAG, knowledgeBase,
        subject, grade
      ).run();
      
      return Response.json({
        success: true,
        message: '숙제 검사 AI 설정이 저장되었습니다.',
        configId: result.meta.last_row_id
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('❌ Failed to save homework grading config:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
};
