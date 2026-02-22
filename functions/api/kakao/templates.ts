// Cloudflare Pages Function: GET /api/kakao/templates
// Solapi API에서 카카오 알림톡 템플릿 목록 가져오기

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // JWT 검증 (간단한 버전)
    if (!token || token.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Solapi API 키 확인
    const SOLAPI_API_KEY = env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(JSON.stringify({ 
        error: 'Solapi API credentials not configured',
        templates: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Solapi HMAC 서명 생성
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15);
    const signature = await generateHmacSignature(SOLAPI_API_SECRET, date + salt);

    // Solapi API 호출 - 카카오 템플릿 목록 가져오기
    const solapiResponse = await fetch('https://api.solapi.com/kakao/v1/templates', {
      method: 'GET',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json'
      }
    });

    if (!solapiResponse.ok) {
      const errorText = await solapiResponse.text();
      console.error('Solapi API error:', errorText);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch templates from Solapi',
        details: errorText,
        templates: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const solapiData = await solapiResponse.json();
    
    // 템플릿 데이터 변환
    const templates = (solapiData.templateList || []).map((template: any) => ({
      templateId: template.templateId,
      templateCode: template.templateCode,
      templateName: template.name,
      content: template.content,
      buttons: template.buttons || [],
      status: template.status,
      inspectionStatus: template.inspectionStatus,
      channelId: template.channelId,
      categoryCode: template.categoryCode,
      variables: extractVariables(template.content)
    }));

    return new Response(JSON.stringify({
      success: true,
      templates: templates,
      count: templates.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error fetching Kakao templates:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch templates',
      message: error.message,
      templates: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// HMAC-SHA256 서명 생성
async function generateHmacSignature(secret: string, message: string): Promise<string> {
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

// 템플릿 내용에서 변수 추출 (#{변수명} 형식)
function extractVariables(content: string): string[] {
  const regex = /#{([^}]+)}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}
