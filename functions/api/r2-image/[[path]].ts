interface Env {
  SMS_DOCUMENTS: R2Bucket;
}

// GET: R2에서 이미지 가져오기
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env, params } = context;
    const { SMS_DOCUMENTS } = env;

    if (!SMS_DOCUMENTS) {
      return new Response("R2 bucket not configured", {
        status: 500,
      });
    }

    // URL에서 파일 경로 추출
    // 예: /api/r2-image/store-products/123456-abc.jpg
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/api/r2-image/');
    const filePath = pathParts[1];

    if (!filePath) {
      return new Response("File path not provided", {
        status: 400,
      });
    }

    console.log("📥 Fetching image from R2:", filePath);

    // R2에서 파일 가져오기
    const object = await SMS_DOCUMENTS.get(filePath);

    if (!object) {
      console.log("❌ File not found:", filePath);
      return new Response("File not found", {
        status: 404,
      });
    }

    console.log("✅ File found, returning image");

    // 이미지 반환
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000'); // 1년 캐시

    return new Response(object.body, {
      headers,
    });
  } catch (error: any) {
    console.error("❌ R2 image fetch error:", error);
    return new Response("Failed to fetch image", {
      status: 500,
    });
  }
};
