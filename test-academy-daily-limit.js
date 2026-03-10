/**
 * 학원 전체 할당 및 일일 한도 테스트 스크립트
 * 
 * 테스트 시나리오:
 * 1. 학원 전체 할당 (50명 학생)
 * 2. 학생당 일일 15회 제한 확인
 * 3. 학원장 일일 15회 제한 확인
 * 4. 제한 초과 시 에러 처리 확인
 */

const API_URL = 'https://superplacestudy.pages.dev/api/ai/chat';

// 테스트 설정
const TEST_CONFIG = {
  academyId: 'test-academy-001',
  directorId: 'director-001',
  botId: 'test-bot-academy-wide',
  studentCount: 50,
  dailyLimit: 15
};

/**
 * AI 채팅 API 호출
 */
async function callChatAPI(userId, botId, message, isDirector = false) {
  try {
    const requestBody = {
      userId: userId,
      botId: botId,
      message: message,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 100
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now();

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      status: response.status,
      response: result.response,
      usage: result.usage
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 학생 한 명의 일일 사용량 테스트
 */
async function testStudentDailyLimit(studentId, expectedLimit = 15) {
  console.log(`\n👨‍🎓 학생 ${studentId} 일일 한도 테스트 (제한: ${expectedLimit}회)`);
  
  let successCount = 0;
  let limitReached = false;

  // 제한 횟수 + 2회 시도 (초과 테스트)
  for (let i = 1; i <= expectedLimit + 2; i++) {
    const result = await callChatAPI(
      studentId,
      TEST_CONFIG.botId,
      `테스트 메시지 ${i}번`
    );

    if (result.success) {
      successCount++;
      console.log(`   ✓ 요청 ${i}: 성공 (총 ${successCount}회)`);
    } else {
      if (result.status === 429 || result.error?.includes('limit') || result.error?.includes('초과')) {
        limitReached = true;
        console.log(`   ⛔ 요청 ${i}: 한도 초과 (${result.status})`);
        break;
      } else {
        console.log(`   ✗ 요청 ${i}: 에러 - ${result.error}`);
      }
    }

    // Rate limit 방지
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const passed = successCount === expectedLimit && limitReached;
  
  console.log(`\n   결과: ${successCount}/${expectedLimit}회 사용`);
  console.log(`   한도 감지: ${limitReached ? '✅' : '❌'}`);
  console.log(`   테스트: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

  return {
    studentId,
    successCount,
    limitReached,
    passed
  };
}

/**
 * 학원장 일일 한도 테스트
 */
async function testDirectorDailyLimit(expectedLimit = 15) {
  console.log(`\n👔 학원장 일일 한도 테스트 (제한: ${expectedLimit}회)`);
  
  let successCount = 0;
  let limitReached = false;

  for (let i = 1; i <= expectedLimit + 2; i++) {
    const result = await callChatAPI(
      TEST_CONFIG.directorId,
      TEST_CONFIG.botId,
      `학원장 테스트 메시지 ${i}번`,
      true
    );

    if (result.success) {
      successCount++;
      console.log(`   ✓ 요청 ${i}: 성공 (총 ${successCount}회)`);
    } else {
      if (result.status === 429 || result.error?.includes('limit') || result.error?.includes('초과')) {
        limitReached = true;
        console.log(`   ⛔ 요청 ${i}: 한도 초과 (${result.status})`);
        break;
      } else {
        console.log(`   ✗ 요청 ${i}: 에러 - ${result.error}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const passed = successCount === expectedLimit && limitReached;
  
  console.log(`\n   결과: ${successCount}/${expectedLimit}회 사용`);
  console.log(`   한도 감지: ${limitReached ? '✅' : '❌'}`);
  console.log(`   테스트: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

  return {
    userId: TEST_CONFIG.directorId,
    role: 'director',
    successCount,
    limitReached,
    passed
  };
}

/**
 * 학원 전체 할당 시뮬레이션 테스트
 */
async function testAcademyWideAssignment() {
  console.log('\n📚 학원 전체 할당 시뮬레이션');
  console.log(`   • 학원 ID: ${TEST_CONFIG.academyId}`);
  console.log(`   • 학생 수: ${TEST_CONFIG.studentCount}명`);
  console.log(`   • 일일 한도: 학생당/학원장 ${TEST_CONFIG.dailyLimit}회`);

  // 샘플 학생 3명만 테스트 (50명 전체는 너무 많음)
  const sampleStudents = [
    'student-001',
    'student-002',
    'student-003'
  ];

  let totalStudentRequests = 0;

  for (const studentId of sampleStudents) {
    const result = await callChatAPI(
      studentId,
      TEST_CONFIG.botId,
      '학원 전체 할당 테스트 메시지'
    );

    if (result.success) {
      totalStudentRequests++;
      console.log(`   ✓ ${studentId}: 접근 성공`);
    } else {
      console.log(`   ✗ ${studentId}: 접근 실패 - ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n   전체 결과: ${totalStudentRequests}/${sampleStudents.length}명 접근 성공`);
  
  return {
    totalStudents: sampleStudents.length,
    successfulAccess: totalStudentRequests,
    passed: totalStudentRequests === sampleStudents.length
  };
}

/**
 * 통합 테스트 실행
 */
async function runComprehensiveTests() {
  console.log('=' .repeat(80));
  console.log('🏫 학원 전체 할당 및 일일 한도 종합 테스트');
  console.log('='.repeat(80));
  console.log(`\n📅 테스트 시각: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🌐 API URL: ${API_URL}`);

  const results = {
    academyWide: null,
    students: [],
    director: null,
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    // 테스트 1: 학원 전체 할당 시뮬레이션
    console.log('\n' + '─'.repeat(80));
    console.log('\n📝 Test 1: 학원 전체 할당 기능');
    results.academyWide = await testAcademyWideAssignment();
    results.summary.total++;
    if (results.academyWide.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }

    // 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 테스트 2: 샘플 학생 일일 한도 테스트
    console.log('\n' + '─'.repeat(80));
    console.log('\n📝 Test 2: 학생 일일 한도 (샘플 1명)');
    const studentResult = await testStudentDailyLimit('student-limit-test-001', TEST_CONFIG.dailyLimit);
    results.students.push(studentResult);
    results.summary.total++;
    if (studentResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }

    // 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 테스트 3: 학원장 일일 한도 테스트
    console.log('\n' + '─'.repeat(80));
    console.log('\n📝 Test 3: 학원장 일일 한도');
    results.director = await testDirectorDailyLimit(TEST_CONFIG.dailyLimit);
    results.summary.total++;
    if (results.director.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }

  } catch (error) {
    console.error('\n❌ 테스트 실행 중 오류:', error.message);
    results.summary.failed++;
  }

  // 최종 결과 출력
  console.log('\n' + '='.repeat(80));
  console.log('📊 종합 테스트 결과');
  console.log('='.repeat(80));

  const passRate = results.summary.total > 0 
    ? ((results.summary.passed / results.summary.total) * 100).toFixed(1)
    : 0;

  console.log(`\n✅ 성공: ${results.summary.passed}/${results.summary.total} (${passRate}%)`);
  console.log(`❌ 실패: ${results.summary.failed}/${results.summary.total}`);

  // 상세 결과
  console.log('\n📋 상세 결과:');
  console.log('─'.repeat(80));

  if (results.academyWide) {
    console.log(`\n🏫 학원 전체 할당:`);
    console.log(`   • 테스트 학생 수: ${results.academyWide.totalStudents}명`);
    console.log(`   • 접근 성공: ${results.academyWide.successfulAccess}명`);
    console.log(`   • 결과: ${results.academyWide.passed ? '✅ PASSED' : '❌ FAILED'}`);
  }

  if (results.students.length > 0) {
    console.log(`\n👨‍🎓 학생 일일 한도:`);
    results.students.forEach(student => {
      console.log(`   • ${student.studentId}:`);
      console.log(`     - 사용 횟수: ${student.successCount}/${TEST_CONFIG.dailyLimit}`);
      console.log(`     - 한도 감지: ${student.limitReached ? '✅' : '❌'}`);
      console.log(`     - 결과: ${student.passed ? '✅ PASSED' : '❌ FAILED'}`);
    });
  }

  if (results.director) {
    console.log(`\n👔 학원장 일일 한도:`);
    console.log(`   • 사용 횟수: ${results.director.successCount}/${TEST_CONFIG.dailyLimit}`);
    console.log(`   • 한도 감지: ${results.director.limitReached ? '✅' : '❌'}`);
    console.log(`   • 결과: ${results.director.passed ? '✅ PASSED' : '❌ FAILED'}`);
  }

  console.log('\n' + '='.repeat(80));

  if (results.summary.failed === 0) {
    console.log('🎉 모든 테스트 통과! 학원 전체 할당 및 일일 한도 시스템이 정상 작동합니다.');
  } else {
    console.log('⚠️  일부 테스트가 실패했습니다. 상세 로그를 확인하세요.');
  }

  console.log('\n💡 참고사항:');
  console.log('   • 학원 전체 할당 시 모든 학생이 봇에 접근 가능해야 합니다.');
  console.log('   • 학생당 일일 15회 제한이 정확히 적용되어야 합니다.');
  console.log('   • 학원장도 동일하게 일일 15회 제한이 적용됩니다.');
  console.log('   • 한도 초과 시 429 상태 코드 또는 에러 메시지가 반환되어야 합니다.');

  console.log('\n' + '='.repeat(80));
  console.log('🏁 테스트 완료');
  console.log('='.repeat(80));

  return results;
}

// 테스트 실행
runComprehensiveTests()
  .then(results => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
