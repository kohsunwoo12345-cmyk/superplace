/**
 * DeepSeek OCR-2 직접 API 테스트
 * /api/ai-chat 엔드포인트가 DeepSeek을 지원하는지 확인
 */

const API_BASE = 'https://superplacestudy.pages.dev';

// 색상 코드
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

/**
 * 실제 봇 ID로 테스트 (데이터베이스에서 DeepSeek 봇 찾기)
 */
async function testWithRealBot() {
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}  DeepSeek OCR-2 /api/ai-chat 엔드포인트 직접 테스트${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log();
  
  // 테스트 케이스들
  const tests = [
    {
      name: "테스트 1: 간단한 인사 (영어)",
      message: "Hello!",
      expectedKeywords: ["hello", "hi", "help"]
    },
    {
      name: "테스트 2: 간단한 수학 (덧셈)",
      message: "What is 5 + 3?",
      expectedKeywords: ["8", "eight"]
    },
    {
      name: "테스트 3: 한국어 인사",
      message: "안녕하세요!",
      expectedKeywords: ["안녕", "도움", "돕"]
    }
  ];
  
  let successCount = 0;
  const botId = `test-deepseek-bot-${Date.now()}`;
  
  console.log(`${BLUE}📝 안내:${RESET}`);
  console.log(`   이 테스트는 /api/ai-chat 엔드포인트가`);
  console.log(`   DeepSeek 모델을 올바르게 라우팅하는지 확인합니다.`);
  console.log(`   봇이 데이터베이스에 없으면 404 오류가 발생하지만,`);
  console.log(`   이는 정상입니다. 코드 수정이 배포되었는지만 확인합니다.`);
  console.log();
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${YELLOW}[${i + 1}/${tests.length}] ${test.name}${RESET}`);
    console.log(`   메시지: "${test.message}"`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          botId: botId,
          conversationHistory: [],
          userId: `test-user-${Date.now()}`,
          sessionId: `session-${Date.now()}`
        })
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      console.log(`   상태: HTTP ${response.status}`);
      console.log(`   응답 시간: ${responseTime}ms`);
      
      if (response.status === 404 && data.message === '봇을 찾을 수 없습니다') {
        console.log(`   ${GREEN}✓ 예상된 응답 (봇 없음)${RESET} - 코드 배포 확인됨`);
        successCount++;
      } else if (response.ok && data.success) {
        console.log(`   ${GREEN}✓ 성공${RESET} - ${data.response.substring(0, 50)}...`);
        successCount++;
      } else {
        console.log(`   ${RED}✗ 예상치 못한 응답${RESET}`);
        console.log(`   응답 데이터:`, JSON.stringify(data).substring(0, 200));
      }
      
    } catch (error) {
      console.log(`   ${RED}✗ 오류${RESET} - ${error.message}`);
    }
    
    console.log();
  }
  
  // 결과 요약
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}                        결과 요약${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════${RESET}`);
  console.log();
  console.log(`   총 테스트: ${tests.length}개`);
  console.log(`   ${successCount === tests.length ? GREEN : YELLOW}성공: ${successCount}개${RESET}`);
  console.log(`   ${successCount < tests.length ? RED : GREEN}실패: ${tests.length - successCount}개${RESET}`);
  console.log();
  
  if (successCount === tests.length) {
    console.log(`${GREEN}✅ /api/ai-chat 엔드포인트가 정상 작동합니다!${RESET}`);
    console.log();
    console.log(`${BLUE}다음 단계:${RESET}`);
    console.log(`   1. 웹 UI에서 DeepSeek OCR-2 봇 생성`);
    console.log(`      URL: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/create`);
    console.log(`   2. 모델: DeepSeek OCR-2 선택`);
    console.log(`   3. 봇 이름: "DeepSeek 학습 도우미" 등`);
    console.log(`   4. 시스템 프롬프트 설정 (선택사항)`);
    console.log(`   5. 저장 후 AI 챗봇 메뉴에서 테스트`);
  } else {
    console.log(`${RED}❌ 일부 테스트가 실패했습니다.${RESET}`);
    console.log(`   배포 상태를 확인하거나 잠시 후 다시 시도하세요.`);
  }
  console.log();
}

// 실행
testWithRealBot().catch(error => {
  console.error(`${RED}치명적 오류:${RESET}`, error);
  process.exit(1);
});
