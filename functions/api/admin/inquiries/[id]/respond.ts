interface Env {
  DB: D1Database;
}

// 문의 응답
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const inquiryId = context.params.id as string;
    const body = await context.request.json() as any;

    const { response } = body;

    if (!response) {
      return new Response(
        JSON.stringify({ error: "Response is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await DB.prepare(`
      UPDATE inquiries 
      SET response = ?, 
          status = 'RESOLVED', 
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(response, inquiryId).run();

    return new Response(
      JSON.stringify({ success: true, message: "Response sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Inquiry response error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send response",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
