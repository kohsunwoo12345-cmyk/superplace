/**
 * DeepSeek OCR-2 실제 사용 시나리오 종합 테스트
 * 
 * 테스트 시나리오:
 * 1. 관리자가 DeepSeek OCR-2 봇 생성
 * 2. 학생에게 봇 할당
 * 3. 학생이 봇과 채팅
 * 4. 다양한 질문 테스트 (인사, 수학, 과학, 영어)
 */

const API_BASE = 'https://superplacestudy.pages.dev/api';

console.log('='.repeat(80));
console.log('🤖 DeepSeek OCR-2 실제 사용 시나리오 테스트');
console.log('='.repeat(80));
console.log(`\n📅 테스트 시각: ${new Date().toLocaleString('ko-KR')}`);
console.log(`🌐 API Base: ${API_BASE}`);
console.log(`📦 Model: deepseek-ocr-2 (Novita AI)`);

// 테스트 사용자 정보
const TEST_DATA = {
  botId: `deepseek-test-bot-${Date.now()}`,
  userId: `student-test-${Date.now()}`,
  academyId: 'test-academy-001'
};

console.log(`\n🔑 테스트 데이터:`);
console.log(`   Bot ID: ${TEST_DATA.botId}`);
console.log(`   User ID: ${TEST_DATA.userId}`);
console.log(`   Academy ID: ${TEST_DATA.academyId}`);

/**
 * AI 챗봇과 대화
 */
