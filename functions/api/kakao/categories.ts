// Solapi Category Groups and Categories API
// GET /api/kakao/categories - 카테고리 그룹 및 카테고리 목록 조회

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
    // Solapi 카테고리 정보 (2024년 기준)
    const categoryGroups = [
      {
        groupCode: '00',
        groupName: '기타',
        categories: [
          { code: '008', name: '기타' },
        ]
      },
      {
        groupCode: '01',
        groupName: '배송',
        categories: [
          { code: '001', name: '배송 시작' },
          { code: '002', name: '배송 완료' },
          { code: '003', name: '배송 지연' },
        ]
      },
      {
        groupCode: '02',
        groupName: '예약',
        categories: [
          { code: '004', name: '예약 확인' },
          { code: '005', name: '예약 취소' },
        ]
      },
      {
        groupCode: '03',
        groupName: '결제/거래',
        categories: [
          { code: '006', name: '결제 완료' },
          { code: '007', name: '환불' },
        ]
      },
      {
        groupCode: '04',
        groupName: '리포트',
        categories: [
          { code: '012', name: '리포트' },
        ]
      },
      {
        groupCode: '05',
        groupName: '이벤트/혜택',
        categories: [
          { code: '013', name: '이벤트' },
          { code: '014', name: '쿠폰' },
        ]
      },
      {
        groupCode: '06',
        groupName: '인증',
        categories: [
          { code: '015', name: '본인 인증' },
          { code: '016', name: '비밀번호 변경' },
        ]
      },
      {
        groupCode: '07',
        groupName: '등록',
        categories: [
          { code: '017', name: '가입 완료' },
          { code: '018', name: '신청 접수' },
        ]
      },
      {
        groupCode: '08',
        groupName: '안내',
        categories: [
          { code: '019', name: '서비스 안내' },
          { code: '020', name: '정보 변경 안내' },
          { code: '021', name: '일정 안내' },
        ]
      },
      {
        groupCode: '09',
        groupName: '처리',
        categories: [
          { code: '022', name: '처리 완료' },
          { code: '023', name: '처리 지연' },
        ]
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        categoryGroups,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Get categories error:', error);
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
