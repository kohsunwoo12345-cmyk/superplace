interface Env {
  DB: D1Database;
  VECTORIZE: Vectorize;
  AI: any; // Cloudflare AI 바인딩
  GOOGLE_GEMINI_API_KEY: string;
}

interface KnowledgeFile {
  id: string;
  fileName: string;
  subject: string;
  grade: number;
  fileType: string; // 'textbook' | 'answer_key' | 'reference'
  content: string;
  uploadedAt: string;
  academyId?: number;
}

/**
 * RAG 지식베이스 파일 업로드 API
 * POST /api/rag/upload
 * 
 * Cloudflare AI (@cf/baai/bge-m3, 1024 dim) → knowledge-base-embeddings
 * 
 * Body:
 * {
 *   fileName: string,
 *   subject: string,  // "수학", "영어", "국어" 등
 *   grade: number,    // 1~9
 *   fileType: string, // "textbook" | "answer_key" | "reference"
 *   content: string,  // 파일 텍스트 내용
 *   academyId?: number
 * }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, VECTORIZE, AI } = context.env;
    
    if (!DB || !VECTORIZE || !AI) {
      return new Response(
        JSON.stringify({ error: "Database, Vectorize, or Cloudflare AI not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json() as {
      fileName: string;
      subject: string;
      grade: number;
      fileType: string;
      content: string;
      academyId?: number;
    };

    const { fileName, subject, grade, fileType, content, academyId } = body;

    if (!fileName || !subject || !grade || !fileType || !content) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          required: ["fileName", "subject", "grade", "fileType", "content"]
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 RAG 파일 업로드: ${fileName} (${subject}, ${grade}학년, ${fileType})`);

    // 1. knowledge_files 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS knowledge_files (
        id TEXT PRIMARY KEY,
        fileName TEXT NOT NULL,
        subject TEXT NOT NULL,
        grade INTEGER NOT NULL,
        fileType TEXT NOT NULL,
        content TEXT NOT NULL,
        uploadedAt TEXT DEFAULT (datetime('now')),
        academyId INTEGER,
        chunkCount INTEGER DEFAULT 0
      )
    `).run();

    // 2. 파일 ID 생성
    const fileId = `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 3. 컨텐츠를 청크로 분할 (512자 단위)
    const chunkSize = 512;
    const chunks: string[] = [];
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, i + chunkSize);
      chunks.push(chunk);
    }

    console.log(`📄 총 ${chunks.length}개의 청크로 분할됨`);

    // 4. Cloudflare AI로 임베딩 생성 (@cf/baai/bge-m3, 1024 dim)
    const embeddings: Array<{ id: string; values: number[]; metadata: any }> = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${fileId}-chunk-${i}`;
      const chunk = chunks[i];
      
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
          id: chunkId,
          values: embedding,
          metadata: {
            fileId,
            fileName,
            subject,
            grade,
            fileType,
            chunkIndex: i,
            text: chunk,
            uploadedAt: new Date().toISOString()
          }
        });

        console.log(`✅ 청크 ${i + 1}/${chunks.length} 임베딩 완료 (dim: ${embedding.length})`);
      } catch (error: any) {
        console.error(`❌ 청크 ${i} 임베딩 오류:`, error.message);
      }
    }

    if (embeddings.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to create embeddings",
          message: "모든 청크의 임베딩 생성에 실패했습니다"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Vectorize에 임베딩 저장
    console.log(`💾 Vectorize에 ${embeddings.length}개 임베딩 저장 중...`);
    
    try {
      await VECTORIZE.upsert(embeddings);
      console.log(`✅ Vectorize 저장 완료`);
    } catch (vectorError: any) {
      console.error('❌ Vectorize 저장 오류:', vectorError.message);
      return new Response(
        JSON.stringify({ 
          error: "Failed to save to Vectorize",
          message: vectorError.message
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. 파일 정보를 DB에 저장
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    await DB.prepare(`
      INSERT INTO knowledge_files (id, fileName, subject, grade, fileType, content, uploadedAt, academyId, chunkCount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      fileId,
      fileName,
      subject,
      grade,
      fileType,
      content,
      kstTimestamp,
      academyId || null,
      embeddings.length
    ).run();

    console.log(`✅ 파일 정보 DB 저장 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        fileId,
        fileName,
        subject,
        grade,
        fileType,
        chunkCount: embeddings.length,
        embeddedChunks: embeddings.length,
        uploadedAt: kstTimestamp,
        message: `${fileName} 파일이 성공적으로 업로드되었습니다 (${embeddings.length}개 청크)`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ RAG 업로드 오류:', error);
    return new Response(
      JSON.stringify({ 
        error: "Upload failed",
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
