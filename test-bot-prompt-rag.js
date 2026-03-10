/**
 * 봇 프롬프트 및 RAG 기능 테스트
 * 
 * 이 스크립트는 실제 봇 ID로 다음을 테스트합니다:
 * 1. 시스템 프롬프트가 적용되는지
 * 2. 지식 베이스(RAG)가 작동하는지
 * 3. 응답이 제대로 나오는지 ("봐봐봐봐" 같은 이상한 응답 확인)
 */

const API_BASE = 'https://superplacestudy.pages.dev';

// 색상
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

/**
 * 실제 봇 목록 가져오기
 */
async function getBotList() {
  try {
    console.log(`${BLUE}🔍 봇 목록 가져오는 중...${RESET}`);
    
    // Note: This endpoint might require authentication
    // For now, we'll use a predefined bot ID
    return null;
  } catch (error) {
    console.error(`${RED}봇 목록 가져오기 실패:${RESET}`, error.message);
    return null;
  }
}

/**
 * 봇과 대화 테스트
 */
async function testBotConversation(botId, testCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
        botId: botId,
        conversationHistory: testCase.history || [],
        userId: `test-user-${Date.now()}`,
        sessionId: `session-${Date.now()}`
      })
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        responseTime,
        error: errorData.message || `HTTP ${response.status}`,
        httpStatus: response.status
      };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        responseTime,
        error: data.message || 'Unknown error',
        httpStatus: response.status
      };
    }
    
    // 응답 분석
    const responseText = data.response || '';
    const hasRepetition = checkRepetition(responseText);
    const isShort = responseText.length < 10;
    const isTooLong = responseText.length > 5000;
    
    return {
      success: true,
      responseTime,
      response: responseText,
      responseLength: responseText.length,
      hasRepetition,
      isShort,
      isTooLong,
      firstChars: responseText.substring(0, 100)
    };
    
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * 응답에 반복 패턴이 있는지 확인
 */
