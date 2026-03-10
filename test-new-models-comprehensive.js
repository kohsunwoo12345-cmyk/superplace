/**
 * 새로운 AI 모델 통합 테스트 스크립트
 * 
 * 테스트 대상:
 * 1. DeepSeek OCR-2 (deepseek-ocr-2)
 * 2. GPT-4o (gpt-4o)
 * 3. GPT-4o mini (gpt-4o-mini)
 * 4. GPT-4.1 nano (gpt-4.1-nano)
 * 5. GPT-4.1 mini (gpt-4.1-mini)
 * 6. GPT-5 mini (gpt-5-mini)
 * 7. GPT-5.2 (gpt-5.2)
 * 
 * 각 모델에 대해 테스트:
 * - 기본 채팅 기능
 * - RAG 지식베이스 연동 (첨부 파일 활용)
 */

const API_URL = 'https://superplacestudy.pages.dev/api/ai/chat';

// 테스트할 모델 목록
const MODELS_TO_TEST = [
  {
    name: 'deepseek-ocr-2',
    label: 'DeepSeek OCR-2',
    expectedKey: 'ALL_AI_API_KEY'
  },
  {
    name: 'gpt-4o',
    label: 'GPT-4o',
    expectedKey: 'OPENAI_API_KEY'
  },
  {
    name: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    expectedKey: 'OPENAI_API_KEY'
  },
  {
    name: 'gpt-4.1-nano',
    label: 'GPT-4.1 nano',
    expectedKey: 'OPENAI_API_KEY'
  },
  {
    name: 'gpt-4.1-mini',
    label: 'GPT-4.1 mini',
    expectedKey: 'OPENAI_API_KEY'
  },
  {
    name: 'gpt-5-mini',
    label: 'GPT-5 mini',
    expectedKey: 'OPENAI_API_KEY'
  },
  {
    name: 'gpt-5.2',
    label: 'GPT-5.2',
    expectedKey: 'OPENAI_API_KEY'
  }
];

// 테스트용 봇 ID (실제 DB에서 생성된 봇 ID)
const TEST_BOT_ID = 'test-bot-001';
const TEST_USER_ID = 'test-user-001';

/**
 * AI 채팅 API 호출
 */
