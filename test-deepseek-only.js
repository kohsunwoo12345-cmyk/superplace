/**
 * DeepSeek OCR-2 (Novita AI) 전용 테스트
 * 
 * Base URL: https://api.novita.ai/v3/openai
 * Model: deepseek/deepseek-ocr-2
 * API Key: ALL_AI_API_KEY
 */

const API_URL = 'https://superplacestudy.pages.dev/api/ai/chat';

console.log('='.repeat(80));
console.log('🔍 DeepSeek OCR-2 (Novita AI) 단독 테스트');
console.log('='.repeat(80));
console.log(`\n📅 테스트 시각: ${new Date().toLocaleString('ko-KR')}`);
console.log(`🌐 API URL: ${API_URL}`);
console.log(`🔑 Required: ALL_AI_API_KEY (Novita AI)`);
console.log(`📦 Model: deepseek/deepseek-ocr-2`);

/**
 * DeepSeek OCR-2 API 호출
 */
async function testDeepSeek(message, testName) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`\n📝 ${testName}`);
  console.log(`   Message: "${message}"`);
  
  const startTime = Date.now();
  
  try {
    const requestBody = {
      userId: `test-deepseek-${Date.now()}`,
      botId: 'test-bot-deepseek',
      message: message,
      model: 'deepseek-ocr-2',
      temperature: 0.7,
      maxTokens: 500,
      enableRAG: false
    };

    console.log(`\n   📤 Sending request...`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;
    
    console.log(`\n   ⏱️  Response time: ${responseTime}ms`);
    console.log(`   📊 HTTP Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { raw: errorText };
      }
      
      console.log(`\n   ❌ Request failed`);
      console.log(`   Status: ${response.status}`);
      
      if (errorData.error) {
        console.log(`   Error: ${errorData.error}`);
      }
      
      if (errorData.details) {
        console.log(`   Details: ${errorData.details}`);
      }
      
      if (errorData.raw) {
        console.log(`   Raw error: ${errorData.raw.substring(0, 200)}`);
      }
      
      return {
        success: false,
        status: response.status,
        error: errorData,
        responseTime
      };
    }

    const result = await response.json();
    
    console.log(`\n   ✅ Request successful!`);
    console.log(`   Model: ${result.model || 'N/A'}`);
    console.log(`   Response length: ${result.response?.length || 0} characters`);
    
    if (result.response) {
      const preview = result.response.length > 150 
        ? result.response.substring(0, 150) + '...' 
        : result.response;
      console.log(`\n   📄 Response preview:`);
      console.log(`   "${preview}"`);
    }
    
    if (result.usage) {
      console.log(`\n   📊 Token usage:`);
      console.log(`      Prompt: ${result.usage.promptTokens || 0}`);
      console.log(`      Completion: ${result.usage.completionTokens || 0}`);
      console.log(`      Total: ${result.usage.totalTokens || 0}`);
    }

    return {
      success: true,
      status: response.status,
      model: result.model,
      response: result.response,
      usage: result.usage,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.log(`\n   ❌ Exception occurred`);
    console.log(`   Error: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      responseTime
    };
  }
}

/**
 * 실행
 */
async function runTests() {
  const tests = [
    {
      name: 'Test 1: 기본 영어 메시지',
      message: 'Hello! Please respond with a short greeting in English.'
    },
    {
      name: 'Test 2: 한국어 메시지',
      message: '안녕하세요! 간단히 인사해주세요.'
    },
    {
      name: 'Test 3: 수학 문제',
      message: 'Solve this math problem: 15 + 27 = ?'
    },
    {
      name: 'Test 4: 긴 텍스트 처리',
      message: 'Please summarize the following: Artificial intelligence (AI) is transforming the world. It enables machines to learn from experience, adjust to new inputs, and perform human-like tasks.'
    }
  ];

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const result = await testDeepSeek(test.message, test.name);
    results.push({ ...test, ...result });
    
    // 다음 테스트 전 대기
    if (i < tests.length - 1) {
      console.log(`\n   ⏳ Waiting 2 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 최종 결과
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 최종 테스트 결과');
  console.log('='.repeat(80));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const avgTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;

  console.log(`\n✅ 성공: ${successCount}/${results.length}`);
  console.log(`❌ 실패: ${failCount}/${results.length}`);
  console.log(`⏱️  평균 응답 시간: ${avgTime.toFixed(0)}ms`);

  console.log(`\n${'─'.repeat(80)}`);
  console.log('테스트명'.padEnd(40) + '상태'.padEnd(20) + '응답시간');
  console.log('─'.repeat(80));

  results.forEach(r => {
    const name = r.name.substring(0, 38).padEnd(40);
    const status = (r.success ? '✅ 성공' : '❌ 실패').padEnd(20);
    const time = `${r.responseTime || 0}ms`;
    console.log(`${name}${status}${time}`);
  });

  console.log('─'.repeat(80));

  if (failCount > 0) {
    console.log('\n❌ 실패한 테스트 상세:');
    
    results.filter(r => !r.success).forEach(r => {
      console.log(`\n   • ${r.name}`);
      
      if (r.status) {
        console.log(`     Status: ${r.status}`);
      }
      
      if (r.error) {
        if (typeof r.error === 'string') {
          console.log(`     Error: ${r.error}`);
        } else if (r.error.error) {
          console.log(`     Error: ${r.error.error}`);
        } else if (r.error.details) {
          console.log(`     Details: ${r.error.details.substring(0, 200)}`);
        }
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔧 문제 해결 방법');
    console.log('='.repeat(80));
    console.log('\n1. Cloudflare Dashboard 접속:');
    console.log('   https://dash.cloudflare.com');
    
    console.log('\n2. 환경 변수 설정:');
    console.log('   Workers & Pages → superplace → Settings → Environment variables');
    
    console.log('\n3. ALL_AI_API_KEY 추가/수정:');
    console.log('   변수명: ALL_AI_API_KEY');
    console.log('   값: [Novita AI API Key]');
    console.log('   환경: Production');
    
    console.log('\n4. Novita AI API 키 발급:');
    console.log('   https://novita.ai');
    console.log('   → Dashboard → API Keys → Create New Key');
    
    console.log('\n5. 재배포:');
    console.log('   Settings → Deployments → 최신 배포 → Retry deployment');
    
    console.log('\n6. 2-5분 후 이 스크립트 재실행:');
    console.log('   node test-deepseek-only.js');
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 축하합니다! DeepSeek OCR-2 모델이 정상 작동합니다!');
    console.log('='.repeat(80));
    console.log('\n다음 단계:');
    console.log('1. 웹 UI에서 AI 봇 생성');
    console.log('   https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create');
    console.log('2. 모델: DeepSeek OCR-2 선택');
    console.log('3. 학생 계정으로 테스트');
  }

  console.log('\n' + '='.repeat(80));
  console.log('테스트 완료!');
  console.log('='.repeat(80) + '\n');

  return {
    total: results.length,
    success: successCount,
    failed: failCount,
    avgTime: avgTime.toFixed(0)
  };
}

// 실행
runTests()
  .then(summary => {
    console.log(`\n최종 요약: ${summary.success}/${summary.total} 성공, 평균 ${summary.avgTime}ms\n`);
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
