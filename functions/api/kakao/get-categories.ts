/**
 * 카카오톡 채널 카테고리 조회 API
 * GET /api/kakao/get-categories
 */

interface Env {
  'SOLAPI_API_Key ': string;
  SOLAPI_API_Secret?: string;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;

    if (!SOLAPI_API_Key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SOLAPI API credentials not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi REST API 직접 호출
    const timestamp = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);
    
    console.log('📤 Fetching Kakao channel categories from Solapi v2 API');
    
    const response = await fetch('https://api.solapi.com/kakao/v2/channels/categories', {
      method: 'GET',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Solapi API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch categories: ${response.status}`,
          details: errorData
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const categories = await response.json();
    
    console.log('✅ Categories fetched:', categories);

    return new Response(
      JSON.stringify({ 
        success: true, 
        categories: categories
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch categories' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function generateSignature(secret: string, timestamp: string, salt: string): Promise<string> {
  const message = timestamp + salt;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret || '');
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
