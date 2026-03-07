// Alimtalk Template Registration & Status Check API
// POST /api/kakao/templates/register - Solapi에 템플릿 등록 신청
// GET /api/kakao/templates/status?templateId=xxx - 승인 상태 조회

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// Create HMAC signature for Solapi
async function createSolapiSignature(apiSecret: string) {
  const dateTime = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const hmacData = dateTime + salt;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(hmacData);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { dateTime, salt, signature: signatureHex };
}

// POST: Solapi에 템플릿 등록 신청
export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const {
      userId,
      channelId,
      pfId,              // 카카오 채널 PF ID (예: @학원이름)
      templateCode,      // 사용자가 정한 템플릿 코드 (예: TEST_001)
      templateName,      // 템플릿 이름
      content,           // 템플릿 내용
      categoryCode,      // 카테고리 코드 (예: 008, 012 등)
      messageType,       // BA (기본형), EX (부가정보형), AD (광고추가형), MI (복합형)
      emphasizeType,     // NONE, TEXT, IMAGE
      buttons,           // 버튼 배열
      extra,             // 부가정보 (강조 유형일 때)
      securityFlag,      // 보안 템플릿 여부
      variables,         // 변수 목록 (배열)
    } = body;

    console.log('📝 템플릿 등록 신청:', { userId, channelId, pfId, templateCode, templateName });

    if (!userId || !channelId || !pfId || !templateCode || !templateName || !content) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: userId, channelId, pfId, templateCode, templateName, content' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Solapi credentials (정확한 환경 변수명 사용)
    const SOLAPI_API_KEY = env.SOLAPI_API_Key;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solapi credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create HMAC signature
    const { dateTime, salt, signature } = await createSolapiSignature(SOLAPI_API_SECRET);

    // Prepare template data for Solapi
    const templateData: any = {
      pfId: pfId,
      templateId: templateCode,
      name: templateName,
      content: content,
      categoryCode: categoryCode || '008', // Default to 일반 카테고리
      messageType: messageType || 'BA',
      securityFlag: securityFlag || false
    };

    // Add buttons if provided
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      templateData.buttons = buttons.map((btn: any) => ({
        ordering: btn.ordering || 1,
        type: btn.type || 'WL', // WL (웹링크), AL (앱링크), BK (봇키워드), MD (메시지전달)
        name: btn.name,
        linkMo: btn.linkMo || btn.url,
        linkPc: btn.linkPc || btn.url,
        linkIos: btn.linkIos,
        linkAnd: btn.linkAnd
      }));
    }

    // Add emphasize type and extra if provided
    if (emphasizeType && emphasizeType !== 'NONE') {
      templateData.emphasizeType = emphasizeType;
      if (extra) {
        templateData.extra = extra;
      }
    }

    console.log('🚀 Solapi API 호출:', templateData);

    // Call Solapi API to register template
    const solapiResponse = await fetch('https://api.solapi.com/kakao/v1/templates', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${dateTime}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });

    const solapiData = await solapiResponse.json();

    console.log('📥 Solapi 응답:', {
      status: solapiResponse.status,
      ok: solapiResponse.ok,
      data: solapiData
    });

    if (!solapiResponse.ok) {
      // Solapi API 에러
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: solapiData.errorMessage || 'Solapi template registration failed',
          details: solapiData,
          code: solapiData.errorCode
        }),
        { status: solapiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to local database
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO AlimtalkTemplate (
        id, userId, channelId, templateCode, templateName, content,
        categoryCode, messageType, emphasizeType, buttons, quickReplies, variables,
        solapiTemplateId, status, inspectionStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      channelId,
      templateCode,
      templateName,
      content,
      categoryCode || '008',
      messageType || 'BA',
      emphasizeType || 'NONE',
      buttons ? JSON.stringify(buttons) : null,
      null,
      variables ? JSON.stringify(variables) : null,
      templateCode,
      'ACTIVE',
      solapiData.status || 'PENDING', // Solapi 응답의 상태 저장
      now,
      now
    ).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        template: {
          id,
          templateCode,
          templateName,
          status: solapiData.status,
          inspectionStatus: solapiData.inspectionStatus
        },
        solapi: solapiData,
        message: '템플릿이 Solapi에 등록 신청되었습니다. 카카오 승인 대기 중입니다.'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ 템플릿 등록 오류:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// GET: 템플릿 승인 상태 조회
export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const templateId = url.searchParams.get('templateId'); // 템플릿 코드
    const pfId = url.searchParams.get('pfId');             // 카카오 채널 PF ID
    const userId = url.searchParams.get('userId');

    if (!templateId || !pfId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'templateId and pfId are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 템플릿 상태 조회:', { templateId, pfId });

    // Get Solapi credentials (정확한 환경 변수명 사용)
    const SOLAPI_API_KEY = env.SOLAPI_API_Key;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solapi credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create HMAC signature
    const { dateTime, salt, signature } = await createSolapiSignature(SOLAPI_API_SECRET);

    // Call Solapi API to get template status
    const solapiResponse = await fetch(
      `https://api.solapi.com/kakao/v1/templates/${pfId}/${templateId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${dateTime}, salt=${salt}, signature=${signature}`,
        }
      }
    );

    const solapiData = await solapiResponse.json();

    console.log('📥 Solapi 템플릿 상태:', solapiData);

    if (!solapiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: solapiData.errorMessage || 'Failed to get template status',
          details: solapiData
        }),
        { status: solapiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update local database with latest status
    if (userId) {
      try {
        await env.DB.prepare(`
          UPDATE AlimtalkTemplate
          SET inspectionStatus = ?, updatedAt = ?
          WHERE userId = ? AND templateCode = ?
        `).bind(
          solapiData.inspectionStatus || solapiData.status,
          new Date().toISOString(),
          userId,
          templateId
        ).run();
      } catch (dbError) {
        console.error('⚠️ DB 업데이트 실패:', dbError);
        // Continue anyway - DB update is not critical
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        template: solapiData,
        inspectionStatus: solapiData.inspectionStatus,
        status: solapiData.status,
        isApproved: solapiData.inspectionStatus === 'APR', // APR = 승인됨
        statusMessage: getStatusMessage(solapiData.inspectionStatus)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ 템플릿 상태 조회 오류:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// 승인 상태 메시지
function getStatusMessage(status: string): string {
  const statusMap: { [key: string]: string } = {
    'REQ': '등록 대기',
    'REG': '검수 대기',
    'APR': '승인됨 ✅',
    'REJ': '반려됨 ❌',
    'REV': '재검수 요청',
    'PENDING': '검수 대기',
  };
  return statusMap[status] || status;
}
