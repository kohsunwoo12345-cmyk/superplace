/**
 * 실제 API 호출 테스트 - 모든 모델 검증
 * RAG 구현 확인 포함
 */

const API_URL = 'https://superplacestudy.pages.dev/api/ai/chat';

// 테스트할 모든 모델 (검증된 모델만)
const ALL_MODELS = [
  // Gemini 모델들 (작동 확인됨)
  { name: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', apiKey: 'GOOGLE_GEMINI_API_KEY' },
  { name: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', apiKey: 'GOOGLE_GEMINI_API_KEY' },
  { name: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', apiKey: 'GOOGLE_GEMINI_API_KEY' },
  
  // DeepSeek 모델 (API 키 필요)
  { name: 'deepseek-ocr-2', label: 'DeepSeek OCR-2', apiKey: 'ALL_AI_API_KEY' },
  
  // OpenAI 모델들 (검증된 모델만, API 키 필요)
  { name: 'gpt-4o', label: 'GPT-4o', apiKey: 'OPENAI_API_KEY' },
  { name: 'gpt-4o-mini', label: 'GPT-4o mini', apiKey: 'OPENAI_API_KEY' }
];

const TEST_MESSAGES = {
  basic: 'Hello! Please respond with a short greeting.',
  math: '15 + 27 = ?',
  korean: '안녕하세요! 간단히 인사해주세요.'
};

/**
 * API 호출 함수
 */
async function testModelAPI(model, message, enableRAG = false) {
  const startTime = Date.now();
  
  try {
    const requestBody = {
      userId: `test-user-${Date.now()}`,
      botId: `test-bot-${model.name}`,
      message: message,
      model: model.name,
      temperature: 0.7,
      maxTokens: 100,
      enableRAG: enableRAG
    };

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
      let errorMessage = errorText;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch (e) {
        // JSON 파싱 실패 시 원본 텍스트 사용
      }
      
      return {
        success: false,
        status: response.status,
        error: errorMessage,
        responseTime
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      status: response.status,
      model: result.model,
      response: result.response,
      ragEnabled: result.ragEnabled || false,
      knowledgeUsed: result.knowledgeUsed || false,
      usage: result.usage || {},
      responseTime
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * 단일 모델 테스트
 */
async function testSingleModel(model) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🤖 모델: ${model.label} (${model.name})`);
  console.log(`🔑 API Key: ${model.apiKey}`);
  console.log(`${'='.repeat(80)}`);

  const results = {
    model: model.name,
    label: model.label,
    apiKey: model.apiKey,
    tests: []
  };

  // Test 1: 기본 영어 메시지
  console.log(`\n📝 Test 1: 기본 영어 메시지`);
  console.log(`   Message: "${TEST_MESSAGES.basic}"`);
  
  const test1 = await testModelAPI(model, TEST_MESSAGES.basic, false);
  results.tests.push({ name: 'basic_english', ...test1 });
  
  if (test1.success) {
    console.log(`   ✅ 성공 (${test1.responseTime}ms)`);
    console.log(`   📤 Response: "${test1.response?.substring(0, 100)}..."`);
    console.log(`   📊 Tokens: ${test1.usage?.totalTokens || 0}`);
  } else {
    console.log(`   ❌ 실패 (${test1.responseTime}ms)`);
    console.log(`   ⚠️  Error: ${test1.error}`);
    console.log(`   📊 Status: ${test1.status || 'N/A'}`);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: 한국어 메시지
  console.log(`\n📝 Test 2: 한국어 메시지`);
  console.log(`   Message: "${TEST_MESSAGES.korean}"`);
  
  const test2 = await testModelAPI(model, TEST_MESSAGES.korean, false);
  results.tests.push({ name: 'korean', ...test2 });
  
  if (test2.success) {
    console.log(`   ✅ 성공 (${test2.responseTime}ms)`);
    console.log(`   📤 Response: "${test2.response?.substring(0, 100)}..."`);
    console.log(`   📊 Tokens: ${test2.usage?.totalTokens || 0}`);
  } else {
    console.log(`   ❌ 실패 (${test2.responseTime}ms)`);
    console.log(`   ⚠️  Error: ${test2.error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: RAG 활성화 테스트
  console.log(`\n📝 Test 3: RAG 지식베이스 연동`);
  console.log(`   Message: "Tell me about the uploaded knowledge."`);
  console.log(`   RAG: Enabled`);
  
  const test3 = await testModelAPI(model, 'Tell me about the uploaded knowledge.', true);
  results.tests.push({ name: 'rag_enabled', ...test3 });
  
  if (test3.success) {
    console.log(`   ✅ 성공 (${test3.responseTime}ms)`);
    console.log(`   📤 Response: "${test3.response?.substring(0, 100)}..."`);
    console.log(`   📚 RAG Enabled: ${test3.ragEnabled ? '✅' : '❌'}`);
    console.log(`   📖 Knowledge Used: ${test3.knowledgeUsed ? '✅' : '❌'}`);
    console.log(`   📊 Tokens: ${test3.usage?.totalTokens || 0}`);
  } else {
    console.log(`   ❌ 실패 (${test3.responseTime}ms)`);
    console.log(`   ⚠️  Error: ${test3.error}`);
  }

  // 결과 요약
  const passedTests = results.tests.filter(t => t.success).length;
  const totalTests = results.tests.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📊 모델 테스트 결과: ${passedTests}/${totalTests} 통과 (${passRate}%)`);
  
  if (passedTests === totalTests) {
    console.log(`✅ 이 모델은 정상 작동합니다!`);
  } else {
    console.log(`⚠️  일부 테스트 실패 - 환경 변수 확인 필요`);
  }

  return results;
}

/**
 * 모든 모델 테스트 실행
 */
async function runAllTests() {
  console.log('🚀 실제 API 호출 테스트 시작');
  console.log(`📅 시각: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log(`📋 테스트할 모델 수: ${ALL_MODELS.length}개\n`);

  const allResults = [];

  for (let i = 0; i < ALL_MODELS.length; i++) {
    const model = ALL_MODELS[i];
    
    console.log(`\n진행: ${i + 1}/${ALL_MODELS.length}`);
    
    const result = await testSingleModel(model);
    allResults.push(result);

    // 다음 모델 테스트 전 대기
    if (i < ALL_MODELS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 최종 요약
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 전체 테스트 결과 요약');
  console.log('='.repeat(80));

  const summary = {
    total: allResults.length,
    fullyWorking: 0,
    partiallyWorking: 0,
    notWorking: 0,
    ragSupport: 0
  };

  console.log('\n' + '─'.repeat(80));
  console.log('모델명'.padEnd(25) + 'API Key'.padEnd(25) + '상태'.padEnd(15) + 'RAG');
  console.log('─'.repeat(80));

  allResults.forEach(result => {
    const passedTests = result.tests.filter(t => t.success).length;
    const totalTests = result.tests.length;
    
    let status = '';
    if (passedTests === totalTests) {
      status = '✅ 완전 작동';
      summary.fullyWorking++;
    } else if (passedTests > 0) {
      status = '⚠️  부분 작동';
      summary.partiallyWorking++;
    } else {
      status = '❌ 오류';
      summary.notWorking++;
    }

    const ragTest = result.tests.find(t => t.name === 'rag_enabled');
    const ragStatus = ragTest && ragTest.success && ragTest.ragEnabled ? '✅' : '❌';
    
    if (ragTest && ragTest.success && ragTest.ragEnabled) {
      summary.ragSupport++;
    }

    const modelName = result.label.padEnd(25);
    const apiKey = result.apiKey.padEnd(25);
    const statusStr = status.padEnd(15);

    console.log(`${modelName}${apiKey}${statusStr}${ragStatus}`);
  });

  console.log('─'.repeat(80));

  // 통계
  console.log('\n📈 통계:');
  console.log(`   • 전체 모델: ${summary.total}개`);
  console.log(`   • ✅ 완전 작동: ${summary.fullyWorking}개 (${((summary.fullyWorking/summary.total)*100).toFixed(1)}%)`);
  console.log(`   • ⚠️  부분 작동: ${summary.partiallyWorking}개 (${((summary.partiallyWorking/summary.total)*100).toFixed(1)}%)`);
  console.log(`   • ❌ 오류: ${summary.notWorking}개 (${((summary.notWorking/summary.total)*100).toFixed(1)}%)`);
  console.log(`   • 📚 RAG 지원: ${summary.ragSupport}개 (${((summary.ragSupport/summary.total)*100).toFixed(1)}%)`);

  // 실패한 모델 상세
  const failedModels = allResults.filter(r => r.tests.every(t => !t.success));
  if (failedModels.length > 0) {
    console.log('\n❌ 완전히 실패한 모델:');
    failedModels.forEach(model => {
      console.log(`\n   • ${model.label} (${model.name})`);
      console.log(`     API Key: ${model.apiKey}`);
      
      const firstError = model.tests[0];
      if (firstError && firstError.error) {
        console.log(`     Error: ${firstError.error.substring(0, 200)}`);
      }
    });
  }

  // 부분 작동 모델
  const partialModels = allResults.filter(r => {
    const passed = r.tests.filter(t => t.success).length;
    return passed > 0 && passed < r.tests.length;
  });
  
  if (partialModels.length > 0) {
    console.log('\n⚠️  부분적으로 작동하는 모델:');
    partialModels.forEach(model => {
      console.log(`\n   • ${model.label} (${model.name})`);
      
      const failedTests = model.tests.filter(t => !t.success);
      failedTests.forEach(test => {
        console.log(`     ❌ ${test.name}: ${test.error || 'Unknown error'}`);
      });
    });
  }

  // 환경 변수 안내
  if (summary.notWorking > 0 || summary.partiallyWorking > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 문제 해결 방법');
    console.log('='.repeat(80));
    console.log('\nCloudflare Dashboard에서 다음 환경 변수를 확인하세요:');
    console.log('   1. GOOGLE_GEMINI_API_KEY - Gemini 모델용');
    console.log('   2. ALL_AI_API_KEY - DeepSeek 모델용');
    console.log('   3. OPENAI_API_KEY - GPT 모델용');
    console.log('\n설정 경로:');
    console.log('   Cloudflare Dashboard → Workers & Pages → superplace');
    console.log('   → Settings → Environment variables → Production');
    console.log('\n환경 변수 추가/수정 후 재배포 필수!');
  }

  if (summary.fullyWorking === summary.total) {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 축하합니다! 모든 모델이 정상 작동합니다!');
    console.log('='.repeat(80));
  }

  console.log('\n테스트 완료!\n');

  return {
    summary,
    allResults,
    success: summary.notWorking === 0
  };
}

// 실행
runAllTests()
  .then(results => {
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