async function testChatAPI(model, message, enableRAG = false) {
  try {
    const requestBody = {
      userId: TEST_USER_ID,
      botId: TEST_BOT_ID,
      message: message,
      model: model,
      // RAG 설정
      enableRAG: enableRAG,
      // 기본 파라미터
      temperature: 0.7,
      maxTokens: 500
    };

    console.log(`\n📤 Request to ${API_URL}`);
    console.log(`   Model: ${model}`);
    console.log(`   Message: ${message.substring(0, 50)}...`);
    console.log(`   RAG Enabled: ${enableRAG}`);

    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log(`\n✅ Response received (${responseTime}ms)`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Model used: ${result.model || 'N/A'}`);
    console.log(`   RAG enabled: ${result.ragEnabled || false}`);
    console.log(`   Knowledge used: ${result.knowledgeUsed || false}`);
    console.log(`   Response length: ${result.response?.length || 0} chars`);
    
    if (result.usage) {
      console.log(`   Token usage:`);
      console.log(`     - Prompt: ${result.usage.promptTokens || 0}`);
      console.log(`     - Completion: ${result.usage.completionTokens || 0}`);
      console.log(`     - Total: ${result.usage.totalTokens || 0}`);
    }

    // 응답 내용 일부 출력
    if (result.response) {
      const preview = result.response.length > 200 
        ? result.response.substring(0, 200) + '...' 
        : result.response;
      console.log(`\n   Response preview:`);
      console.log(`   "${preview}"`);
    }

    return {
      success: true,
      model: result.model,
      responseTime,
      ragEnabled: result.ragEnabled,
      knowledgeUsed: result.knowledgeUsed,
      response: result.response,
      usage: result.usage
    };

  } catch (error) {
    console.error(`\n❌ Error testing ${model}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 모든 모델 테스트 실행
 */
async function runAllTests() {
  console.log('=' .repeat(80));
  console.log('🚀 새로운 AI 모델 통합 테스트 시작');
  console.log('=' .repeat(80));
  console.log(`\n📅 테스트 시각: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log(`📋 테스트할 모델 수: ${MODELS_TO_TEST.length}개`);

  const results = {
    total: MODELS_TO_TEST.length * 2, // 각 모델당 2개 테스트 (기본 + RAG)
    passed: 0,
    failed: 0,
    details: []
  };

  // 각 모델에 대해 테스트 실행
  for (let i = 0; i < MODELS_TO_TEST.length; i++) {
    const modelConfig = MODELS_TO_TEST[i];
    
    console.log('\n' + '─'.repeat(80));
    console.log(`\n🤖 모델 ${i + 1}/${MODELS_TO_TEST.length}: ${modelConfig.label} (${modelConfig.name})`);
    console.log(`🔑 Required API Key: ${modelConfig.expectedKey}`);

    // 테스트 1: 기본 채팅 (RAG 없음)
    console.log('\n📝 Test 1: 기본 채팅 기능');
    const basicTest = await testChatAPI(
      modelConfig.name,
      '안녕하세요! 간단한 수학 문제를 풀어주세요. 15 + 27은 무엇인가요?',
      false
    );

    if (basicTest.success) {
      results.passed++;
      results.details.push({
        model: modelConfig.name,
        test: 'basic',
        status: 'PASSED',
        responseTime: basicTest.responseTime
      });
    } else {
      results.failed++;
      results.details.push({
        model: modelConfig.name,
        test: 'basic',
        status: 'FAILED',
        error: basicTest.error
      });
    }

    // 잠시 대기 (API rate limit 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 테스트 2: RAG 활성화 채팅
    console.log('\n📚 Test 2: RAG 지식베이스 연동');
    const ragTest = await testChatAPI(
      modelConfig.name,
      '학습 자료에서 중요한 개념을 설명해주세요.',
      true
    );

    if (ragTest.success) {
      results.passed++;
      results.details.push({
        model: modelConfig.name,
        test: 'rag',
        status: 'PASSED',
        responseTime: ragTest.responseTime,
        ragEnabled: ragTest.ragEnabled,
        knowledgeUsed: ragTest.knowledgeUsed
      });
    } else {
      results.failed++;
      results.details.push({
        model: modelConfig.name,
        test: 'rag',
        status: 'FAILED',
        error: ragTest.error
      });
    }

    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 최종 결과 출력
  console.log('\n' + '='.repeat(80));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(80));
  console.log(`\n✅ 성공: ${results.passed}/${results.total} (${((results.passed/results.total)*100).toFixed(1)}%)`);
  console.log(`❌ 실패: ${results.failed}/${results.total} (${((results.failed/results.total)*100).toFixed(1)}%)`);

  // 상세 결과 테이블
  console.log('\n📋 상세 결과:');
  console.log('─'.repeat(80));
  console.log('Model'.padEnd(20) + 'Test'.padEnd(10) + 'Status'.padEnd(10) + 'Time(ms)'.padEnd(12) + 'RAG');
  console.log('─'.repeat(80));

  results.details.forEach(detail => {
    const modelName = detail.model.padEnd(20);
    const testType = detail.test.padEnd(10);
    const status = detail.status.padEnd(10);
    const time = detail.responseTime ? String(detail.responseTime).padEnd(12) : 'N/A'.padEnd(12);
    const rag = detail.ragEnabled ? '✓' : '-';
    
    console.log(`${modelName}${testType}${status}${time}${rag}`);
  });

  console.log('─'.repeat(80));

  // 실패한 테스트가 있으면 에러 상세 출력
  const failedTests = results.details.filter(d => d.status === 'FAILED');
  if (failedTests.length > 0) {
    console.log('\n❌ 실패한 테스트 상세:');
    failedTests.forEach(test => {
      console.log(`\n   • ${test.model} (${test.test})`);
      console.log(`     Error: ${test.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 테스트 완료');
  console.log('='.repeat(80));

  // 환경 변수 설정 안내
  if (results.failed > 0) {
    console.log('\n⚠️  일부 테스트가 실패했습니다.');
    console.log('\n🔧 문제 해결 방법:');
    console.log('   1. Cloudflare Dashboard → Workers & Pages → superplace → Settings → Environment variables');
    console.log('   2. 다음 환경 변수가 올바르게 설정되어 있는지 확인:');
    console.log('      • GOOGLE_GEMINI_API_KEY (Gemini 모델용)');
    console.log('      • ALL_AI_API_KEY (DeepSeek 모델용)');
    console.log('      • OPENAI_API_KEY (GPT 모델용)');
    console.log('   3. 환경 변수 추가/수정 후 Cloudflare Pages 재배포');
  } else {
    console.log('\n🎉 모든 테스트 통과! 시스템이 정상적으로 작동하고 있습니다.');
  }

  return results;
}

// 테스트 실행
runAllTests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
