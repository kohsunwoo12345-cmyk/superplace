// Cloudflare Pages Function
// URL: /api/test

interface Env {
  DB: D1Database;
}

export async function onRequest(context: { env: Env }) {
  const { DB } = context.env;
  
  try {
    // 테스트 쿼리
    const result = await DB.prepare("SELECT 1 as test").first();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Database connected!",
        result 
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
