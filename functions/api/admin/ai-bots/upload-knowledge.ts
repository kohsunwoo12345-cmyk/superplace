// API: AI 봇 지식 베이스 파일 업로드 및 Vectorize 저장
// POST /api/admin/ai-bots/upload-knowledge

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string; // OpenAI text-embedding-3-large (1024차원)
}

const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev/vectorize-upload';
const WORKER_API_KEY = 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u';

// 텍스트를 청크로 분할
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // 단락이 너무 길면 문장 단위로 분할
      if (para.length > maxChunkSize) {
        const sentences = para.split(/[.!?]\s+/);
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      } else {
        currentChunk = para;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(c => c.length > 0);
}

// OpenAI Embedding 생성 (1024차원)
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const url = 'https://api.openai.com/v1/embeddings';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1024 // Vectorize 인덱스와 일치
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Embedding API 오류: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Worker Vectorize에 업로드
async function uploadToVectorize(vectors: any[]): Promise<void> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': WORKER_API_KEY
    },
    body: JSON.stringify({ vectors })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vectorize 업로드 실패: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Vectorize 업로드 실패: ${result.error}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, OPENAI_API_KEY } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { botId, fileName, fileContent } = body;

    if (!botId || !fileName || !fileContent) {
      return new Response(
        JSON.stringify({ error: 'botId, fileName, fileContent are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 지식 베이스 업로드 시작: botId=${botId}, file=${fileName}, size=${fileContent.length}`);

    // 1️⃣ 텍스트를 청크로 분할
    const chunks = chunkText(fileContent, 1000);
    console.log(`✂️ ${chunks.length}개 청크로 분할`);

    // 2️⃣ 각 청크에 대해 임베딩 생성
    const vectors: any[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔄 청크 ${i + 1}/${chunks.length} 임베딩 생성 중...`);
      
      try {
        const embedding = await generateEmbedding(chunk, OPENAI_API_KEY);
        
        vectors.push({
          id: `${botId}-${fileName}-chunk-${i}`,
          values: embedding,
          metadata: {
            botId,
            fileName,
            chunkIndex: i,
            text: chunk,
            totalChunks: chunks.length
          }
        });
        
        console.log(`✅ 청크 ${i + 1} 임베딩 완료`);
      } catch (embError: any) {
        console.error(`❌ 청크 ${i + 1} 임베딩 실패:`, embError.message);
        throw new Error(`임베딩 생성 실패 (청크 ${i + 1}): ${embError.message}`);
      }
    }

    console.log(`📊 총 ${vectors.length}개 벡터 생성 완료`);

    // 3️⃣ Worker Vectorize에 업로드
    console.log('📤 Vectorize 업로드 시작...');
    await uploadToVectorize(vectors);
    console.log('✅ Vectorize 업로드 완료');

    // 4️⃣ DB에 knowledgeBase 업데이트 (파일 정보 저장)
    const existingBot = await DB.prepare(
      'SELECT knowledgeBase FROM ai_bots WHERE id = ?'
    ).bind(botId).first() as any;

    let knowledgeBaseInfo = '';
    if (existingBot?.knowledgeBase) {
      try {
        const existing = JSON.parse(existingBot.knowledgeBase);
        if (Array.isArray(existing)) {
          existing.push({
            fileName,
            uploadedAt: new Date().toISOString(),
            chunks: chunks.length
          });
          knowledgeBaseInfo = JSON.stringify(existing);
        } else {
          knowledgeBaseInfo = JSON.stringify([{
            fileName,
            uploadedAt: new Date().toISOString(),
            chunks: chunks.length
          }]);
        }
      } catch {
        knowledgeBaseInfo = JSON.stringify([{
          fileName,
          uploadedAt: new Date().toISOString(),
          chunks: chunks.length
        }]);
      }
    } else {
      knowledgeBaseInfo = JSON.stringify([{
        fileName,
        uploadedAt: new Date().toISOString(),
        chunks: chunks.length
      }]);
    }

    await DB.prepare(`
      UPDATE ai_bots 
      SET knowledgeBase = ?,
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(knowledgeBaseInfo, botId).run();

    console.log('✅ DB 업데이트 완료');

    return new Response(
      JSON.stringify({
        success: true,
        message: `파일 "${fileName}"이 성공적으로 업로드되었습니다`,
        chunks: chunks.length,
        vectors: vectors.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ 지식 베이스 업로드 오류:', error);
    return new Response(
      JSON.stringify({
        error: '파일 업로드 실패',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
