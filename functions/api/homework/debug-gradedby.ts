export async function onRequestGet(context: any) {
  const { searchParams } = new URL(context.request.url);
  const submissionId = searchParams.get('submissionId');
  
  if (!submissionId) {
    return new Response(JSON.stringify({ error: 'submissionId required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const DB = context.env.DB;
  
  // homework_grading_config 최신 설정
  const config = await DB.prepare('SELECT model, enableRAG FROM homework_grading_config ORDER BY id DESC LIMIT 1').first();
  
  // 해당 submission의 grading 정보
  const grading = await DB.prepare('SELECT gradedBy, score, gradedAt FROM homework_gradings_v2 WHERE submissionId = ?').bind(submissionId).first();
  
  return new Response(JSON.stringify({
    submissionId,
    config: {
      model: config?.model || 'not set',
      enableRAG: config?.enableRAG || 0
    },
    grading: {
      gradedBy: grading?.gradedBy || 'not graded',
      score: grading?.score || 0,
      gradedAt: grading?.gradedAt || 'never'
    },
    codeVersion: 'v3-debug-gradedby'
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
