interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const submissionId = url.searchParams.get("submissionId");

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. 제출 정보 확인
    const submission = await DB.prepare(`
      SELECT * FROM homework_submissions_v2 WHERE id = ?
    `).bind(submissionId).first();

    // 2. 채점 정보 확인
    const grading = await DB.prepare(`
      SELECT * FROM homework_gradings_v2 WHERE submissionId = ?
    `).bind(submissionId).first();

    // 3. 이미지 정보 확인
    const images = await DB.prepare(`
      SELECT id, imageIndex, LENGTH(imageData) as imageSize
      FROM homework_images
      WHERE submissionId = ?
      ORDER BY imageIndex
    `).bind(submissionId).all();

    return new Response(
      JSON.stringify({
        success: true,
        submission,
        grading,
        images: images.results,
        imageCount: images.results?.length || 0
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
