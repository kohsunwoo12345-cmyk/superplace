// Solapi API 테스트 스크립트
const { SolapiMessageService } = require('solapi');

// 환경변수에서 API 키 읽기 (실제 사용 시)
const API_KEY = process.env.SOLAPI_API_KEY || 'YOUR_API_KEY';
const API_SECRET = process.env.SOLAPI_API_SECRET || 'YOUR_API_SECRET';

async function testKakaoChannelFlow() {
  console.log('🚀 Solapi 카카오 채널 연동 테스트 시작\n');

  if (API_KEY === 'YOUR_API_KEY' || API_SECRET === 'YOUR_API_SECRET') {
    console.log('❌ 환경변수를 설정해주세요:');
    console.log('   export SOLAPI_API_KEY="your_api_key"');
    console.log('   export SOLAPI_API_SECRET="your_api_secret"\n');
    console.log('📝 Solapi 계정이 없다면:');
    console.log('   1. https://solapi.com 회원가입');
    console.log('   2. API 키 발급 (무료 크레딧 제공)');
    console.log('   3. 카카오 비즈니스 채널 준비\n');
    return;
  }

  try {
    const messageService = new SolapiMessageService(API_KEY, API_SECRET);

    // 1단계: 카테고리 조회
    console.log('📋 Step 1: 카카오 채널 카테고리 조회');
    const categories = await messageService.getKakaoChannelCategories();
    console.log(`✅ 카테고리 ${categories.length}개 조회 성공`);
    console.log('   예시:', categories.slice(0, 3).map(c => c.name).join(', '), '...\n');

    // 2단계: 인증번호 요청 (실제 SMS 발송)
    console.log('📱 Step 2: 인증번호 요청');
    console.log('   ⚠️ 실제 SMS가 발송됩니다!');
    console.log('   테스트 데이터:');
    const testData = {
      searchId: '@test_channel',  // 실제 채널 ID로 변경
      phoneNumber: '01012345678', // 실제 휴대전화 번호로 변경
    };
    console.log('   - 채널 ID:', testData.searchId);
    console.log('   - 휴대전화:', testData.phoneNumber);
    console.log('\n   실제 발송을 원하면 아래 주석을 해제하세요:\n');
    console.log('   // const result = await messageService.requestKakaoChannelToken(testData);');
    console.log('   // console.log("✅ 인증번호 발송 성공:", result);\n');

    // 3단계: 채널 연동 (인증번호 필요)
    console.log('🔗 Step 3: 채널 연동');
    console.log('   인증번호를 받은 후 아래 형식으로 호출:');
    console.log('   await messageService.createKakaoChannel({');
    console.log('     searchId: "@your_channel",');
    console.log('     phoneNumber: "01012345678",');
    console.log('     categoryCode: categories[0].code,');
    console.log('     token: "123456" // SMS로 받은 인증번호');
    console.log('   });\n');

    console.log('✅ 테스트 완료!');
    console.log('💡 실제 사용을 위해 웹 페이지를 이용하세요:');
    console.log('   https://superplacestudy.pages.dev/dashboard/kakao-channel/register\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n💡 문제 해결:');
    console.log('   1. API 키가 올바른지 확인');
    console.log('   2. Solapi 크레딧이 충분한지 확인');
    console.log('   3. 네트워크 연결 상태 확인\n');
  }
}

// 테스트 실행
testKakaoChannelFlow();