async function chatWithBot(botId, userId, message, scenario) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`\n📝 ${scenario}`);
  console.log(`   👤 학생: "${message}"`);
  
  const startTime = Date.now();
  
  try {
    const requestBody = {
      userId: userId,
      botId: botId,
      message: message,
      model: 'deepseek-ocr-2',
      temperature: 0.7,
      maxTokens: 500,
      enableRAG: false
    };

    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`\n   ❌ 요청 실패`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      
      return {
        success: false,
        status: response.status,
        error: errorText,
        responseTime
      };
    }

    const result = await response.json();
    
    console.log(`\n   ✅ 응답 성공! (${responseTime}ms)`);
    console.log(`   🤖 DeepSeek: "${result.response}"`);
    
    if (result.usage) {
      console.log(`\n   📊 토큰 사용량:`);
      console.log(`      입력: ${result.usage.promptTokens || 0} tokens`);
      console.log(`      출력: ${result.usage.completionTokens || 0} tokens`);
      console.log(`      합계: ${result.usage.totalTokens || 0} tokens`);
      console.log(`      예상 비용: $${((result.usage.totalTokens || 0) * 0.000001).toFixed(6)}`);
    }

    return {
      success: true,
      status: response.status,
      response: result.response,
      usage: result.usage,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`\n   ❌ 예외 발생`);
    console.log(`   Error: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      responseTime
    };
  }
}

/**
 * 실제 사용 시나리오 시뮬레이션
 */
async function runScenarios() {
  console.log('\n' + '='.repeat(80));
  console.log('📚 실제 학습 시나리오 시뮬레이션');
  console.log('='.repeat(80));

  const scenarios = [
    {
      category: '🙋 인사 및 자기소개',
      messages: [
        '안녕하세요! 만나서 반가워요.',
        'What is your name?'
      ]
    },
    {
      category: '🧮 수학 문제',
      messages: [
        '15 + 27은 얼마인가요?',
        'If x + 5 = 12, what is x?',
        '3 × 8 = ?'
      ]
    },
    {
      category: '🔬 과학 질문',
      messages: [
        '물의 화학식은 무엇인가요?',
        'What is photosynthesis?'
      ]
    },
    {
      category: '📖 영어 학습',
      messages: [
        'apple의 한글 뜻은 무엇인가요?',
        'How do you say "안녕하세요" in English?'
      ]
    }
  ];

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    totalTime: 0,
    totalTokens: 0,
    totalCost: 0
  };

  for (const scenario of scenarios) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(scenario.category);
    console.log('='.repeat(80));

    for (const message of scenario.messages) {
      const result = await chatWithBot(
        TEST_DATA.botId,
        TEST_DATA.userId,
        message,
        `질문 ${results.total + 1}`
      );

      results.total++;
      
      if (result.success) {
        results.success++;
        results.totalTime += result.responseTime || 0;
        
        if (result.usage) {
          results.totalTokens += result.usage.totalTokens || 0;
          results.totalCost += (result.usage.totalTokens || 0) * 0.000001;
        }
      } else {
        results.failed++;
      }

      // Rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  // 최종 결과
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 최종 테스트 결과');
  console.log('='.repeat(80));

  console.log(`\n✅ 성공: ${results.success}/${results.total} (${((results.success/results.total)*100).toFixed(1)}%)`);
  console.log(`❌ 실패: ${results.failed}/${results.total} (${((results.failed/results.total)*100).toFixed(1)}%)`);
  
  if (results.success > 0) {
    const avgTime = results.totalTime / results.success;
    console.log(`\n⏱️  평균 응답 시간: ${avgTime.toFixed(0)}ms`);
    console.log(`📊 총 토큰 사용: ${results.totalTokens} tokens`);
    console.log(`💰 총 예상 비용: $${results.totalCost.toFixed(6)} (약 ${(results.totalCost * 1300).toFixed(2)}원)`);
  }

  // 성능 평가
  console.log('\n' + '─'.repeat(80));
  console.log('📈 성능 평가');
  console.log('─'.repeat(80));

  const avgTime = results.totalTime / results.success;
  const successRate = (results.success / results.total) * 100;

  console.log(`\n응답 속도:`);
  if (avgTime < 2000) {
    console.log(`   ✅ 우수 (${avgTime.toFixed(0)}ms) - 2초 이내`);
  } else if (avgTime < 3000) {
    console.log(`   ⚠️  양호 (${avgTime.toFixed(0)}ms) - 3초 이내`);
  } else {
    console.log(`   ❌ 개선 필요 (${avgTime.toFixed(0)}ms) - 3초 이상`);
  }

  console.log(`\n성공률:`);
  if (successRate >= 90) {
    console.log(`   ✅ 우수 (${successRate.toFixed(1)}%) - 90% 이상`);
  } else if (successRate >= 70) {
    console.log(`   ⚠️  양호 (${successRate.toFixed(1)}%) - 70% 이상`);
  } else {
    console.log(`   ❌ 개선 필요 (${successRate.toFixed(1)}%) - 70% 미만`);
  }

  console.log(`\n비용 효율성:`);
  const costPerMessage = results.totalCost / results.success;
  if (costPerMessage < 0.0001) {
    console.log(`   ✅ 매우 저렴 (메시지당 $${costPerMessage.toFixed(6)})`);
  } else if (costPerMessage < 0.001) {
    console.log(`   ⚠️  보통 (메시지당 $${costPerMessage.toFixed(6)})`);
  } else {
    console.log(`   ❌ 비쌈 (메시지당 $${costPerMessage.toFixed(6)})`);
  }

  // 실제 사용 가능 여부 판단
  console.log('\n' + '='.repeat(80));
  console.log('🎯 프로덕션 사용 가능 여부');
  console.log('='.repeat(80));

  const isProductionReady = successRate >= 80 && avgTime < 3000;

  if (isProductionReady) {
    console.log('\n✅ 프로덕션 배포 가능!');
    console.log('\n권장 사항:');
    console.log('   1. 웹 UI에서 DeepSeek OCR-2 봇 생성');
    console.log('   2. 소규모 학생 그룹에 먼저 할당 (5-10명)');
    console.log('   3. 1주일 모니터링 후 전체 확대');
    console.log('   4. 학생 피드백 수집 및 프롬프트 개선');
  } else {
    console.log('\n⚠️  개선 후 배포 권장');
    console.log('\n개선 필요 항목:');
    
    if (successRate < 80) {
      console.log(`   • 성공률 개선 (현재 ${successRate.toFixed(1)}% → 목표 80% 이상)`);
    }
    
    if (avgTime >= 3000) {
      console.log(`   • 응답 속도 개선 (현재 ${avgTime.toFixed(0)}ms → 목표 3000ms 이내)`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('테스트 완료!');
  console.log('='.repeat(80) + '\n');

  return results;
}

// 실행
runScenarios()
  .then(results => {
    const successRate = (results.success / results.total) * 100;
    console.log(`\n최종: ${results.success}/${results.total} 성공 (${successRate.toFixed(1)}%)\n`);
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
