// Kakao Categories API (Solapi)
export async function onRequest(context: any) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle trailing spaces in env var names
    const SOLAPI_API_KEY = env['SOLAPI_API_Key '] || env.SOLAPI_API_Key || env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      console.error('❌ Solapi credentials not configured');
      
      // Return hardcoded categories as fallback
      const hardcodedCategories = [
        {
          code: '건강',
          name: '건강',
          subcategories: [
            { code: '00100010001', name: '건강,병원,종합병원' },
            { code: '00100010002', name: '건강,병원,피부과' },
            { code: '00100010017', name: '건강,병원,한의원' },
            { code: '00100020001', name: '건강,약국,약국' },
          ],
        },
        {
          code: '교육',
          name: '교육',
          subcategories: [
            { code: '00200020001', name: '교육,학원,오프라인학원' },
            { code: '00200020002', name: '교육,학원,온라인학원' },
            { code: '00200010001', name: '교육,학교,유치원' },
            { code: '00200030001', name: '교육,교육원,어린이집/평생교육원/문화센터' },
          ],
        },
        {
          code: '미용',
          name: '미용',
          subcategories: [
            { code: '00500010001', name: '미용,미용,헤어샵' },
            { code: '00500010002', name: '미용,미용,뷰티케어샵/체형클리닉' },
            { code: '00500010004', name: '미용,미용,뷰티/화장품' },
          ],
        },
        {
          code: '소매(쇼핑몰)',
          name: '소매(쇼핑몰)',
          subcategories: [
            { code: '00600040001', name: '소매(쇼핑몰),식품,식품' },
            { code: '00600050001', name: '소매(쇼핑몰),의류,의류' },
            { code: '00600060001', name: '소매(쇼핑몰),패션잡화,패션잡화' },
          ],
        },
        {
          code: '음식점',
          name: '음식점',
          subcategories: [
            { code: '01100010001', name: '음식점,음식점,음식점' },
            { code: '01100020001', name: '음식점,제과/제빵,제과/제빵' },
            { code: '01100040001', name: '음식점,카페,카페' },
            { code: '01100050001', name: '음식점,프랜차이즈,프랜차이즈' },
          ],
        },
        {
          code: '컴퓨터',
          name: '컴퓨터',
          subcategories: [
            { code: '01300010001', name: '컴퓨터,소프트웨어/솔루션,소프트웨어/솔루션' },
            { code: '01300020001', name: '컴퓨터,컴퓨터수리/보수,컴퓨터수리/보수' },
          ],
        },
        {
          code: '기타서비스',
          name: '기타서비스',
          subcategories: [
            { code: '02100020001', name: '기타서비스,업무알림' },
          ],
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          categories: hardcodedCategories,
          source: 'hardcoded',
          message: 'Using hardcoded categories (Solapi credentials not configured)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to fetch from Solapi API
    try {
      const response = await fetch('https://api.solapi.com/kakao/v2/plus-friends/categories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Solapi API returned ${response.status}`);
      }

      const data = await response.json();
      
      return new Response(
        JSON.stringify({
          success: true,
          categories: data.categories || data,
          source: 'solapi'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (solapiError: any) {
      console.error('❌ Solapi API error, returning hardcoded:', solapiError);
      
      // Fallback to hardcoded categories
      const hardcodedCategories = [
        {
          code: '건강',
          name: '건강',
          subcategories: [
            { code: '00100010001', name: '건강,병원,종합병원' },
            { code: '00100010002', name: '건강,병원,피부과' },
            { code: '00100010017', name: '건강,병원,한의원' },
            { code: '00100020001', name: '건강,약국,약국' },
          ],
        },
        {
          code: '교육',
          name: '교육',
          subcategories: [
            { code: '00200020001', name: '교육,학원,오프라인학원' },
            { code: '00200020002', name: '교육,학원,온라인학원' },
            { code: '00200010001', name: '교육,학교,유치원' },
            { code: '00200030001', name: '교육,교육원,어린이집/평생교육원/문화센터' },
          ],
        },
        {
          code: '미용',
          name: '미용',
          subcategories: [
            { code: '00500010001', name: '미용,미용,헤어샵' },
            { code: '00500010002', name: '미용,미용,뷰티케어샵/체형클리닉' },
            { code: '00500010004', name: '미용,미용,뷰티/화장품' },
          ],
        },
        {
          code: '소매(쇼핑몰)',
          name: '소매(쇼핑몰)',
          subcategories: [
            { code: '00600040001', name: '소매(쇼핑몰),식품,식품' },
            { code: '00600050001', name: '소매(쇼핑몰),의류,의류' },
            { code: '00600060001', name: '소매(쇼핑몰),패션잡화,패션잡화' },
          ],
        },
        {
          code: '음식점',
          name: '음식점',
          subcategories: [
            { code: '01100010001', name: '음식점,음식점,음식점' },
            { code: '01100020001', name: '음식점,제과/제빵,제과/제빵' },
            { code: '01100040001', name: '음식점,카페,카페' },
            { code: '01100050001', name: '음식점,프랜차이즈,프랜차이즈' },
          ],
        },
        {
          code: '컴퓨터',
          name: '컴퓨터',
          subcategories: [
            { code: '01300010001', name: '컴퓨터,소프트웨어/솔루션,소프트웨어/솔루션' },
            { code: '01300020001', name: '컴퓨터,컴퓨터수리/보수,컴퓨터수리/보수' },
          ],
        },
        {
          code: '기타서비스',
          name: '기타서비스',
          subcategories: [
            { code: '02100020001', name: '기타서비스,업무알림' },
          ],
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          categories: hardcodedCategories,
          source: 'hardcoded',
          message: 'Using hardcoded categories (Solapi API failed)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Get categories error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch categories',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
