// R2 File Retrieval API
// GET /api/files/sender-number/:requestId/:filename

interface Env {
  SENDER_NUMBER_BUCKET: R2Bucket;
}

export async function onRequest(context: { request: Request; env: Env; params: any }) {
  const { env, params } = context;
  
  try {
    // URL에서 키 추출 (예: snr_xxx/telecom.pdf)
    const key = params.key?.join('/');
    
    if (!key) {
      return new Response('File key required', { status: 400 });
    }

    console.log('📥 파일 요청:', key);

    // R2에서 파일 가져오기
    if (!env.SENDER_NUMBER_BUCKET) {
      return new Response('Storage not configured', { status: 500 });
    }

    const object = await env.SENDER_NUMBER_BUCKET.get(key);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(object.body, {
      headers,
    });

  } catch (error: any) {
    console.error('파일 조회 오류:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
