// Debug API: Check User Approved Sender Numbers
// GET /api/debug/check-user-sender-numbers?userId=208

interface Env {
  DB: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId') || '208';
    
    const db = context.env.DB;

    const user = await db
      .prepare('SELECT id, email, approved_sender_numbers, kakao_pf_id, phone FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
