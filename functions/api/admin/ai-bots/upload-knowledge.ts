// API: AI 봇 지식 베이스 파일 업로드 및 Vectorize 저장
// POST /api/admin/ai-bots/upload-knowledge
// Cloudflare AI (@cf/baai/bge-m3) → knowledge-base-embeddings

interface Env {
  DB: D1Database;
  AI: any; // Cloudflare AI 바인딩
  VECTORIZE: Vectorize;
}

// 텍스트를 청크로 분할 (512자 단위, 숙제 RAG와 동일)
function chunkText(text: string, maxChunkSize: number = 512): string[] {
  const chunks: string[] = [];
  
  for (let i = 0; i < text.length; i += maxChunkSize) {
    const chunk = text.substring(i, i + maxChunkSize);
    chunks.push(chunk);
  }
  
  return chunks.filter(c => c.length > 0);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, AI, VECTORIZE } = context.env;

    if (!DB || !AI || !VECTORIZE) {
      return new Response(
        JSON.stringify({ error: 'Database, AI, or Vectorize not configured' }),
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

    console.log(`📤 AI 봇 지식 베이스 업로드: botId=${botId}, file=${fileName}, size=${fileContent.length}`);

    // 1️⃣ 텍스트를 512자 청크로 분할 (숙제 RAG와 동일)
    const chunks = chunkText(fileContent, 512);
    console.log(`✂️ ${chunks.length}개 청크로 분할 (512자 단위)`);

    // 2️⃣ 각 청크에 대해 Cloudflare AI 임베딩 생성 (@cf/baai/bge-m3, 1024차원)
    const embeddings: Array<{ id: string; values: number[]; metadata: any }> = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔄 청크 ${i + 1}/${chunks.length} 임베딩 생성 중...`);
      
      try {
        // Cloudflare AI 임베딩 생성 (1024차원)
        const embeddingResponse = await AI.run('@cf/baai/bge-m3', {
          text: chunk
        });

        const embedding = embeddingResponse.data?.[0];

        if (!embedding || !Array.isArray(embedding)) {
          console.error(`❌ 청크 ${i} 임베딩 데이터 없음`);
          continue;
        }

        embeddings.push({
          id: `bot-${botId}-${fileName}-chunk-${i}`,
          values: embedding,
          metadata: {
            botId,
            fileName,
            chunkIndex: i,
            text: chunk,
            totalChunks: chunks.length,
            uploadedAt: new Date().toISOString(),
            type: 'ai_bot_knowledge'
          }
        });
        
        console.log(`✅ 청크 ${i + 1}/${chunks.length} 임베딩 완료 (dim: ${embedding.length})`);
      } catch (embError: any) {
        console.error(`❌ 청크 ${i + 1} 임베딩 실패:`, embError.message);
      }
    }

    if (embeddings.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: '임베딩 생성 실패',
          message: '모든 청크의 임베딩 생성에 실패했습니다'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 총 ${embeddings.length}개 벡터 생성 완료`);

    // 3️⃣ Vectorize에 임베딩 저장 (knowledge-base-embeddings 인덱스)
    console.log(`💾 Vectorize에 ${embeddings.length}개 임베딩 저장 중...`);
    
    try {
      await VECTORIZE.upsert(embeddings);
      console.log(`✅ Vectorize 저장 완료`);
    } catch (vectorError: any) {
      console.error('❌ Vectorize 저장 오류:', vectorError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Vectorize 저장 실패',
          message: vectorError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
            chunks: embeddings.length
          });
          knowledgeBaseInfo = JSON.stringify(existing);
        } else {
          knowledgeBaseInfo = JSON.stringify([{
            fileName,
            uploadedAt: new Date().toISOString(),
            chunks: embeddings.length
          }]);
        }
      } catch {
        knowledgeBaseInfo = JSON.stringify([{
          fileName,
          uploadedAt: new Date().toISOString(),
          chunks: embeddings.length
        }]);
      }
    } else {
      knowledgeBaseInfo = JSON.stringify([{
        fileName,
        uploadedAt: new Date().toISOString(),
        chunks: embeddings.length
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
        chunks: embeddings.length,
        vectors: embeddings.length,
        embedding: '@cf/baai/bge-m3 (1024 dim)',
        vectorIndex: 'knowledge-base-embeddings'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ AI 봇 지식 베이스 업로드 오류:', error);
    return new Response(
      JSON.stringify({
        error: '파일 업로드 실패',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
