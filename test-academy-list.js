#!/usr/bin/env node

/**
 * 학원 목록 표시 완전 테스트
 * 
 * 1. 학원 관리 페이지에서 학원 목록 표시
 * 2. AI 봇 할당 페이지에서 학원 드롭다운 표시
 * 3. 토큰 파싱 정상 작동 확인
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

// 테스트용 토큰 (실제로는 로그인 후 얻음)
const TEST_TOKEN = 'test-user-id|test@example.com|SUPER_ADMIN|academy-123|1234567890';

function log(emoji, message, data) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testAPI(endpoint, token) {
  const url = `${BASE_URL}${endpoint}`;
  log('📤', `Testing: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    log('📥', `Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      log('✅', 'Success', data);
      return { ok: true, data };
    } else {
      log('❌', 'Failed', data);
      return { ok: false, data };
    }
  } catch (error) {
    log('❌', 'Error', { message: error.message });
    return { ok: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🏫 학원 목록 표시 테스트');
  console.log('='.repeat(80) + '\n');

  // 1️⃣ 토큰 형식 확인
  log('1️⃣', '토큰 형식 검증');
  const parts = TEST_TOKEN.split('|');
  if (parts.length === 5) {
    log('✅', '토큰 형식 올바름', {
      id: parts[0],
      email: parts[1],
      role: parts[2],
      academyId: parts[3],
      timestamp: parts[4],
    });
  } else {
    log('❌', '토큰 형식 잘못됨');
    return;
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 2️⃣ 학원 목록 API 테스트
  log('2️⃣', '학원 목록 API 테스트');
  const academiesResult = await testAPI('/api/admin/academies', TEST_TOKEN);
  
  if (academiesResult.ok && academiesResult.data?.academies) {
    const academies = academiesResult.data.academies;
    log('✅', `학원 ${academies.length}개 조회 성공`);
    
    if (academies.length > 0) {
      log('📋', '첫 번째 학원 정보', {
        id: academies[0].id,
        name: academies[0].name,
        address: academies[0].address,
        studentCount: academies[0].studentCount,
        teacherCount: academies[0].teacherCount,
      });
    } else {
      log('⚠️', '학원 데이터가 없습니다. 데이터베이스에 학원을 추가하세요.');
    }
  } else {
    log('❌', '학원 목록 조회 실패');
    log('💡', '실제 토큰으로 로그인 후 테스트하세요');
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 3️⃣ AI 봇 목록 API 테스트
  log('3️⃣', 'AI 봇 목록 API 테스트');
  const botsResult = await testAPI('/api/admin/ai-bots', TEST_TOKEN);
  
  if (botsResult.ok && botsResult.data?.bots) {
    const bots = botsResult.data.bots;
    log('✅', `AI 봇 ${bots.length}개 조회 성공`);
    
    if (bots.length > 0) {
      const activeBots = bots.filter(b => b.isActive);
      log('📋', `활성 봇 ${activeBots.length}개`, {
        firstBot: activeBots[0] ? {
          id: activeBots[0].id,
          name: activeBots[0].name,
          model: activeBots[0].model,
        } : null
      });
    }
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 4️⃣ 학원 봇 구독 API 테스트
  log('4️⃣', '학원 봇 구독 API 테스트');
  const subscriptionsResult = await testAPI('/api/admin/academy-bot-subscriptions', TEST_TOKEN);
  
  if (subscriptionsResult.ok) {
    const count = subscriptionsResult.data?.count || 0;
    log('✅', `구독 ${count}개 조회 성공`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 테스트 완료');
  console.log('='.repeat(80) + '\n');
  
  console.log('📋 실제 사용자 테스트 방법:');
  console.log('1. 관리자 계정으로 로그인');
  console.log('2. 사이드바 → "학원 관리" 클릭');
  console.log('3. 학원 목록이 표시되는지 확인');
  console.log('4. 사이드바 → "AI 봇 할당하기" 클릭');
  console.log('5. "학원 전체" 옵션 선택');
  console.log('6. 학원 드롭다운에서 학원 목록 확인 (주소 포함)');
  console.log('7. F12 콘솔에서 "✅ Academies loaded" 메시지 확인');
  console.log('\n');
}

runTests().catch(console.error);
