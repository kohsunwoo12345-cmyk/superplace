interface Env {
  DB: D1Database;
}

/**
 * 제출된 숙제의 이미지 조회 API
 * GET /api/homework/images?submissionId=xxx
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const submissionId = url.searchParams.get('submissionId');

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이미지 조회
    const images = await DB.prepare(`
      SELECT imageData, imageIndex
      FROM homework_images
      WHERE submissionId = ?
      ORDER BY imageIndex ASC
    `).bind(submissionId).all();

    if (!images.results || images.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          images: [],
          count: 0
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          } 
        }
      );
    }

    const imageArray = images.results.map((img: any) => img.imageData);

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        images: imageArray,
        count: imageArray.length
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    );

  } catch (error: any) {
    console.error("❌ 이미지 조회 오류:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to fetch images",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
