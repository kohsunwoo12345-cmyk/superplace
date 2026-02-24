/**
 * 카카오톡 채널 카테고리 조회 API
 * GET /api/kakao/channel-categories
 */

import { SolapiMessageService } from 'solapi';

export async function onRequestGet(context: any) {
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

    const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const categories = await messageService.getKakaoChannelCategories();

    return new Response(
      JSON.stringify({ 
        success: true, 
        categories: categories.map((cat: any) => ({
          code: cat.code,
          name: cat.name
        }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching channel categories:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch categories' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
