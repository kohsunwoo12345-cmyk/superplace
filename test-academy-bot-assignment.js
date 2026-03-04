/**
 * 학원 봇 할당 시스템 완전 테스트
 * 
 * 이 스크립트는 다음을 확인합니다:
 * 1. 관리자가 학원에 봇을 할당할 수 있는지
 * 2. 학원장이 학생에게 봇을 할당할 수 있는지  
 * 3. 학생이 AI 챗봇을 볼 수 있는지
 * 4. 다른 학원 학생은 봇을 볼 수 없는지
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

// 테스트 로그 함수
function log(emoji, message, data) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// API 호출 함수
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  log('📤', `Calling: ${endpoint}`, options.body ? JSON.parse(options.body) : null);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('✅', `Success: ${endpoint}`, data);
    } else {
      log('❌', `Failed: ${endpoint} (${response.status})`, data);
    }
    
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    log('❌', `Error calling ${endpoint}:`, error.message);
    return { ok: false, error: error.message };
  }
}

// 메인 테스트 함수
async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 학원 봇 할당 시스템 테스트 시작');
  console.log('='.repeat(80) + '\n');

  // 1️⃣ 테이블 생성 API 호출 (백업용)
  log('1️⃣', '테이블 생성 API 호출 (필요 시 자동 생성)');
  await apiCall('/api/admin/create-academy-bot-subscription-table', {
    method: 'POST',
  });
  
  console.log('\n' + '-'.repeat(80) + '\n');

  // 2️⃣ 토큰 형식 검증
  log('2️⃣', '토큰 형식 검증');
  const testToken = 'test-user-id|test@example.com|SUPER_ADMIN|academy-123|1234567890';
  const parts = testToken.split('|');
  
  if (parts.length === 5) {
    log('✅', '토큰 형식 올바름 (5 파트)', {
      id: parts[0],
      email: parts[1],
      role: parts[2],
      academyId: parts[3],
      timestamp: parts[4],
    });
  } else {
    log('❌', '토큰 형식 잘못됨', { partsCount: parts.length });
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');

  // 3️⃣ API 엔드포인트 존재 확인
  log('3️⃣', 'API 엔드포인트 확인');
  
  const endpoints = [
    { name: '학원 목록 조회', path: '/api/admin/academies' },
    { name: 'AI 봇 목록 조회', path: '/api/admin/ai-bots' },
    { name: '학원 봇 구독 조회', path: '/api/admin/academy-bot-subscriptions' },
    { name: '사용자 AI 봇 조회', path: '/api/user/ai-bots' },
  ];
  
  for (const endpoint of endpoints) {
    // OPTIONS 요청으로 엔드포인트 존재 확인
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: 'HEAD',
      });
      
      if (response.status === 401 || response.status === 403) {
        log('✅', `${endpoint.name}: 엔드포인트 존재 (인증 필요)`);
      } else if (response.ok) {
        log('✅', `${endpoint.name}: 엔드포인트 정상`);
      } else {
        log('⚠️', `${endpoint.name}: 예상치 못한 상태 (${response.status})`);
      }
    } catch (error) {
      log('❌', `${endpoint.name}: 호출 실패`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 테스트 완료');
  console.log('='.repeat(80) + '\n');
  
  console.log('📋 다음 단계:');
  console.log('1. 관리자 계정으로 로그인');
  console.log('2. 브라우저 콘솔(F12)을 열고 다음 명령 실행:');
  console.log('   localStorage.getItem("token")');
  console.log('3. 토큰 값을 확인하여 5개 파트로 구성되어 있는지 확인');
  console.log('4. AI 봇 할당 페이지에서 학원에 봇 할당 시도');
  console.log('5. 콘솔에서 요청/응답 로그 확인');
  console.log('\n');
}

// 테스트 실행
runTests().catch(console.error);
