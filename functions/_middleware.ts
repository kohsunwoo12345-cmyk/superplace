export async function onRequest(context: any) {
  const response = await context.next();
  
  // 모든 응답에 캐시 무효화 헤더 추가
  const newHeaders = new Headers(response.headers);
  
  // 캐시 완전 비활성화
  newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  newHeaders.set('Pragma', 'no-cache');
  newHeaders.set('Expires', '0');
  newHeaders.set('X-Cache-Bust', `v7-${Date.now()}`);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
