/**
 * DeepSeek OCR-2 웹 챗봇 실제 사용 테스트
 * 
 * 이 스크립트는 실제 웹 UI 사용자가 하는 것처럼
 * /api/ai-chat 엔드포인트를 통해 DeepSeek 봇과 대화를 테스트합니다.
 */

const API_BASE = 'https://superplacestudy.pages.dev';

// 테스트용 봇 ID (실제 생성된 봇 ID 사용)
const TEST_BOT_ID = `deepseek-web-test-${Date.now()}`;
const TEST_USER_ID = `student-web-test-${Date.now()}`;

// 색상 코드
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

/**
 * 웹 챗봇과 대화 테스트 (실제 /api/ai-chat 엔드포인트 사용)
 */
async function testWebChatConversation(testCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
        botId: TEST_BOT_ID,
        conversationHistory: testCase.history || [],
        userId: TEST_USER_ID,
        sessionId: `session-${Date.now()}`,
        imageUrl: testCase.imageUrl || null
      })
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`${RED}✗ 실패${RESET} - HTTP ${response.status}`);
      console.log(`   오류: ${errorText.substring(0, 200)}`);
      return {
        success: false,
        responseTime,
        error: errorText
      };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.log(`${RED}✗ 실패${RESET} - API returned success: false`);
      console.log(`   메시지: ${data.message || 'Unknown error'}`);
      return {
        success: false,
        responseTime,
        error: data.message
      };
    }
    
    console.log(`${GREEN}✓ 성공${RESET} - ${responseTime}ms`);
    console.log(`   응답: ${data.response.substring(0, 100)}${data.response.length > 100 ? '...' : ''}`);
    
    return {
      success: true,
      responseTime,
      response: data.response,
      tokens: data.usage?.totalTokens || 0
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`${RED}✗ 오류${RESET} - ${error.message}`);
    return {
      success: false,
      responseTime,
      error: error.message
    };
  }
}

/**
 * 메인 테스트 실행
 */
