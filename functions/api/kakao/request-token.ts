/**
 * 카카오톡 채널 연동 토큰 요청 API
 * POST /api/kakao/request-token
 */

import { SolapiMessageService } from 'solapi';

export async function onRequestPost(context: any) {
  try {
    const { SOLAPI_API_KEY, SOLAPI_API_SECRET } = context.env;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SOLAPI API credentials not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { searchId, phoneNumber } = body;

    if (!searchId || !phoneNumber) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'searchId and phoneNumber are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const result = await messageService.requestKakaoChannelToken({
      searchId,
      phoneNumber,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '연동 토큰이 담당자 휴대전화로 전송되었습니다.',
        result 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error requesting channel token:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to request token' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
