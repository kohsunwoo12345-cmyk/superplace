// API: AI 봇 지식 베이스 파일 업로드 및 Vectorize 저장
// POST /api/admin/ai-bots/upload-knowledge
// Worker 경유 (Cloudflare AI + Vectorize)

interface Env {
  DB: D1Database;
}

const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev';
const WORKER_API_KEY = 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
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

    console.log(`📤 AI 봇 지식 베이스 업로드 (Worker 경유): botId=${botId}, file=${fileName}, size=${fileContent.length}`);

    // Worker를 통해 임베딩 생성 및 Vectorize 저장
    const workerResponse = await fetch(`${WORKER_URL}/bot/upload-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WORKER_API_KEY
      },
      body: JSON.stringify({
        botId,
        fileName,
        fileContent
      })
    });

    if (!workerResponse.ok) {
      const errorData = await workerResponse.json();
      return new Response(
        JSON.stringify({ 
          error: 'Worker 업로드 실패',
          message: errorData.error || `HTTP ${workerResponse.status}`
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const workerData = await workerResponse.json();
    
    if (!workerData.success) {
      return new Response(
        JSON.stringify({ 
          error: '임베딩 생성 실패',
          message: workerData.error
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Worker 업로드 완료: ${workerData.vectors}개 벡터`);

    // DB에 knowledgeBase 업데이트 (파일 정보 저장)
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
            chunks: workerData.chunks
          });
          knowledgeBaseInfo = JSON.stringify(existing);
        } else {
          knowledgeBaseInfo = JSON.stringify([{
            fileName,
            uploadedAt: new Date().toISOString(),
            chunks: workerData.chunks
          }]);
        }
      } catch {
        knowledgeBaseInfo = JSON.stringify([{
          fileName,
          uploadedAt: new Date().toISOString(),
          chunks: workerData.chunks
        }]);
      }
    } else {
      knowledgeBaseInfo = JSON.stringify([{
        fileName,
        uploadedAt: new Date().toISOString(),
        chunks: workerData.chunks
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
        message: workerData.message,
        chunks: workerData.chunks,
        vectors: workerData.vectors,
        embedding: workerData.embedding,
        vectorIndex: workerData.vectorIndex
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
