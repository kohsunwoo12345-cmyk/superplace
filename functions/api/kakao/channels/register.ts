import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      phoneNumber,
      channelName,
      businessNumber,
      categoryCode,
      mainCategory,
      middleCategory,
      subCategory
    } = body;

    // 입력 검증
    if (!phoneNumber || !channelName || !categoryCode) {
      return new Response(JSON.stringify({ 
        error: 'Required fields missing',
        message: '전화번호, 채널명, 카테고리는 필수입니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: 사용자 인증 및 정보 가져오기
    const userId = 'user-id';
    const userName = 'User Name';

    // Solapi API 인증 정보
    const apiKey = env.SOLAPI_API_KEY;
    const apiSecret = env.SOLAPI_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('Solapi API credentials not found');
      return new Response(JSON.stringify({ 
        error: 'API configuration error',
        message: 'Solapi API 키가 설정되지 않았습니다.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Solapi API 호출을 위한 HMAC 서명 생성
    const timestamp = Date.now().toString();
    const salt = Math.random().toString(36).substring(2, 15);
    
    // HMAC-SHA256 서명 생성
    const signature = await generateHmacSignature(apiSecret, timestamp + salt);

    // Solapi API로 카카오 채널 등록 요청
    const solapiResponse = await fetch('https://api.solapi.com/kakao/v1/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        name: channelName,
        categoryCode: categoryCode,
        businessNumber: businessNumber || null
      })
    });

    if (!solapiResponse.ok) {
      const errorData = await solapiResponse.json();
      console.error('Solapi API error:', errorData);
      throw new Error(errorData.message || 'Solapi API 호출 실패');
    }

    const solapiData = await solapiResponse.json();
    
    // 채널 ID 생성
    const channelId = `kakao_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    // DB에 채널 정보 저장
    await env.DB.prepare(`
      INSERT INTO KakaoChannel (
        id, userId, userName, phoneNumber, channelName,
        categoryCode, mainCategory, middleCategory, subCategory,
        businessNumber, solapiChannelId, status,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      channelId, userId, userName, phoneNumber, channelName,
      categoryCode, mainCategory, middleCategory, subCategory,
      businessNumber, solapiData.channelId || channelId,
      now, now
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      channelId,
      message: '카카오 채널이 등록되었습니다. 승인까지 1-2일 소요됩니다.',
      solapiData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to register Kakao channel:', error);
    return new Response(JSON.stringify({ 
      error: 'Registration failed',
      message: error.message || '카카오 채널 등록에 실패했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// HMAC-SHA256 서명 생성 함수
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
  
  // ArrayBuffer를 hex string으로 변환
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
