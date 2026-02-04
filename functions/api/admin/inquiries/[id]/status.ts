interface Env {
  DB: D1Database;
}

// 문의 상태 변경
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const inquiryId = context.params.id as string;
    const body = await context.request.json() as any;

    const { status } = body;

    if (!status || !['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await DB.prepare(`
      UPDATE inquiries 
      SET status = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(status, inquiryId).run();

    return new Response(
      JSON.stringify({ success: true, message: "Status updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Inquiry status update error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update status",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
