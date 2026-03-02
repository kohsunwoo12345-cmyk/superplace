// API: 지식 베이스 임베딩 생성 및 저장
// POST /api/admin/knowledge-base/embed

interface Env {
  GOOGLE_GEMINI_API_KEY: string;
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
}

interface EmbedRequest {
  botId: string;
  text: string;
  fileName?: string;
  replace?: boolean; // 기존 임베딩 삭제 후 재생성
}

// 텍스트를 청크로 분할하는 함수
function splitTextIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Gemini Embedding API로 임베딩 생성
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }]
        }
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  return data.embedding.values;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('📚 지식 베이스 임베딩 생성 시작');
    
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        message: 'API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data: EmbedRequest = await request.json();
    
    if (!data.botId || !data.text) {
      return new Response(JSON.stringify({
        success: false,
        message: 'botId and text are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`🔍 봇 ID: ${data.botId}, 텍스트 길이: ${data.text.length}`);
    
    // 기존 임베딩 삭제 (replace 옵션)
    if (data.replace) {
      console.log('🗑️ 기존 임베딩 삭제 중...');
      // Vectorize에서 해당 botId의 모든 벡터 삭제
      // Note: Vectorize API에 deleteByMetadata가 없으면 수동으로 ID 목록을 관리해야 함
      // 임시로 D1에 메타데이터 저장
      await env.DB.prepare(
        'DELETE FROM knowledge_base_chunks WHERE botId = ?'
      ).bind(data.botId).run();
    }
    
    // 텍스트를 청크로 분할
    console.log('✂️ 텍스트 청크 분할 중...');
    const chunks = splitTextIntoChunks(data.text, 1000);
    console.log(`📦 총 ${chunks.length}개 청크 생성`);
    
    // 각 청크의 임베딩 생성
    console.log('🧮 임베딩 생성 중...');
    const embeddings = [];
    const chunkMetadata = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${data.botId}-chunk-${Date.now()}-${i}`;
      
      console.log(`  └─ 청크 ${i + 1}/${chunks.length} (${chunk.length}자)`);
      
      try {
        const values = await generateEmbedding(chunk, apiKey);
        
        embeddings.push({
          id: chunkId,
          values: values,
          metadata: {
            botId: data.botId,
            chunkIndex: i,
            fileName: data.fileName || 'unknown',
            timestamp: Date.now()
          }
        });
        
        chunkMetadata.push({
          id: chunkId,
          botId: data.botId,
          chunkIndex: i,
          text: chunk,
          fileName: data.fileName || 'unknown',
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ 청크 ${i} 임베딩 생성 실패:`, error);
        throw error;
      }
    }
    
    // Vectorize에 임베딩 저장
    console.log('💾 Vectorize에 임베딩 저장 중...');
    await env.VECTORIZE.upsert(embeddings);
    console.log('✅ Vectorize 저장 완료');
    
    // D1에 청크 텍스트 저장 (검색 결과 표시용)
    console.log('💾 D1에 청크 메타데이터 저장 중...');
    
    // knowledge_base_chunks 테이블 생성 (없으면)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_base_chunks (
        id TEXT PRIMARY KEY,
        botId TEXT NOT NULL,
        chunkIndex INTEGER NOT NULL,
        text TEXT NOT NULL,
        fileName TEXT,
        createdAt TEXT NOT NULL,
        INDEX idx_botId (botId)
      )
    `);
    
    // 청크 메타데이터 저장
    for (const meta of chunkMetadata) {
      await env.DB.prepare(`
        INSERT INTO knowledge_base_chunks (id, botId, chunkIndex, text, fileName, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        meta.id,
        meta.botId,
        meta.chunkIndex,
        meta.text,
        meta.fileName,
        meta.createdAt
      ).run();
    }
    
    console.log('✅ D1 저장 완료');
    
    // 봇의 지식 베이스 상태 업데이트
    await env.DB.prepare(`
      UPDATE ai_bots 
      SET knowledgeBase = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      `RAG 활성화 - ${chunks.length}개 청크`,
      data.botId
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: '임베딩 생성 완료',
      chunks: chunks.length,
      botId: data.botId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ 임베딩 생성 오류:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Unknown error',
      error: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
