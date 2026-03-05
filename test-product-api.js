#!/usr/bin/env node

/**
 * 🧪 제품 생성 API 테스트 스크립트
 * 
 * 사용법:
 * 1. localStorage에서 token 복사
 * 2. TOKEN 환경 변수로 설정
 * 3. node test-product-api.js
 */

const API_BASE = 'https://superplacestudy.pages.dev';

// 환경변수에서 토큰 읽기
const TOKEN = process.env.TOKEN || '';

if (!TOKEN) {
  console.log('❌ TOKEN 환경변수가 설정되지 않았습니다.');
  console.log('\n사용법:');
  console.log('1. 브라우저에서 https://superplacestudy.pages.dev 접속');
  console.log('2. F12 → Application → Local Storage → token 복사');
  console.log('3. TOKEN="your-token-here" node test-product-api.js\n');
  process.exit(1);
}

// 토큰 파싱 및 검증
function parseToken(token) {
  const parts = token.split('|');
  if (parts.length < 3) {
    console.log('❌ 잘못된 토큰 형식입니다. (형식: id|email|role|academyId)');
    return null;
  }
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null
  };
}

const tokenData = parseToken(TOKEN);
if (!tokenData) {
  process.exit(1);
}

console.log('🔐 토큰 정보:');
console.log(`  - ID: ${tokenData.id}`);
console.log(`  - Email: ${tokenData.email}`);
console.log(`  - Role: ${tokenData.role}`);
console.log(`  - Academy ID: ${tokenData.academyId || '(없음)'}`);
console.log('');

if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
  console.log('❌ 권한 부족: SUPER_ADMIN 또는 ADMIN 역할이 필요합니다.');
  console.log('현재 역할:', tokenData.role);
  console.log('\n해결 방법:');
  console.log('Cloudflare D1 콘솔에서 다음 SQL 실행:');
  console.log(`UPDATE User SET role = 'SUPER_ADMIN' WHERE email = '${tokenData.email}';`);
  process.exit(1);
}

console.log('✅ 권한 확인 완료\n');

// 테스트 제품 데이터
const testProduct = {
  name: `테스트 제품 ${Date.now()}`,
  category: 'ai-bot',
  section: 'premium',
  description: '이것은 API 테스트를 위한 제품입니다.',
  shortDescription: 'API 테스트 제품',
  price: 50000,
  monthlyPrice: 5000,
  yearlyPrice: 50000,
  pricePerStudent: 10000,
  originalPrice: 60000,
  discountType: 'percentage',
  discountValue: 10,
  promotionType: 'none',
  promotionDescription: '',
  promotionStartDate: '',
  promotionEndDate: '',
  badges: 'NEW,HOT',
  isTimeDeal: 0,
  stockQuantity: 100,
  maxPurchasePerUser: 10,
  features: '기능1\n기능2\n기능3',
  detailHtml: '<h1>상세 설명</h1><p>테스트 제품입니다.</p>',
  imageUrl: '/images/test-product.jpg',
  botId: 'bot-test-001',
  isActive: 1,
  isFeatured: 0,
  displayOrder: 0,
  keywords: '테스트,AI,봇'
};

console.log('📦 테스트 제품 정보:');
console.log(JSON.stringify(testProduct, null, 2));
console.log('');

// API 호출
async function createProduct() {
  console.log('🚀 제품 생성 API 호출 중...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/store-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(testProduct)
    });

    console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 제품 생성 성공!');
      console.log('생성된 제품 ID:', data.productId);
      console.log('\n다음 URL에서 확인:');
      console.log(`${API_BASE}/dashboard/admin/ai-bots`);
    } else {
      console.log('❌ 제품 생성 실패');
      console.log('에러 응답:', JSON.stringify(data, null, 2));
      
      if (data.message) {
        console.log('\n🔍 에러 메시지:', data.message);
      }
      
      if (data.details) {
        console.log('\n📋 상세 정보:');
        console.log(data.details);
      }
      
      // 에러 유형별 해결 방법 제시
      console.log('\n💡 해결 방법:');
      
      if (data.message && data.message.includes('D1_ERROR')) {
        console.log('1. Cloudflare Dashboard → Workers & Pages → superplacestudy');
        console.log('2. Settings → Bindings');
        console.log('3. D1 Database Bindings 확인 (변수명: DB)');
        console.log('4. 없으면 Add binding으로 D1 데이터베이스 연결');
      }
      
      if (data.message && data.message.includes('column')) {
        console.log('1. Cloudflare D1 콘솔 접속');
        console.log('2. StoreProducts 테이블 재생성 (test-product-creation-error.md 참조)');
      }
      
      if (data.message && data.message.includes('bind parameter')) {
        console.log('1. INSERT 문의 컬럼 개수 확인');
        console.log('2. .bind() 인자 개수 확인');
        console.log('3. 두 개수가 일치해야 함 (현재: 32개)');
      }
    }
  } catch (error) {
    console.log('❌ 네트워크 오류:', error.message);
    console.log('\n가능한 원인:');
    console.log('- 인터넷 연결 문제');
    console.log('- Cloudflare Pages 다운');
    console.log('- 잘못된 API URL');
  }
}

// 제품 목록 조회
async function listProducts() {
  console.log('\n📋 제품 목록 조회 중...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/store-products`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ 총 ${data.products.length}개 제품 발견`);
      
      if (data.products.length > 0) {
        console.log('\n최근 제품 5개:');
        data.products.slice(0, 5).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (${product.id})`);
          console.log(`     카테고리: ${product.category}, 가격: ${product.price}원`);
        });
      } else {
        console.log('제품이 없습니다.');
      }
    } else {
      console.log('❌ 제품 목록 조회 실패:', data);
    }
  } catch (error) {
    console.log('❌ 네트워크 오류:', error.message);
  }
}

// 메인 실행
(async () => {
  await createProduct();
  await listProducts();
  
  console.log('\n' + '='.repeat(60));
  console.log('테스트 완료');
  console.log('='.repeat(60));
})();
