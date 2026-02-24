/**
 * 카카오톡 채널 연동(추가) API
 * POST /api/kakao/create-channel
 */

import { SolapiMessageService } from 'solapi';

export async function onRequestPost(context: any) {
  try {
    const { SOLAPI_API_KEY, SOLAPI_API_SECRET, DB } = context.env;

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
    const { searchId, phoneNumber, categoryCode, token } = body;

    if (!searchId || !phoneNumber || !categoryCode || !token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'All fields are required: searchId, phoneNumber, categoryCode, token' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const result = await messageService.createKakaoChannel({
      searchId,
      phoneNumber,
      categoryCode,
      token,
    });

    // DB에 채널 정보 저장
    if (DB) {
      try {
        await DB.prepare(`
          INSERT OR REPLACE INTO KakaoChannels (
            searchId, phoneNumber, categoryCode, pfId, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          searchId,
          phoneNumber,
          categoryCode,
          result.pfId || '',
          'active'
        ).run();
      } catch (dbError) {
        console.error('Failed to save channel to DB:', dbError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '카카오톡 채널이 성공적으로 연동되었습니다.',
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
