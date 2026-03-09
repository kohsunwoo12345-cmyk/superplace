/**
 * RAG Knowledge Upload API
 * 
 * 지식 파일을 업로드하고 @cf/baai/bge-m3 모델로 임베딩하여
 * Vectorize에 저장합니다.
 */

interface Env {
  AI: any;
  VECTORIZE: VectorizeIndex;
  DB: D1Database;
}

interface VectorizeIndex {
  insert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, any> }>): Promise<any>;
  query(vector: number[], options?: { topK?: number; filter?: Record<string, any> }): Promise<any>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    console.log('🚀 RAG Upload API called');

    // Parse request body
    const body = await request.json() as {
      content: string;
      filename: string;
      metadata?: Record<string, any>;
    };

    const { content, filename, metadata = {} } = body;

    if (!content || !filename) {
      return new Response(JSON.stringify({ error: 'Content and filename are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📄 Processing file: ${filename}, length: ${content.length} chars`);

    // Split content into chunks (최대 1000 characters per chunk)
    const chunkSize = 1000;
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }

    console.log(`✂️  Split into ${chunks.length} chunks`);

    // Generate embeddings for each chunk using @cf/baai/bge-m3
    const vectors: Array<{ id: string; values: number[]; metadata: Record<string, any> }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      console.log(`🔢 Generating embedding for chunk ${i + 1}/${chunks.length}`);

      // Generate embedding using Workers AI @cf/baai/bge-m3 model
      const embeddingResponse = await env.AI.run('@cf/baai/bge-m3', {
        text: chunk,
      });

      console.log(`✅ Embedding generated for chunk ${i + 1}, dimension:`, embeddingResponse.data?.[0]?.length || 'unknown');

      // Extract embedding vector
      const embedding = embeddingResponse.data[0];

      if (!embedding || !Array.isArray(embedding)) {
        console.error(`❌ Invalid embedding response for chunk ${i + 1}:`, embeddingResponse);
        continue;
      }

      // Create vector entry
      vectors.push({
        id: `${filename}-chunk-${i}`,
        values: embedding,
        metadata: {
          filename,
          chunkIndex: i,
          chunkText: chunk.substring(0, 200), // Preview
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      });
    }

    console.log(`💾 Inserting ${vectors.length} vectors into Vectorize`);

    // Insert vectors into Vectorize
    const insertResult = await env.VECTORIZE.insert(vectors);

    console.log('✅ Vectors inserted successfully:', insertResult);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        chunksProcessed: chunks.length,
        vectorsInserted: vectors.length,
        message: 'Knowledge uploaded and embedded successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ RAG Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload knowledge',
        details: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
