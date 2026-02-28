/**
 * 카카오톡 채널 연동(추가) API
 * POST /api/kakao/create-channel
 */

interface Env {
  'SOLAPI_API_Key ': string;  // 주의: 끝에 공백이 있는 환경변수명
  SOLAPI_API_Secret?: string;
  DB: any;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const SOLAPI_API_Key = context.env['SOLAPI_API_Key '];  // 공백 포함
    const SOLAPI_API_Secret = context.env.SOLAPI_API_Secret;
    const DB = context.env.DB;

    if (!SOLAPI_API_Key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SOLAPI API credentials not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { searchId, phoneNumber, categoryCode, token, userId, userName, channelName } = body;

    console.log('🔍 Received request body:', {
      searchId,
      searchIdType: typeof searchId,
      phoneNumber,
      phoneNumberType: typeof phoneNumber,
      categoryCode,
      categoryCodeType: typeof categoryCode,
      token,
      tokenType: typeof token,
      rawBody: JSON.stringify(body)
    });

    // categoryCode는 필수 필드입니다 (Solapi API 요구사항)
    if (!searchId || !phoneNumber || !categoryCode || !token) {
      console.error('❌ Missing required fields:', {
        hasSearchId: !!searchId,
        hasPhoneNumber: !!phoneNumber,
        hasCategoryCode: !!categoryCode,
        hasToken: !!token
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Required fields: searchId, phoneNumber, categoryCode, token',
          received: { searchId: !!searchId, phoneNumber: !!phoneNumber, categoryCode: !!categoryCode, token: !!token }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solapi API는 @ 기호 없이 순수 검색용 ID만 요구
    // 프론트엔드에서 이미 처리했지만 안전을 위해 다시 확인
    const cleanSearchId = searchId.startsWith('@') ? searchId.substring(1) : searchId;

    // Solapi REST API 직접 호출
    const timestamp = new Date().toISOString();  // ISO 8601 형식
    const salt = Math.random().toString(36).substring(2);
    const signature = await generateSignature(SOLAPI_API_Secret, timestamp, salt);
    
    // Request body 구성 (categoryCode는 필수)
    const requestBody = {
      searchId: cleanSearchId,
      phoneNumber: phoneNumber,
      categoryCode: categoryCode,
      token: token,
    };
    
    console.log('📤 Solapi API request (v2) - FULL DETAILS:', {
      url: 'https://api.solapi.com/kakao/v2/channels',
      method: 'POST',
      requestBody: requestBody,
      requestBodyStringified: JSON.stringify(requestBody),
      originalSearchId: searchId,
      cleanSearchId: cleanSearchId,
      searchIdCleaned: cleanSearchId !== searchId,
      hasApiKey: !!SOLAPI_API_Key,
      hasApiSecret: !!SOLAPI_API_Secret,
      timestamp: timestamp,
      categoryCodeValue: categoryCode,
      categoryCodeType: typeof categoryCode,
      tokenValue: token,
      tokenType: typeof token
    });
    
    const response = await fetch('https://api.solapi.com/kakao/v2/channels', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_Key}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Solapi API error - FULL DETAILS:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        requestUrl: 'https://api.solapi.com/kakao/v2/channels',
        requestMethod: 'POST',
        requestHeaders: {
          hasAuth: true,
          contentType: 'application/json'
        },
        requestBody: {
          originalSearchId: searchId,
          cleanSearchId: cleanSearchId, 
          phoneNumber, 
          categoryCode,
          categoryCodeType: typeof categoryCode,
          token: '***',
          tokenType: typeof token
        }
      });
      
      let errorMessage = `Failed to create channel: ${response.status}`;
      let userFriendlyMessage = '';
      
      try {
        const errorJson = JSON.parse(errorData);
        console.error('❌ Parsed error JSON:', errorJson);
        
        if (errorJson.errorMessage) {
          errorMessage = errorJson.errorMessage;
          
          // 카테고리 관련 에러 상세 처리
          if (errorMessage.includes('카테고리')) {
            userFriendlyMessage = `카테고리 오류: ${errorMessage}

전송된 카테고리 코드: ${categoryCode}
카테고리 타입: ${typeof categoryCode}

가능한 원인:
1. 카테고리 코드가 Solapi에서 지원하지 않는 형식
2. 카테고리 코드가 비어있거나 null
3. 잘못된 카테고리 코드 값

Step 1에서 선택한 카테고리를 다시 확인해주세요.`;
          }
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        console.error('❌ Error parsing error response:', e);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userFriendlyMessage || errorMessage,
          details: errorData,
          debug: { 
            originalSearchId: searchId,
            cleanSearchId: cleanSearchId,
            phoneNumber, 
            categoryCode,
            categoryCodeType: typeof categoryCode,
            tokenLength: token?.toString().length,
            tokenType: typeof token,
            requestUrl: 'https://api.solapi.com/kakao/v2/channels',
            responseStatus: response.status
          }
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    // DB에 채널 정보 저장
    if (DB && userId) {
      try {
        const channelId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const pfId = result.pfId || result.plusFriendId || result.id || '';
        
        // 카테고리 정보 파싱 (예: "00200020001" -> "교육,학원,오프라인학원")
        const categoryName = result.categoryName || '';
        const categoryParts = categoryName.split(',');
        
        await DB.prepare(`
          INSERT INTO KakaoChannel (
            id, userId, userName, phoneNumber, channelName, searchId,
            categoryCode, mainCategory, middleCategory, subCategory,
            solapiChannelId, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          channelId,
          userId,
          userName || 'Unknown',
          phoneNumber,
          channelName || cleanSearchId,
          cleanSearchId,  // @ 기호가 제거된 순수 ID 저장
          categoryCode,
          categoryParts[0] || '',  // 대분류
          categoryParts[1] || '',  // 중분류
          categoryParts[2] || '',  // 소분류
          pfId,
          'ACTIVE'
        ).run();
        
        console.log(`✅ Channel saved to DB: ${channelId}, pfId: ${pfId}`);
      } catch (dbError) {
        console.error('❌ Failed to save channel to DB:', dbError);
        // DB 저장 실패해도 Solapi 연동은 성공했으므로 계속 진행
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '카카오톡 채널이 성공적으로 연동되었습니다!',
        channel: result 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating channel:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create channel' 
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
