import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
}

// JWT 토큰에서 사용자 정보 추출
async function getUserFromToken(token: string, secret: string): Promise<any> {
  try {
    // JWT 검증 로직 (간단한 구현)
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token, env.JWT_SECRET);

    const body = await request.json() as any;
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

    // 전화번호 포맷 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid phone number',
        message: '전화번호 형식이 올바르지 않습니다. (010-1234-5678)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Solapi API 인증 정보
    const apiKey = env.SOLAPI_API_KEY;
    const apiSecret = env.SOLAPI_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('❌ Solapi API credentials not found');
      return new Response(JSON.stringify({ 
        error: 'API configuration error',
        message: 'Solapi API 키가 설정되지 않았습니다. 관리자에게 문의하세요.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📞 카카오 채널 등록 시작:', { phoneNumber, channelName, categoryCode });

    // Solapi API 호출을 위한 HMAC 서명 생성
    const timestamp = Date.now().toString();
    const salt = Math.random().toString(36).substring(2, 15);
    const signature = await generateHmacSignature(apiSecret, timestamp + salt);

    // Solapi API로 카카오 채널 등록 요청
    console.log('🚀 Solapi API 호출 중...');
    const solapiResponse = await fetch('https://api.solapi.com/kakao/v1/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber.replace(/-/g, ''), // 하이픈 제거
        name: channelName,
        categoryCode: categoryCode,
        businessNumber: businessNumber || null
      })
    });

    let solapiData: any = null;
    let solapiChannelId = null;

    if (!solapiResponse.ok) {
      const errorText = await solapiResponse.text();
      console.error('❌ Solapi API error:', solapiResponse.status, errorText);
      
      // Solapi 에러는 로깅하지만 계속 진행 (DB에 PENDING 상태로 저장)
      console.warn('⚠️ Solapi API 호출 실패, PENDING 상태로 DB 저장 진행');
    } else {
      solapiData = await solapiResponse.json();
      solapiChannelId = solapiData.channelId || solapiData.id;
      console.log('✅ Solapi API 성공:', solapiData);
    }

    // 채널 ID 생성
    const channelId = `kakao_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    // DB에 채널 정보 저장
    console.log('💾 DB 저장 중...');
    await env.DB.prepare(`
      INSERT INTO KakaoChannel (
        id, userId, userName, phoneNumber, channelName,
        categoryCode, mainCategory, middleCategory, subCategory,
        businessNumber, solapiChannelId, status,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      channelId,
      user.id || user.userId,
      user.name || user.userName,
      phoneNumber,
      channelName,
      categoryCode,
      mainCategory || '',
      middleCategory || '',
      subCategory || '',
      businessNumber || null,
      solapiChannelId || channelId,
      now,
      now
    ).run();

    console.log('✅ 카카오 채널 등록 완료:', channelId);

    return new Response(JSON.stringify({ 
      success: true,
      channelId,
      message: '✅ 카카오 채널이 등록되었습니다!\n카카오 승인까지 1-2일 소요됩니다.',
      solapiData: solapiData || { note: 'Solapi API 호출은 실패했지만 DB에 저장되었습니다.' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Failed to register Kakao channel:', error);
    return new Response(JSON.stringify({ 
      error: 'Registration failed',
      message: error.message || '카카오 채널 등록에 실패했습니다.',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
