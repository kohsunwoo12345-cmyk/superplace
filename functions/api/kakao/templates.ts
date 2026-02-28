/**
 * 알림톡 템플릿 관리 API
 * POST /api/kakao/templates - 템플릿 생성
 * GET /api/kakao/templates?userId={userId}&channelId={channelId} - 템플릿 목록 조회
 * PUT /api/kakao/templates - 템플릿 수정
 * DELETE /api/kakao/templates?templateId={templateId}&userId={userId} - 템플릿 삭제
 */

interface Env {
  'SOLAPI_API_Key ': string;
  SOLAPI_API_Secret?: string;
  DB: any;
}

interface Button {
  buttonName: string;
  buttonType: string;
  linkMo?: string;
  linkPc?: string;
  linkAnd?: string;
  linkIos?: string;
}

interface QuickReply {
  name: string;
  linkType: string;
  linkMo?: string;
  linkPc?: string;
}

/**
 * 템플릿 생성
 */
export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;
    const DB = context.env.DB;

    if (!SOLAPI_API_Key) {
      return new Response(
        JSON.stringify({ success: false, error: 'SOLAPI API credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const {
      userId,
      channelId,
      solapiChannelId,
      templateName,
      content,
      categoryCode,
      buttons,
      quickReplies,
      messageType,
      emphasizeType,
      emphasizeTitle,
      emphasizeSubTitle,
    } = body;

    console.log('📤 Creating Solapi template:', {
      templateName,
      solapiChannelId,
      categoryCode,
      contentLength: content?.length,
      hasButtons: !!buttons,
      hasQuickReplies: !!quickReplies,
    });

    if (!userId || !channelId || !solapiChannelId || !templateName || !content || !categoryCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Required fields: userId, channelId, solapiChannelId, templateName, content, categoryCode',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi REST API 직접 호출
    const timestamp = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);

    const requestBody: any = {
      name: templateName,
      content: content,
      channelId: solapiChannelId,
      categoryCode: categoryCode,
    };

    // 선택적 필드 추가
    if (buttons && buttons.length > 0) {
      requestBody.buttons = buttons;
    }
    if (quickReplies && quickReplies.length > 0) {
      requestBody.quickReplies = quickReplies;
    }
    if (messageType) {
      requestBody.messageType = messageType;
    }
    if (emphasizeType && emphasizeType !== 'NONE') {
      requestBody.emphasizeType = emphasizeType;
      if (emphasizeTitle) requestBody.emphasizeTitle = emphasizeTitle;
      if (emphasizeSubTitle) requestBody.emphasizeSubTitle = emphasizeSubTitle;
    }

    console.log('📤 Solapi create template request:', {
      url: 'https://api.solapi.com/kakao/v2/templates',
      body: requestBody,
    });

    const response = await fetch('https://api.solapi.com/kakao/v2/templates', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Solapi template creation error:', {
        status: response.status,
        errorData,
      });

      let errorMessage = `Failed to create template: ${response.status}`;
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
    console.log('✅ Solapi template created:', result);

    // DB에 템플릿 정보 저장
    if (DB) {
      try {
        const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const solapiTemplateId = result.templateId || result.id || '';
        const templateCode = result.templateCode || result.code || '';

        // content에서 변수 추출 (#{변수명} 형식)
        const variableMatches = content.match(/#\{([^}]+)\}/g) || [];
        const variables = variableMatches.map((v: string) => v.slice(2, -1));

        await DB.prepare(`
          INSERT INTO KakaoAlimtalkTemplate (
            id, userId, channelId, solapiChannelId, solapiTemplateId, 
            templateCode, templateName, content, categoryCode,
            messageType, emphasizeType, buttons, quickReplies, variables,
            status, inspectionStatus, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          templateId,
          userId,
          channelId,
          solapiChannelId,
          solapiTemplateId,
          templateCode,
          templateName,
          content,
          categoryCode,
          messageType || 'BA',
          emphasizeType || 'NONE',
          buttons ? JSON.stringify(buttons) : null,
          quickReplies ? JSON.stringify(quickReplies) : null,
          JSON.stringify(variables),
          'PENDING',  // 초기 상태: 대기(검수 필요)
          result.status || 'PENDING'
        ).run();

        console.log(`✅ Template saved to DB: ${templateId}`);
      } catch (dbError) {
        console.error('❌ Failed to save template to DB:', dbError);
        // DB 저장 실패해도 Solapi 생성은 성공했으므로 계속 진행
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '템플릿이 성공적으로 생성되었습니다. 검수를 요청하세요.',
        template: result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error creating template:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create template',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 템플릿 목록 조회
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const DB = context.env.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const channelId = url.searchParams.get('channelId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let query = `
      SELECT 
        id, userId, channelId, solapiChannelId, solapiTemplateId,
        templateCode, templateName, content, categoryCode,
        messageType, emphasizeType, buttons, quickReplies, variables,
        status, inspectionStatus, approvedAt, rejectedReason,
        createdAt, updatedAt
      FROM KakaoAlimtalkTemplate
      WHERE userId = ?
    `;
    const params: any[] = [userId];

    if (channelId) {
      query += ' AND channelId = ?';
      params.push(channelId);
    }

    query += ' ORDER BY createdAt DESC';

    const templates = await DB.prepare(query).bind(...params).all();

    console.log(`✅ Found ${templates.results.length} templates for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        templates: templates.results || [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error fetching templates:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch templates',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 템플릿 삭제
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
      SELECT solapiTemplateId FROM KakaoAlimtalkTemplate
      WHERE id = ? AND userId = ?
    `).bind(templateId, userId).first();

    if (!template || !template.solapiTemplateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi에서 템플릿 삭제
    const timestamp = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);

    const response = await fetch(
      `https://api.solapi.com/kakao/v2/templates/${template.solapiTemplateId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      console.error('❌ Solapi template deletion error:', response.status);
      // Solapi 삭제 실패해도 DB에서는 삭제 처리
    }

    // DB에서 템플릿 삭제
    await DB.prepare(`
      DELETE FROM KakaoAlimtalkTemplate
      WHERE id = ? AND userId = ?
    `).bind(templateId, userId).run();

    console.log(`✅ Template ${templateId} deleted`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Template deleted successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error deleting template:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to delete template',
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
