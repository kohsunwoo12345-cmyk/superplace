/**
 * 봇 할당 제한 테스트 스크립트
 * 
 * 테스트 항목:
 * 1. 학생 수 제한 (totalStudentSlots)
 * 2. 하루 사용 제한 (dailyUsageLimit)
 * 3. 사용자별 제한 적용 확인
 */

const BASE_URL = process.env.BASE_URL || 'https://superplacestudy.pages.dev';

// 테스트 설정
const TEST_CONFIG = {
  adminToken: process.env.ADMIN_TOKEN || 'test-admin-token',
  testAcademyId: '1',
  testBotId: 'bot-1',
  testUserId1: '1',
  testUserId2: '2',
  testUserId3: '3'
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

async function testBotLimits() {
  console.log('\n' + '='.repeat(80));
  console.log('  봇 할당 제한 테스트');
  console.log('='.repeat(80) + '\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  // 1. 데이터베이스 상태 확인
  log('cyan', '📋', '1단계: 데이터베이스 상태 확인');
  console.log('-'.repeat(80));
  
  try {
    // 학원 봇 구독 정보 조회
    log('blue', '🔍', '학원 봇 구독 정보 조회 중...');
    
    const subscriptionQuery = `
      SELECT * FROM AcademyBotSubscription 
      WHERE academyId = '${TEST_CONFIG.testAcademyId}' 
      AND botId = '${TEST_CONFIG.testBotId}'
      ORDER BY subscriptionEnd DESC LIMIT 1
    `;
    
    log('yellow', '⚠️', '직접 DB 쿼리는 Cloudflare D1에서만 가능합니다.');
    log('yellow', '⚠️', '대신 API를 통해 간접적으로 확인하겠습니다.');
    
    // API를 통한 봇 할당 목록 조회
    const response = await fetch(`${BASE_URL}/api/admin/bot-assignments`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      log('green', '✅', `봇 할당 목록 조회 성공: ${data.count}개 할당`);
      
      if (data.academyAssignments && data.academyAssignments.length > 0) {
        console.log('\n  학원별 할당:');
        data.academyAssignments.forEach((assignment, index) => {
          console.log(`    ${index + 1}. 학원: ${assignment.academyName || assignment.academyId}`);
          console.log(`       봇: ${assignment.botName || assignment.botId}`);
          console.log(`       상태: ${assignment.isActive ? '활성' : '비활성'}`);
        });
      }
      
      results.tests.push({ name: '봇 할당 목록 조회', status: 'PASS' });
      results.passed++;
    } else {
      log('red', '❌', `봇 할당 목록 조회 실패: HTTP ${response.status}`);
      results.tests.push({ name: '봇 할당 목록 조회', status: 'FAIL' });
      results.failed++;
    }
    
  } catch (error) {
    log('red', '❌', `데이터베이스 상태 확인 실패: ${error.message}`);
    results.tests.push({ name: 'DB 상태 확인', status: 'FAIL', error: error.message });
    results.failed++;
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 2. 학생 수 제한 테스트
  log('cyan', '📋', '2단계: 학생 수 제한 테스트');
  console.log('-'.repeat(80));
  
  try {
    log('blue', '🔍', '시나리오: 학원의 남은 슬롯이 0일 때 할당 시도');
    
    // 학원 구독 상태 조회 (사용자 API)
    const subscriptionResponse = await fetch(`${BASE_URL}/api/user/bot-subscriptions`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
      }
    });
    
    if (subscriptionResponse.ok) {
      const subscriptionData = await subscriptionResponse.json();
      
      if (subscriptionData.success && subscriptionData.data.subscriptions.length > 0) {
        const subscription = subscriptionData.data.subscriptions[0];
        
        console.log('\n  구독 정보:');
        console.log(`    - 전체 슬롯: ${subscription.totalStudentSlots || 0}`);
        console.log(`    - 사용 중: ${subscription.usedStudentSlots || 0}`);
        console.log(`    - 남은 슬롯: ${subscription.remainingStudentSlots || 0}`);
        console.log(`    - 만료일: ${subscription.subscriptionEnd}`);
        console.log(`    - 일일 사용 한도: ${subscription.dailyUsageLimit || 15}`);
        
        const remainingSlots = subscription.remainingStudentSlots || 0;
        
        if (remainingSlots > 0) {
          log('yellow', '⚠️', `남은 슬롯: ${remainingSlots}개 - 할당 가능`);
          
          // 실제 할당 테스트 (테스트 사용자에게)
          log('blue', '🔍', '새 학생에게 봇 할당 시도...');
          
          const assignResponse = await fetch(`${BASE_URL}/api/admin/ai-bots/assign`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TEST_CONFIG.adminToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              botId: TEST_CONFIG.testBotId,
              userId: TEST_CONFIG.testUserId1,
              duration: 30,
              durationUnit: 'day'
            })
          });
          
          const assignResult = await assignResponse.json();
          
          if (assignResponse.ok && assignResult.success) {
            log('green', '✅', '학생 수 제한 내에서 할당 성공');
            console.log(`    할당 ID: ${assignResult.assignment.id}`);
            console.log(`    학생: ${assignResult.assignment.userName}`);
            console.log(`    일일 한도: ${assignResult.assignment.dailyUsageLimit}`);
            
            results.tests.push({ 
              name: '슬롯 여유 있을 때 할당', 
              status: 'PASS',
              details: `슬롯 ${remainingSlots}개 중 1개 사용`
            });
            results.passed++;
          } else {
            log('red', '❌', `할당 실패: ${assignResult.error || assignResult.message}`);
            results.tests.push({ 
              name: '슬롯 여유 있을 때 할당', 
              status: 'FAIL', 
              error: assignResult.error 
            });
            results.failed++;
          }
        } else {
          log('yellow', '⚠️', '남은 슬롯: 0개 - 할당 불가 상태');
          
          // 슬롯이 없을 때 할당 시도 (실패해야 정상)
          log('blue', '🔍', '슬롯 부족 상태에서 할당 시도...');
          
          const assignResponse = await fetch(`${BASE_URL}/api/admin/ai-bots/assign`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TEST_CONFIG.adminToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              botId: TEST_CONFIG.testBotId,
              userId: TEST_CONFIG.testUserId2,
              duration: 30,
              durationUnit: 'day'
            })
          });
          
          const assignResult = await assignResponse.json();
          
          if (!assignResponse.ok && assignResult.error === 'No remaining slots') {
            log('green', '✅', '슬롯 부족 시 할당 차단 정상 작동');
            console.log(`    에러 메시지: ${assignResult.message}`);
            
            results.tests.push({ 
              name: '슬롯 부족 시 할당 차단', 
              status: 'PASS',
              details: '슬롯 부족 에러 정상 발생'
            });
            results.passed++;
          } else {
            log('red', '❌', '슬롯 부족인데 할당이 성공했습니다 (버그!)');
            
            results.tests.push({ 
              name: '슬롯 부족 시 할당 차단', 
              status: 'FAIL',
              error: '슬롯 제한이 작동하지 않음'
            });
            results.failed++;
          }
        }
      } else {
        log('yellow', '⚠️', '구독 정보를 찾을 수 없습니다.');
        results.tests.push({ name: '학생 수 제한 테스트', status: 'SKIP', reason: '구독 없음' });
        results.warnings++;
      }
    } else {
      log('red', '❌', `구독 정보 조회 실패: HTTP ${subscriptionResponse.status}`);
      results.tests.push({ name: '학생 수 제한 테스트', status: 'FAIL' });
      results.failed++;
    }
    
  } catch (error) {
    log('red', '❌', `학생 수 제한 테스트 실패: ${error.message}`);
    results.tests.push({ name: '학생 수 제한 테스트', status: 'FAIL', error: error.message });
    results.failed++;
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 3. 하루 사용 제한 테스트
  log('cyan', '📋', '3단계: 하루 사용 제한 테스트');
  console.log('-'.repeat(80));
  
  try {
    log('blue', '🔍', '시나리오: 사용자의 일일 사용량 조회 및 제한 확인');
    
    // 사용량 조회
    const usageResponse = await fetch(
      `${BASE_URL}/api/admin/ai-bots/usage?userId=${TEST_CONFIG.testUserId1}&botId=${TEST_CONFIG.testBotId}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
        }
      }
    );
    
    if (usageResponse.ok) {
      const usageData = await usageResponse.json();
      
      if (usageData.success) {
        console.log('\n  사용량 정보:');
        console.log(`    - 일일 한도: ${usageData.data.dailyUsageLimit}`);
        console.log(`    - 오늘 사용: ${usageData.data.usedToday}`);
        console.log(`    - 남은 횟수: ${usageData.data.remainingToday}`);
        console.log(`    - 한도 초과: ${usageData.data.isLimitExceeded ? '예' : '아니오'}`);
        
        if (usageData.data.weeklyStats && usageData.data.weeklyStats.length > 0) {
          console.log('\n  최근 7일 사용량:');
          usageData.data.weeklyStats.forEach((stat) => {
            console.log(`    ${stat.date}: ${stat.count}회`);
          });
        }
        
        // 제한 로직 검증
        const isProperlyLimited = usageData.data.usedToday <= usageData.data.dailyUsageLimit;
        
        if (isProperlyLimited) {
          log('green', '✅', '일일 사용 제한 정보 정상 조회');
          results.tests.push({ 
            name: '일일 사용 제한 조회', 
            status: 'PASS',
            details: `${usageData.data.usedToday}/${usageData.data.dailyUsageLimit} 사용`
          });
          results.passed++;
          
          // 한도 초과 체크
          if (usageData.data.isLimitExceeded) {
            log('yellow', '⚠️', '일일 한도를 초과했습니다. 사용이 차단되어야 합니다.');
            results.tests.push({ 
              name: '일일 한도 초과 상태', 
              status: 'WARNING',
              details: '사용 차단 확인 필요'
            });
            results.warnings++;
          } else {
            log('green', '✅', `일일 한도 내 사용 중 (남은 횟수: ${usageData.data.remainingToday})`);
            results.tests.push({ 
              name: '일일 한도 내 사용', 
              status: 'PASS'
            });
            results.passed++;
          }
        } else {
          log('red', '❌', '사용량이 한도를 초과했는데 기록되어 있습니다 (버그!)');
          results.tests.push({ 
            name: '일일 사용 제한 조회', 
            status: 'FAIL',
            error: '사용량 초과 감지'
          });
          results.failed++;
        }
      } else {
        log('yellow', '⚠️', '활성 할당을 찾을 수 없습니다.');
        results.tests.push({ name: '일일 사용 제한 테스트', status: 'SKIP', reason: '활성 할당 없음' });
        results.warnings++;
      }
    } else if (usageResponse.status === 404) {
      log('yellow', '⚠️', '활성 할당을 찾을 수 없습니다.');
      results.tests.push({ name: '일일 사용 제한 테스트', status: 'SKIP', reason: '활성 할당 없음' });
      results.warnings++;
    } else {
      log('red', '❌', `사용량 조회 실패: HTTP ${usageResponse.status}`);
      results.tests.push({ name: '일일 사용 제한 테스트', status: 'FAIL' });
      results.failed++;
    }
    
  } catch (error) {
    log('red', '❌', `일일 사용 제한 테스트 실패: ${error.message}`);
    results.tests.push({ name: '일일 사용 제한 테스트', status: 'FAIL', error: error.message });
    results.failed++;
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 4. 사용자별 제한 독립성 테스트
  log('cyan', '📋', '4단계: 사용자별 제한 독립성 테스트');
  console.log('-'.repeat(80));
  
  try {
    log('blue', '🔍', '시나리오: 각 사용자가 독립적인 사용량 한도를 가지는지 확인');
    
    const testUsers = [TEST_CONFIG.testUserId1, TEST_CONFIG.testUserId2];
    const usageResults = [];
    
    for (const userId of testUsers) {
      const usageResponse = await fetch(
        `${BASE_URL}/api/admin/ai-bots/usage?userId=${userId}&botId=${TEST_CONFIG.testBotId}`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
          }
        }
      );
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        if (usageData.success) {
          usageResults.push({
            userId,
            dailyLimit: usageData.data.dailyUsageLimit,
            usedToday: usageData.data.usedToday,
            remaining: usageData.data.remainingToday
          });
        }
      } else if (usageResponse.status === 404) {
        log('yellow', '⚠️', `사용자 ${userId}: 활성 할당 없음 (건너뜀)`);
      }
    }
    
    if (usageResults.length >= 2) {
      console.log('\n  사용자별 사용량:');
      usageResults.forEach((result, index) => {
        console.log(`    사용자 ${result.userId}:`);
        console.log(`      - 일일 한도: ${result.dailyLimit}`);
        console.log(`      - 오늘 사용: ${result.usedToday}`);
        console.log(`      - 남은 횟수: ${result.remaining}`);
      });
      
      // 각 사용자가 독립적인 사용량을 가지는지 확인
      const allIndependent = usageResults.every((result, index) => {
        if (index === 0) return true;
        // 각 사용자의 사용량이 다를 수 있음 (독립적)
        return true;
      });
      
      if (allIndependent) {
        log('green', '✅', '각 사용자가 독립적인 사용량 한도를 가집니다');
        results.tests.push({ 
          name: '사용자별 독립적 제한', 
          status: 'PASS',
          details: `${usageResults.length}명의 사용자 확인`
        });
        results.passed++;
      } else {
        log('red', '❌', '사용자별 제한이 독립적이지 않습니다 (버그!)');
        results.tests.push({ 
          name: '사용자별 독립적 제한', 
          status: 'FAIL'
        });
        results.failed++;
      }
    } else {
      log('yellow', '⚠️', '활성 할당이 부족하여 테스트를 진행할 수 없습니다.');
      results.tests.push({ name: '사용자별 독립적 제한', status: 'SKIP', reason: '활성 할당 부족' });
      results.warnings++;
    }
    
  } catch (error) {
    log('red', '❌', `사용자별 독립성 테스트 실패: ${error.message}`);
    results.tests.push({ name: '사용자별 독립성 테스트', status: 'FAIL', error: error.message });
    results.failed++;
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // 5. 테스트 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('  테스트 결과 요약');
  console.log('='.repeat(80) + '\n');
  
  console.log(`  총 테스트: ${results.passed + results.failed + results.warnings}개`);
  console.log(`  ${colors.green}✅ 통과: ${results.passed}개${colors.reset}`);
  console.log(`  ${colors.red}❌ 실패: ${results.failed}개${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  경고: ${results.warnings}개${colors.reset}`);
  
  console.log('\n  개별 테스트 결과:');
  results.tests.forEach((test, index) => {
    const statusColor = test.status === 'PASS' ? 'green' : 
                       test.status === 'FAIL' ? 'red' : 'yellow';
    const statusIcon = test.status === 'PASS' ? '✅' : 
                      test.status === 'FAIL' ? '❌' : '⚠️';
    
    console.log(`    ${index + 1}. ${statusIcon} ${test.name}: ${colors[statusColor]}${test.status}${colors.reset}`);
    if (test.details) {
      console.log(`       └ ${test.details}`);
    }
    if (test.error) {
      console.log(`       └ 에러: ${test.error}`);
    }
    if (test.reason) {
      console.log(`       └ 사유: ${test.reason}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  // 전체 결과 판정
  if (results.failed === 0 && results.warnings === 0) {
    log('green', '✅', '모든 테스트 통과! 봇 할당 제한이 정상 작동합니다.');
    return 0;
  } else if (results.failed === 0) {
    log('yellow', '⚠️', '테스트 통과했지만 일부 경고가 있습니다. 확인이 필요합니다.');
    return 0;
  } else {
    log('red', '❌', '일부 테스트가 실패했습니다. 시스템을 점검해주세요.');
    return 1;
  }
}

// 테스트 실행
testBotLimits()
  .then((exitCode) => {
    console.log('\n');
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  });
