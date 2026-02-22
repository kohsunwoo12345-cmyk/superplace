import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  SOLAPI_API_KEY: string;
  SOLAPI_API_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Solapi 카카오톡 채널 카테고리 (기본 데이터)
    const categories = {
      mainCategories: [
        { code: '001', name: '교육' },
        { code: '002', name: '금융/보험' },
        { code: '003', name: '쇼핑/유통' },
        { code: '004', name: '생활/건강' },
        { code: '005', name: '여가/오락' },
        { code: '006', name: '부동산' },
        { code: '007', name: '서비스업' },
        { code: '008', name: '미디어/출판' },
        { code: '009', name: '공공/단체' },
        { code: '010', name: 'IT/전자' },
        { code: '011', name: '음식점' },
        { code: '012', name: '패션/뷰티' },
      ],
      middleCategories: {
        '001': [
          { code: '001001', name: '학원' },
          { code: '001002', name: '교육기관' },
          { code: '001003', name: '온라인교육' },
          { code: '001004', name: '유아교육' },
          { code: '001005', name: '어학' },
          { code: '001006', name: '예체능' },
        ],
        '002': [
          { code: '002001', name: '은행' },
          { code: '002002', name: '증권/투자' },
          { code: '002003', name: '보험' },
          { code: '002004', name: '대부/캐피탈' },
          { code: '002005', name: '카드' },
        ],
        '003': [
          { code: '003001', name: '백화점/마트' },
          { code: '003002', name: '온라인쇼핑몰' },
          { code: '003003', name: '편의점' },
          { code: '003004', name: '가전제품' },
          { code: '003005', name: '식품' },
        ],
        '004': [
          { code: '004001', name: '병원' },
          { code: '004002', name: '약국' },
          { code: '004003', name: '건강식품' },
          { code: '004004', name: '헬스/피트니스' },
        ],
        '011': [
          { code: '011001', name: '한식' },
          { code: '011002', name: '중식' },
          { code: '011003', name: '일식' },
          { code: '011004', name: '양식' },
          { code: '011005', name: '카페/디저트' },
          { code: '011006', name: '패스트푸드' },
        ],
      },
      subCategories: {
        '001001': [
          { code: '001001001', name: '입시학원' },
          { code: '001001002', name: '초중고 보습학원' },
          { code: '001001003', name: '예체능학원' },
          { code: '001001004', name: '직업/취업학원' },
          { code: '001001005', name: '외국어학원' },
          { code: '001001006', name: '컴퓨터/IT학원' },
        ],
        '001002': [
          { code: '001002001', name: '유치원' },
          { code: '001002002', name: '초등학교' },
          { code: '001002003', name: '중학교' },
          { code: '001002004', name: '고등학교' },
          { code: '001002005', name: '대학교' },
          { code: '001002006', name: '대학원' },
        ],
        '001003': [
          { code: '001003001', name: '인터넷강의' },
          { code: '001003002', name: 'VOD강의' },
          { code: '001003003', name: '라이브강의' },
        ],
        '002001': [
          { code: '002001001', name: '시중은행' },
          { code: '002001002', name: '지방은행' },
          { code: '002001003', name: '인터넷은행' },
        ],
        '003002': [
          { code: '003002001', name: '종합쇼핑몰' },
          { code: '003002002', name: '오픈마켓' },
          { code: '003002003', name: '소셜커머스' },
        ],
        '011001': [
          { code: '011001001', name: '일반한식' },
          { code: '011001002', name: '고기/구이' },
          { code: '011001003', name: '찌개/전골' },
          { code: '011001004', name: '분식' },
        ],
        '011005': [
          { code: '011005001', name: '커피전문점' },
          { code: '011005002', name: '베이커리' },
          { code: '011005003', name: '디저트카페' },
          { code: '011005004', name: '아이스크림' },
        ],
      }
    };

    return new Response(JSON.stringify(categories), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to fetch categories:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch categories',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