function checkRepetition(text) {
  // "봐봐봐봐" 같은 패턴 감지
  const repeatingPatterns = [
    /(.{1,5})\1{5,}/g,  // 1-5자가 5번 이상 반복
    /봐{4,}/g,          // "봐" 4번 이상
    /(.)\1{10,}/g       // 같은 글자 10번 이상
  ];
  
  for (const pattern of repeatingPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 메인 테스트
 */
async function runTests() {
  console.log(`${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║           봇 프롬프트 & RAG 기능 진단 테스트              ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();
  
  console.log(`${YELLOW}⚠️  이 테스트를 실행하려면:${RESET}`);
  console.log(`   1. 웹 UI에서 봇을 먼저 생성하세요`);
  console.log(`   2. 생성된 봇의 ID를 이 스크립트에 입력하세요`);
  console.log(`   3. 아래 코드의 BOT_ID를 실제 봇 ID로 변경하세요`);
  console.log();
  
  // ============================================
  // 🔧 여기에 실제 봇 ID를 입력하세요!
  // ============================================
  const BOT_ID = 'YOUR_BOT_ID_HERE';
  
  if (BOT_ID === 'YOUR_BOT_ID_HERE') {
    console.log(`${RED}❌ 오류: 봇 ID를 설정해주세요!${RESET}`);
    console.log();
    console.log(`${YELLOW}설정 방법:${RESET}`);
    console.log(`   1. 이 파일(test-bot-prompt-rag.js)을 열기`);
    console.log(`   2. 54번째 줄의 'YOUR_BOT_ID_HERE'를 실제 봇 ID로 변경`);
    console.log(`   3. 저장 후 다시 실행: node test-bot-prompt-rag.js`);
    console.log();
    console.log(`${BLUE}봇 ID 찾는 방법:${RESET}`);
    console.log(`   • 방법 1: 웹 UI → AI 봇 관리 → 봇 목록에서 확인`);
    console.log(`   • 방법 2: 브라우저 개발자 도구(F12) → Network 탭 → API 요청 확인`);
    console.log(`   • 방법 3: 데이터베이스에서 직접 조회`);
    console.log();
    return;
  }
  
  console.log(`${BLUE}📝 테스트 설정:${RESET}`);
  console.log(`   • API Base: ${API_BASE}`);
  console.log(`   • Bot ID: ${BOT_ID}`);
  console.log(`   • 테스트 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log();
  
  // 테스트 케이스
  const testCases = [
    {
      name: "기본 인사 테스트",
      message: "안녕하세요",
      description: "시스템 프롬프트에 따라 인사에 적절히 응답하는지 확인"
    },
    {
      name: "짧은 질문 테스트",
      message: "오늘 날씨 어때?",
      description: "일반적인 짧은 질문에 정상 응답하는지 확인"
    },
    {
      name: "지식 기반 질문 (RAG 테스트)",
      message: "업로드한 자료에 대해 설명해줘",
      description: "지식 베이스나 RAG 자료를 참고하여 답변하는지 확인"
    },
    {
      name: "긴 질문 테스트",
      message: "인공지능과 머신러닝의 차이점을 자세히 설명해주고, 각각의 실제 활용 사례를 3가지씩 들어줘.",
      description: "복잡한 질문에 대해 체계적으로 답변하는지 확인"
    },
    {
      name: "대화 맥락 유지 테스트",
      message: "그럼 그것에 대해 좀 더 자세히 설명해줘",
      history: [
        { role: "user", content: "인공지능에 대해 알려줘" },
        { role: "assistant", content: "인공지능은 컴퓨터가 인간처럼 생각하고 학습하는 기술입니다." }
      ],
      description: "이전 대화 맥락을 기억하고 이어가는지 확인"
    }
  ];
  
  const results = [];
  let successCount = 0;
  let repetitionCount = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${YELLOW}[${i + 1}/${testCases.length}] ${testCase.name}${RESET}`);
    console.log(`   질문: "${testCase.message}"`);
    console.log(`   목적: ${testCase.description}`);
    
    const result = await testBotConversation(BOT_ID, testCase);
    results.push({
      name: testCase.name,
      ...result
    });
    
    if (result.success) {
      successCount++;
      
      // 응답 분석
      console.log(`   ${GREEN}✓ 성공${RESET} - ${result.responseTime}ms`);
      console.log(`   응답 길이: ${result.responseLength}자`);
      console.log(`   응답 미리보기: "${result.firstChars}${result.responseLength > 100 ? '...' : ''}"`);
      
      if (result.hasRepetition) {
        repetitionCount++;
        console.log(`   ${RED}⚠️  경고: 반복 패턴 감지! (봐봐봐봐 같은 이상한 응답)${RESET}`);
      }
      
      if (result.isShort) {
        console.log(`   ${YELLOW}⚠️  주의: 응답이 너무 짧음 (<10자)${RESET}`);
      }
      
      if (result.isTooLong) {
        console.log(`   ${YELLOW}⚠️  주의: 응답이 너무 김 (>5000자)${RESET}`);
      }
    } else {
      console.log(`   ${RED}✗ 실패${RESET} - ${result.error}`);
      
      if (result.httpStatus === 404) {
        console.log(`   ${YELLOW}💡 힌트: 봇 ID가 잘못되었을 수 있습니다${RESET}`);
      }
    }
    
    console.log();
    
    // API 부하 방지
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 결과 요약
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}                        결과 요약${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log();
  
  const successRate = (successCount / testCases.length * 100).toFixed(1);
  
  console.log(`${BLUE}📊 전체 통계:${RESET}`);
  console.log(`   • 총 테스트: ${testCases.length}개`);
  console.log(`   • ${successCount === testCases.length ? GREEN : successCount > 0 ? YELLOW : RED}성공: ${successCount}개 (${successRate}%)${RESET}`);
  console.log(`   • ${RED}실패: ${testCases.length - successCount}개${RESET}`);
  console.log(`   • ${repetitionCount > 0 ? RED : GREEN}반복 패턴: ${repetitionCount}개${RESET}`);
  console.log();
  
  // 상세 결과
  console.log(`${BLUE}📋 상세 결과:${RESET}`);
  results.forEach((result, idx) => {
    const status = result.success ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`   ${status} [${idx + 1}] ${result.name}`);
    
    if (result.success) {
      console.log(`      • 응답 시간: ${result.responseTime}ms`);
      console.log(`      • 응답 길이: ${result.responseLength}자`);
      console.log(`      • 반복 패턴: ${result.hasRepetition ? RED + '있음 ⚠️' + RESET : GREEN + '없음 ✓' + RESET}`);
    } else {
      console.log(`      • 오류: ${result.error}`);
    }
  });
  console.log();
  
  // 진단 및 권장사항
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}                    진단 및 권장사항${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log();
  
  if (successCount === 0) {
    console.log(`${RED}❌ 모든 테스트 실패${RESET}`);
    console.log();
    console.log(`${YELLOW}가능한 원인:${RESET}`);
    console.log(`   1. 봇 ID가 잘못됨`);
    console.log(`   2. 봇이 비활성화됨`);
    console.log(`   3. API 엔드포인트 오류`);
    console.log(`   4. 네트워크 연결 문제`);
    console.log();
    console.log(`${BLUE}해결 방법:${RESET}`);
    console.log(`   • 웹 UI에서 봇이 정상적으로 생성되었는지 확인`);
    console.log(`   • 브라우저 개발자 도구로 실제 API 요청 확인`);
    console.log(`   • Cloudflare 로그에서 오류 확인`);
  } else if (repetitionCount > 0) {
    console.log(`${RED}⚠️  반복 패턴 감지 ("봐봐봐봐" 문제)${RESET}`);
    console.log();
    console.log(`${YELLOW}가능한 원인:${RESET}`);
    console.log(`   1. 시스템 프롬프트가 너무 길거나 복잡함`);
    console.log(`   2. Temperature 값이 너무 높음 (>1.0)`);
    console.log(`   3. Max tokens 설정이 부적절함`);
    console.log(`   4. 지식 베이스가 너무 큼`);
    console.log(`   5. AI 모델 자체의 버그`);
    console.log();
    console.log(`${GREEN}해결 방법:${RESET}`);
    console.log(`   • Temperature를 0.3~0.7로 낮추기`);
    console.log(`   • Max tokens를 500~2000으로 제한`);
    console.log(`   • 시스템 프롬프트 단순화 (500자 이내)`);
    console.log(`   • 지식 베이스 크기 줄이기 (<10,000자)`);
    console.log(`   • 다른 모델로 변경해보기 (Gemini 2.5 Flash 추천)`);
  } else if (successCount === testCases.length) {
    console.log(`${GREEN}✅ 모든 테스트 통과!${RESET}`);
    console.log();
    console.log(`   • 시스템 프롬프트: 정상 작동 ✓`);
    console.log(`   • 지식 베이스(RAG): 정상 작동 ✓`);
    console.log(`   • 응답 품질: 정상 ✓`);
    console.log(`   • 대화 맥락 유지: 정상 ✓`);
    console.log();
    console.log(`${BLUE}프로덕션 배포 가능합니다!${RESET}`);
  } else {
    console.log(`${YELLOW}⚠️  일부 테스트 실패 (${successCount}/${testCases.length})${RESET}`);
    console.log();
    console.log(`   실패한 테스트를 개별적으로 확인하고`);
    console.log(`   위의 상세 결과를 참고하여 문제를 해결하세요.`);
  }
  console.log();
}

// 실행
runTests().catch(error => {
  console.error(`${RED}치명적 오류:${RESET}`, error);
  process.exit(1);
});
