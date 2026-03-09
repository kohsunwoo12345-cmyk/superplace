/**
 * RAG Chat API with Gemini
 * 
 * 사용자 질문을 임베딩하고, Vectorize에서 관련 지식을 검색한 후
 * Google Gemini API로 전송하여 답변을 생성합니다.
 */

interface Env {
  AI: any;
  VECTORIZE: VectorizeIndex;
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

interface VectorizeIndex {
  insert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, any> }>): Promise<any>;
  query(vector: number[], options?: { topK?: number; filter?: Record<string, any> }): Promise<{
    matches: Array<{
      id: string;
      score: number;
      metadata: Record<string, any>;
    }>;
  }>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    console.log('🚀 RAG Chat API called');

    // Parse request body
    const body = await request.json() as {
      query: string;
      topK?: number;
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    const { query, topK = 5, conversationHistory = [] } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Query: ${query}`);
    console.log(`📊 TopK: ${topK}`);

    // Step 1: Generate embedding for user query using @cf/baai/bge-m3
    console.log('🔢 Generating query embedding...');
    const queryEmbeddingResponse = await env.AI.run('@cf/baai/bge-m3', {
      text: query,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0];

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      throw new Error('Failed to generate query embedding');
    }

    console.log(`✅ Query embedding generated, dimension: ${queryEmbedding.length}`);

    // Step 2: Search Vectorize for relevant knowledge
    console.log('🔎 Searching Vectorize...');
    const searchResults = await env.VECTORIZE.query(queryEmbedding, {
      topK,
    });

    console.log(`✅ Found ${searchResults.matches.length} relevant chunks`);

    // Extract relevant context from search results
    const relevantContext = searchResults.matches
      .map((match: any) => {
        console.log(`📄 Match (score: ${match.score.toFixed(4)}): ${match.metadata.filename} - chunk ${match.metadata.chunkIndex}`);
        return match.metadata.chunkText || '';
      })
      .join('\n\n');

    console.log(`📚 Context length: ${relevantContext.length} chars`);

    // Step 3: Send to Gemini API with context
    console.log('🤖 Calling Gemini API...');

    const geminiApiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    // Build conversation with context
    const systemPrompt = relevantContext
      ? `You are a helpful assistant with access to the following knowledge base:

${relevantContext}

Use this knowledge to answer the user's question accurately. If the knowledge base doesn't contain relevant information, say so honestly.`
      : 'You are a helpful assistant.';

    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will use the knowledge base to answer questions accurately.' }] },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: query }] },
    ];

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`);
    }

    const geminiData = await geminiResponse.json() as any;
    console.log('✅ Gemini response received');

    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(
      JSON.stringify({
        success: true,
        query,
        answer,
        sourcesUsed: searchResults.matches.length,
        sources: searchResults.matches.map((match: any) => ({
          filename: match.metadata.filename,
          chunkIndex: match.metadata.chunkIndex,
          score: match.score,
          preview: (match.metadata.chunkText || '').substring(0, 100) + '...',
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ RAG Chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process query',
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
