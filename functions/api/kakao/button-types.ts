// Solapi Alimtalk Button Types API
// GET /api/kakao/button-types - 알림톡 버튼 타입 목록 조회

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

export async function onRequestGet() {
  try {
    // Solapi 알림톡 버튼 타입 (공식 문서 기준)
    const buttonTypes = [
      {
        type: 'WL',
        name: '웹 링크',
        description: '웹 URL로 이동',
        requiresUrl: true,
        urlFields: ['linkMo', 'linkPc']
      },
      {
        type: 'AL',
        name: '앱 링크',
        description: '앱 실행 또는 앱스토어 이동',
        requiresUrl: true,
        urlFields: ['linkMo', 'linkPc', 'linkIos', 'linkAnd']
      },
      {
        type: 'DS',
        name: '배송 조회',
        description: '배송 조회 화면으로 이동',
        requiresUrl: false,
        urlFields: []
      },
      {
        type: 'BK',
        name: '봇 키워드',
        description: '챗봇에 키워드 전송',
        requiresUrl: false,
        urlFields: []
      },
      {
        type: 'MD',
        name: '메시지 전달',
        description: '메시지를 상담원에게 전달',
        requiresUrl: false,
        urlFields: []
      },
      {
        type: 'BC',
        name: '상담톡 전환',
        description: '상담톡으로 전환',
        requiresUrl: false,
        urlFields: []
      },
      {
        type: 'BT',
        name: '봇 전환',
        description: '챗봇으로 전환',
        requiresUrl: false,
        urlFields: []
      },
      {
        type: 'AC',
        name: '채널 추가',
        description: '카카오톡 채널 추가',
        requiresUrl: false,
        urlFields: []
      }
    ];

    return new Response(
      JSON.stringify({
        success: true,
        buttonTypes,
        count: buttonTypes.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Get button types error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
