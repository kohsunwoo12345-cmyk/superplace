// Cloudflare Pages Function
// POST /api/admin/upload-knowledge - PDF 텍스트를 Vectorize에 임베딩 저장

interface Env {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  GOOGLE_GEMINI_API_KEY: string;
}

// 텍스트를 청크로 분할 (Gemini 임베딩 모델: 최대 2048 토큰)
function chunkText(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Gemini API로 텍스트 임베딩 생성
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  console.log(`🔄 Generating embedding for text (${text.length} chars)...`);
  
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Gemini API key is empty or not configured');
  }
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }]
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Gemini API error (${response.status}):`, errorText.substring(0, 200));
    throw new Error(`Gemini Embedding API error (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  
  if (!data.embedding || !data.embedding.values) {
    console.error('❌ Invalid embedding response:', JSON.stringify(data).substring(0, 200));
    throw new Error('Invalid embedding response format');
  }
  
  console.log(`✅ Embedding generated (${data.embedding.values.length} dimensions)`);
  return data.embedding.values;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, VECTORIZE, GOOGLE_GEMINI_API_KEY } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!VECTORIZE) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Vectorize not configured',
        message: 'Vectorize 인덱스가 설정되지 않았습니다. wrangler.toml을 확인하세요.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('❌ GOOGLE_GEMINI_API_KEY not configured in environment');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Gemini API key not configured',
        message: 'GOOGLE_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Cloudflare Pages 설정을 확인하세요.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`✅ GOOGLE_GEMINI_API_KEY found (length: ${GOOGLE_GEMINI_API_KEY.length})`);
    console.log(`✅ API KEY preview: ${GOOGLE_GEMINI_API_KEY.substring(0, 10)}...`);

    const body = await context.request.json() as any;
    const { botId, knowledgeBase, fileName } = body;

    if (!botId || !knowledgeBase) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'botId and knowledgeBase are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📚 Starting knowledge upload for bot ${botId}...`);
    console.log(`  └─ Knowledge base length: ${knowledgeBase.length} characters`);
    console.log(`  └─ File name: ${fileName || 'N/A'}`);

    // 1. 텍스트를 청크로 분할
    const chunks = chunkText(knowledgeBase, 1000);
    console.log(`  └─ Split into ${chunks.length} chunks`);

    // 🔥 최적화: 최대 20개 청크만 처리 (타임아웃 방지)
    const maxChunks = 20;
    const chunksToProcess = chunks.slice(0, maxChunks);
    
    if (chunks.length > maxChunks) {
      console.log(`  ⚠️ Limiting to ${maxChunks} chunks (original: ${chunks.length})`);
    }

    // 2. 각 청크를 임베딩하여 Vectorize에 저장
    const vectors: VectorizeVector[] = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < chunksToProcess.length; i++) {
      const chunk = chunksToProcess[i];
      
      try {
        // Gemini API로 임베딩 생성
        const embedding = await generateEmbedding(chunk, GOOGLE_GEMINI_API_KEY);
        
        vectors.push({
          id: `${botId}-chunk-${i}`,
          values: embedding,
          metadata: {
            botId,
            chunkIndex: i,
            text: chunk.substring(0, 500), // 메타데이터에는 앞 500자만 저장
            fileName: fileName || 'unknown',
            createdAt: new Date().toISOString()
          }
        });
        
        successCount++;
        console.log(`  └─ Chunk ${i + 1}/${chunksToProcess.length} embedded ✅`);
      } catch (embeddingError: any) {
        failCount++;
        console.error(`  └─ Chunk ${i + 1} failed: ${embeddingError.message} ❌`);
        
        // 연속 3번 실패하면 중단
        if (failCount >= 3) {
          console.error('  ❌ Too many failures, aborting');
          break;
        }
      }
    }

    if (vectors.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to generate any embeddings',
        failCount,
        totalChunks: chunksToProcess.length
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Vectorize에 벡터 저장
    try {
      await VECTORIZE.upsert(vectors);
      console.log(`✅ Successfully uploaded ${vectors.length} vectors to Vectorize`);
    } catch (vectorizeError: any) {
      console.error('❌ Vectorize upsert error:', vectorizeError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to upload to Vectorize',
        message: vectorizeError.message,
        successCount: vectors.length
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. DB에 knowledgeBase 저장 (백업용)
    try {
      await DB.prepare(`
        UPDATE ai_bots 
        SET knowledgeBase = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).bind(knowledgeBase, botId).run();
      
      console.log(`✅ Knowledge base saved to DB for bot ${botId}`);
    } catch (dbError: any) {
      console.warn('⚠️ Failed to update DB, but Vectorize upload succeeded:', dbError.message);
      // DB 저장 실패해도 Vectorize 저장은 성공했으므로 계속 진행
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Knowledge base uploaded successfully',
      vectorCount: vectors.length,
      chunkCount: chunks.length,
      processedChunks: chunksToProcess.length,
      successCount,
      failCount,
      botId,
      limitApplied: chunks.length > maxChunks
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Upload knowledge error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack?.substring(0, 200)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
