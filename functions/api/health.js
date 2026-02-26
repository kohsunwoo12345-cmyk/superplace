// Health check API - 배포 버전 확인
export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    status: "OK",
    version: "69f25bc",
    timestamp: new Date().toISOString(),
    message: "Cloudflare Pages is working",
  }), { 
    status: 200, 
    headers: { "Content-Type": "application/json" } 
  });
}