async function runTests() {
  console.log(`${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║  DeepSeek OCR-2 웹 챗봇 실제 사용 테스트                  ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();
  console.log(`${BLUE}📅 테스트 시간:${RESET} ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  console.log(`${BLUE}🌐 API Base:${RESET} ${API_BASE}`);
  console.log(`${BLUE}🤖 Bot ID:${RESET} ${TEST_BOT_ID}`);
  console.log(`${BLUE}👤 User ID:${RESET} ${TEST_USER_ID}`);
  console.log();
  
  const testCases = [
    {
      name: "기본 인사 (영어)",
      message: "Hello! Can you help me?",
      history: []
    },
    {
      name: "기본 인사 (한국어)",
      message: "안녕하세요! 도움을 받을 수 있을까요?",
      history: []
    },
    {
      name: "수학 문제 1 (덧셈)",
      message: "15 + 27은 얼마인가요?",
      history: []
    },
    {
      name: "수학 문제 2 (곱셈)",
      message: "12 × 8을 계산해주세요.",
      history: []
    },
    {
      name: "과학 질문 (영어)",
      message: "What is photosynthesis?",
      history: []
    },
    {
      name: "과학 질문 (한국어)",
      message: "광합성이 무엇인가요?",
      history: []
    },
    {
      name: "영어 학습 1",
      message: "How do you say '안녕하세요' in English?",
      history: []
    },
    {
      name: "영어 학습 2",
      message: "Translate to Korean: 'The weather is nice today.'",
      history: []
    },
    {
      name: "대화 맥락 유지 테스트",
      message: "그럼 그 공식을 사용해서 25 × 4를 계산해주세요.",
      history: [
        { role: "user", content: "12 × 8을 계산해주세요." },
        { role: "assistant", content: "12 × 8 = 96입니다." }
      ]
    }
  ];
  
  const results = [];
  let successCount = 0;
  let totalTime = 0;
  let totalTokens = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${YELLOW}[${i + 1}/${testCases.length}] ${testCase.name}${RESET}`);
    console.log(`   메시지: "${testCase.message}"`);
    
    const result = await testWebChatConversation(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
    
    if (result.success) {
      successCount++;
      totalTokens += result.tokens || 0;
    }
    totalTime += result.responseTime;
    
    console.log();
    
    // API 부하 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 결과 요약
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}                        테스트 결과 요약${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log();
  
  const avgTime = totalTime / testCases.length;
  const successRate = (successCount / testCases.length * 100).toFixed(1);
  const avgTokens = successCount > 0 ? (totalTokens / successCount).toFixed(1) : 0;
  const estimatedCost = (totalTokens / 1000 * 0.001).toFixed(6);
  
  console.log(`${BLUE}📊 전체 통계:${RESET}`);
  console.log(`   • 총 테스트: ${testCases.length}개`);
  console.log(`   • ${GREEN}성공: ${successCount}개${RESET}`);
  console.log(`   • ${successCount < testCases.length ? RED : GREEN}실패: ${testCases.length - successCount}개${RESET}`);
  console.log(`   • 성공률: ${successCount === testCases.length ? GREEN : YELLOW}${successRate}%${RESET}`);
  console.log();
  
  console.log(`${BLUE}⚡ 성능 지표:${RESET}`);
  console.log(`   • 평균 응답 시간: ${avgTime.toFixed(0)}ms (${(avgTime / 1000).toFixed(2)}초)`);
  console.log(`   • 총 응답 시간: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}초)`);
  console.log();
  
  if (successCount > 0) {
    console.log(`${BLUE}💰 비용 분석:${RESET}`);
    console.log(`   • 총 토큰 사용: ${totalTokens} tokens`);
    console.log(`   • 평균 토큰/메시지: ${avgTokens} tokens`);
    console.log(`   • 총 비용: $${estimatedCost} (약 ${(estimatedCost * 1300).toFixed(2)}원)`);
    console.log(`   • 메시지당 비용: $${(totalTokens / successCount / 1000 * 0.001).toFixed(6)} (약 ${(totalTokens / successCount / 1000 * 0.001 * 1300).toFixed(2)}원)`);
    console.log();
  }
  
  // 상세 결과
  console.log(`${BLUE}📋 상세 결과:${RESET}`);
  results.forEach((result, idx) => {
    const status = result.success ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const rating = result.success ? getRating(result.response) : '❌';
    console.log(`   ${status} [${idx + 1}] ${result.name}`);
    console.log(`      응답 시간: ${result.responseTime}ms`);
    if (result.success) {
      console.log(`      토큰: ${result.tokens || 0}`);
      console.log(`      평가: ${rating}`);
    } else {
      console.log(`      오류: ${result.error?.substring(0, 100) || 'Unknown error'}`);
    }
  });
  console.log();
  
  // 최종 평가
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  if (successCount === testCases.length) {
    console.log(`${GREEN}✅ 모든 테스트 통과! DeepSeek 챗봇이 정상 작동합니다.${RESET}`);
  } else if (successCount > 0) {
    console.log(`${YELLOW}⚠️  일부 테스트 실패. ${successCount}/${testCases.length} 통과${RESET}`);
  } else {
    console.log(`${RED}❌ 모든 테스트 실패. DeepSeek 챗봇 설정을 확인하세요.${RESET}`);
  }
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log();
  
  // 프로덕션 배포 권장사항
  if (successCount === testCases.length) {
    console.log(`${GREEN}🚀 프로덕션 배포 가능${RESET}`);
    console.log(`   1. 웹 UI에서 DeepSeek OCR-2 봇 생성`);
    console.log(`   2. 시스템 프롬프트 최적화`);
    console.log(`   3. temperature: 0.3, maxTokens: 200 권장`);
    console.log(`   4. 파일럿 그룹 5-10명으로 시작`);
    console.log(`   5. 1주일 후 피드백 수집`);
  } else {
    console.log(`${RED}🔧 수정 필요${RESET}`);
    console.log(`   1. Cloudflare 환경변수 확인: Novita_AI_API`);
    console.log(`   2. API 키가 유효한지 확인`);
    console.log(`   3. 배포가 완료되었는지 확인`);
    console.log(`   4. 브라우저 콘솔에서 오류 로그 확인`);
  }
  console.log();
  
  return {
    totalTests: testCases.length,
    successCount,
    failCount: testCases.length - successCount,
    successRate: parseFloat(successRate),
    avgResponseTime: avgTime,
    totalTokens,
    estimatedCost: parseFloat(estimatedCost)
  };
}

/**
 * 응답 품질 평가
 */
function getRating(response) {
  if (!response || response.includes('응답을 생성할 수 없습니다')) {
    return '❌ 실패';
  }
  
  const length = response.length;
  if (length < 10) return '⭐ (너무 짧음)';
  if (length < 50) return '⭐⭐ (짧음)';
  if (length < 100) return '⭐⭐⭐ (보통)';
  if (length < 200) return '⭐⭐⭐⭐ (좋음)';
  return '⭐⭐⭐⭐⭐ (매우 좋음)';
}

// 테스트 실행
runTests().catch(error => {
  console.error(`${RED}치명적 오류:${RESET}`, error);
  process.exit(1);
});
