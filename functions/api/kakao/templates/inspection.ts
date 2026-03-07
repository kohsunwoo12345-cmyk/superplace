/**
 * 알림톡 템플릿 검수 관리 API
 * POST /api/kakao/templates/inspection - 검수 요청
 * DELETE /api/kakao/templates/inspection - 검수 취소
 */

interface Env {
  'SOLAPI_API_Key ': string;
  SOLAPI_API_Secret?: string;
  DB: any;
}

/**
 * 템플릿 검수 요청
 * POST /api/kakao/templates/inspection
 */
export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;
    const DB = context.env.DB;

    if (!SOLAPI_API_Key || !DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'API credentials or database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { templateId, userId } = body;

    if (!templateId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'templateId and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DB에서 템플릿 정보 조회
    const template = await DB.prepare(`
      SELECT solapiTemplateId, status FROM KakaoAlimtalkTemplate
      WHERE id = ? AND userId = ?
    `).bind(templateId, userId).first();

    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (template.status !== 'PENDING') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `템플릿 상태가 PENDING이 아닙니다. 현재 상태: ${template.status}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!template.solapiTemplateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solapi template ID not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi 검수 요청 API 호출
    const timestamp = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);

    const response = await fetch(
      `https://api.solapi.com/kakao/v2/templates/${template.solapiTemplateId}/request-inspection`,
      {
        method: 'POST',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Solapi inspection request error:', {
        status: response.status,
        errorData,
      });

      let errorMessage = `Failed to request inspection: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.errorMessage || errorJson.message || errorMessage;
      } catch (e) {
        // ignore parse error
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: errorData,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('✅ Inspection requested:', result);

    // DB 상태 업데이트
    await DB.prepare(`
      UPDATE KakaoAlimtalkTemplate
      SET status = 'INSPECTING', inspectionStatus = ?, updatedAt = datetime('now')
      WHERE id = ? AND userId = ?
    `).bind(result.status || 'INSPECTING', templateId, userId).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '검수 요청이 완료되었습니다. 카카오 승인까지 최대 3영업일이 소요될 수 있습니다.',
        result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error requesting inspection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to request inspection',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 템플릿 검수 취소
 * DELETE /api/kakao/templates/inspection?templateId={templateId}&userId={userId}
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;
    const DB = context.env.DB;

    if (!SOLAPI_API_Key || !DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'API credentials or database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(context.request.url);
    const templateId = url.searchParams.get('templateId');
    const userId = url.searchParams.get('userId');

    if (!templateId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'templateId and userId parameters are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DB에서 템플릿 정보 조회
    const template = await DB.prepare(`
      SELECT solapiTemplateId, status FROM KakaoAlimtalkTemplate
      WHERE id = ? AND userId = ?
    `).bind(templateId, userId).first();

    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (template.status !== 'INSPECTING') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `검수중 상태가 아닙니다. 현재 상태: ${template.status}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!template.solapiTemplateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solapi template ID not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi 검수 취소 API 호출
    const timestamp = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);

    const response = await fetch(
      `https://api.solapi.com/kakao/v2/templates/${template.solapiTemplateId}/cancel-inspection`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Solapi inspection cancel error:', {
        status: response.status,
        errorData,
      });

      let errorMessage = `Failed to cancel inspection: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.errorMessage || errorJson.message || errorMessage;
      } catch (e) {
        // ignore parse error
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: errorData,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('✅ Inspection cancelled:', result);

    // DB 상태 업데이트
    await DB.prepare(`
      UPDATE KakaoAlimtalkTemplate
      SET status = 'PENDING', inspectionStatus = NULL, updatedAt = datetime('now')
      WHERE id = ? AND userId = ?
    `).bind(templateId, userId).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '검수 요청이 취소되었습니다. 템플릿을 수정할 수 있습니다.',
        result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error cancelling inspection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to cancel inspection',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function generateSignature(secret: string, timestamp: string, salt: string): Promise<string> {
  const message = timestamp + salt;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
