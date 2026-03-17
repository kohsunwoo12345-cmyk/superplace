// 브라우저에서 실행할 테스트 스크립트
// 1. 로그인 상태 확인
// 2. 토큰 확인
// 3. 발신번호 신청 테스트

console.log('=== 발신번호 403 에러 디버깅 ===\n');

// localStorage에서 토큰 가져오기
const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

if (!token) {
  console.log('❌ 토큰이 없습니다. 로그인이 필요합니다.');
} else {
  console.log('✅ 토큰 발견:', token);
  console.log('토큰 파트 수:', token.split('|').length);
  console.log('토큰 내용:', token.split('|'));
}

// 토큰 파싱 테스트
function parseToken(token) {
  const parts = token.split('|');
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts.length >= 4 ? parts[3] : undefined,
    timestamp: parts.length >= 5 ? parts[4] : undefined
  };
}

if (token) {
  const parsed = parseToken(token);
  console.log('\n파싱된 토큰 정보:', parsed);
}

// API 테스트 (실제로 발신번호 신청하지는 않음)
async function testAPI() {
  if (!token) return;
  
  try {
    const response = await fetch('https://superplacestudy.pages.dev/api/sender-number/register', {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\nOPTIONS 요청 결과:', response.status, response.statusText);
  } catch (error) {
    console.log('\nAPI 테스트 에러:', error.message);
  }
}

testAPI();

console.log('\n=== 다음 단계 ===');
console.log('1. 위 토큰 정보를 확인하세요');
console.log('2. 로그아웃 후 다시 로그인 해보세요');
console.log('3. 그래도 안되면 개발자에게 토큰 정보를 전달해주세요');
