// Alimtalk Templates List API
// GET /api/kakao/templates/list?pfId=xxx&userId=yyy - Solapi에서 템플릿 목록 조회

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

// GET: Solapi에서 템플릿 목록 조회
export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const pfId = url.searchParams.get('pfId');         // 카카오 채널 PF ID
    const userId = url.searchParams.get('userId');     // 사용자 ID (로컬 DB 연동용)
    const channelId = url.searchParams.get('channelId'); // 채널 ID (로컬 DB 연동용)

    if (!pfId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'pfId is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 템플릿 목록 조회:', { pfId, userId, channelId });

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

    // Call Solapi API to get templates list
    const solapiResponse = await fetch(
      `https://api.solapi.com/kakao/v1/templates?pfId=${pfId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${dateTime}, salt=${salt}, signature=${signature}`,
        }
      }
    );

    const solapiData = await solapiResponse.json();

    console.log('📥 Solapi 템플릿 목록:', {
      status: solapiResponse.status,
      count: solapiData.length || 0
    });

    if (!solapiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: solapiData.errorMessage || 'Failed to get templates',
          details: solapiData
        }),
        { status: solapiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge with local DB templates if userId provided
    let templates = solapiData || [];

    if (userId && channelId && env.DB) {
      try {
        // Sync Solapi templates to local DB
        for (const solapiTemplate of templates) {
          // Check if template exists in local DB
          const existing = await env.DB.prepare(`
            SELECT id FROM AlimtalkTemplate 
            WHERE userId = ? AND channelId = ? AND templateCode = ?
          `).bind(userId, channelId, solapiTemplate.templateId).first();

          if (!existing) {
            // Insert new template from Solapi
            const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await env.DB.prepare(`
              INSERT INTO AlimtalkTemplate (
                id, userId, channelId, templateCode, templateName, content,
                categoryCode, messageType, emphasizeType, buttons,
                solapiTemplateId, status, inspectionStatus, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              id,
              userId,
              channelId,
              solapiTemplate.templateId,
              solapiTemplate.name,
              solapiTemplate.content,
              solapiTemplate.categoryCode,
              solapiTemplate.messageType,
              solapiTemplate.emphasizeType || 'NONE',
              solapiTemplate.buttons ? JSON.stringify(solapiTemplate.buttons) : null,
              solapiTemplate.templateId,
              'ACTIVE',
              solapiTemplate.inspectionStatus,
              new Date().toISOString(),
              new Date().toISOString()
            ).run();
          } else {
            // Update existing template status
            await env.DB.prepare(`
              UPDATE AlimtalkTemplate
              SET inspectionStatus = ?, updatedAt = ?
              WHERE userId = ? AND channelId = ? AND templateCode = ?
            `).bind(
              solapiTemplate.inspectionStatus,
              new Date().toISOString(),
              userId,
              channelId,
              solapiTemplate.templateId
            ).run();
          }
        }
      } catch (dbError) {
        console.error('⚠️ DB 동기화 실패:', dbError);
        // Continue anyway
      }
    }

    // Add status messages to templates
    const templatesWithStatus = templates.map((t: any) => ({
      ...t,
      isApproved: t.inspectionStatus === 'APR',
      statusMessage: getStatusMessage(t.inspectionStatus),
      canUse: t.inspectionStatus === 'APR' // 승인된 템플릿만 사용 가능
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        templates: templatesWithStatus,
        count: templatesWithStatus.length,
        approvedCount: templatesWithStatus.filter((t: any) => t.isApproved).length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ 템플릿 목록 조회 오류:', error);
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
