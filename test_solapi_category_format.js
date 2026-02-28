/**
 * Solapi 카카오 플러스친구 카테고리 코드 형식 테스트
 * 
 * 문제: categoryCode: 'CS02' 전송 → "카테고리를 선택해주세요" 에러
 * 
 * 가능한 원인:
 * 1. 카테고리 코드 형식이 잘못됨 (CS02 vs 다른 형식)
 * 2. Solapi API가 다른 필드명을 요구함
 * 3. 카테고리 선택이 아예 불필요함 (옵션)
 */

console.log('=== Solapi 카테고리 코드 형식 분석 ===\n');

// 우리가 사용하는 형식
console.log('현재 사용 중인 카테고리 코드:');
console.log('- CS02 (교육 > 학원)');
console.log('- PH01 (의료/건강 > 병원/의원)');
console.log('- FD02 (음식/외식 > 중식)');
console.log('');

// Solapi API 실제 요구사항 확인
console.log('🔍 Solapi API 실제 요구사항:');
console.log('');
console.log('1. 카카오 플러스친구 등록 API');
console.log('   POST https://api.solapi.com/kakao/v1/plus-friends');
console.log('');
console.log('2. 필수 파라미터:');
console.log('   - searchId: 채널 검색용 ID (예: @channelid)');
console.log('   - phoneNumber: 담당자 휴대전화 (예: 01012345678)');
console.log('   - token: 인증번호 (예: 123456)');
console.log('   - categoryCode: ??? (형식 불명)');
console.log('');

console.log('3. categoryCode 가능한 형식:');
console.log('   a) 문자열 코드: "CS02", "PH01" 등');
console.log('   b) 숫자 코드: "001", "002" 등');
console.log('   c) 긴 숫자 코드: "002001001" 등');
console.log('   d) 카테고리 이름: "학원", "병원" 등');
console.log('   e) 영문 이름: "education", "hospital" 등');
console.log('');

console.log('4. 테스트 필요:');
console.log('   - Solapi API 문서 확인');
console.log('   - 실제 카테고리 조회 API 호출');
console.log('   - 정확한 categoryCode 형식 확인');
console.log('');

console.log('5. 해결 방법:');
console.log('   ① categoryCode를 아예 제거하고 테스트');
console.log('   ② Solapi 실제 문서의 예시 코드 확인');
console.log('   ③ Solapi 고객지원에 문의');
console.log('');

// 현재 전송되는 데이터
const currentRequest = {
  searchId: '꾸메땅학원',
  phoneNumber: '01085328739',
  categoryCode: 'CS02',
  token: '123456'
};

console.log('📤 현재 전송 중인 데이터:');
console.log(JSON.stringify(currentRequest, null, 2));
console.log('');

console.log('❌ 에러 메시지: "카테고리를 선택해주세요"');
console.log('→ Solapi가 "CS02"를 유효한 카테고리로 인식하지 못함');
console.log('');

console.log('💡 해결 방안:');
console.log('1. categoryCode를 제거하고 요청 (선택사항일 가능성)');
console.log('2. Solapi 공식 문서에서 정확한 카테고리 코드 확인');
console.log('3. Solapi API 응답의 상세 에러 메시지 확인');
