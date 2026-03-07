// 간단한 테스트 API
export async function onRequest() {
  return new Response(JSON.stringify({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
