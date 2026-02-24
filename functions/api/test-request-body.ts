/**
 * 요청 본문 확인용 테스트
 */
export async function onRequestPost(context: { request: Request }) {
  const body = await context.request.json();
  const { searchId, phoneNumber } = body;
  
  const testBody = {
    searchId: searchId,
    phoneNumber: phoneNumber,
  };
  
  return new Response(
    JSON.stringify({
      success: true,
      receivedBody: body,
      transformedBody: testBody,
      jsonStringified: JSON.stringify(testBody)
    }, null, 2),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
