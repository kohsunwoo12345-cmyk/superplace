/**
 * DeepSeek OCR-2 "봐봐봐봐" 문제 진단 스크립트
 * 
 * Novita AI를 통한 DeepSeek OCR-2 직접 테스트
 */

// Novita AI API 키 (환경변수 또는 직접 입력)
const NOVITA_API_KEY = process.env.Novita_AI_API || process.env.ALL_AI_API_KEY || 'YOUR_API_KEY_HERE';
const API_URL = 'https://api.novita.ai/v3/openai/chat/completions';
const MODEL = 'deepseek/deepseek-ocr-2';

// 색상
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

/**
 * 반복 패턴 감지
 */
function checkRepetition(text) {
  const patterns = [
    { regex: /(.{1,5})\1{5,}/g, name: "1-5자 5번+ 반복" },
    { regex: /봐{4,}/g, name: "봐 4번+ 반복" },
    { regex: /(.)\1{10,}/g, name: "같은 글자 10번+ 반복" },
    { regex: /(..)\1{5,}/g, name: "2자 5번+ 반복" }
  ];
  
  const found = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern.regex);
    if (matches) {
      found.push({ name: pattern.name, matches: matches.slice(0, 3) });
    }
  }
  
  return found;
}

/**
 * DeepSeek API 직접 호출
 */
async function testDeepSeek(testCase) {
  const startTime = Date.now();
  
  try {
    const messages = [];
    
    // 시스템 프롬프트
    if (testCase.systemPrompt) {
      messages.push({
        role: "system",
        content: testCase.systemPrompt
      });
    }
    
    // 대화 히스토리
    if (testCase.history) {
      messages.push(...testCase.history);
    }
    
    // 현재 메시지
    messages.push({
      role: "user",
      content: testCase.message
    });
    
    const requestBody = {
      model: MODEL,
      messages: messages,
      temperature: testCase.temperature || 0.7,
      max_tokens: testCase.maxTokens || 2000,
      top_p: testCase.topP || 0.95,
      stream: false  // 스트리밍 비활성화
    };
    
    console.log(`${BLUE}📤 API 요청:${RESET}`);
    console.log(`   Model: ${MODEL}`);
    console.log(`   Temperature: ${requestBody.temperature}`);
    console.log(`   Max tokens: ${requestBody.max_tokens}`);
    console.log(`   Messages: ${messages.length}개`);
    console.log(`   System prompt 길이: ${testCase.systemPrompt?.length || 0}자`);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NOVITA_API_KEY}`
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        responseTime,
        httpStatus: response.status,
        error: errorText,
      };
    }
    
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "응답 없음";
    const finishReason = data.choices?.[0]?.finish_reason;
    const usage = data.usage;
    
    // 반복 패턴 체크
    const repetitions = checkRepetition(aiResponse);
    
    return {
      success: true,
      responseTime,
      response: aiResponse,
      responseLength: aiResponse.length,
      finishReason,
      usage,
      repetitions,
      hasRepetition: repetitions.length > 0
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
 * 메인 테스트
 */
async function runTests() {
  console.log(`${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║        DeepSeek OCR-2 "봐봐봐봐" 문제 진단               ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();
  
  if (NOVITA_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log(`${RED}❌ API 키를 설정해주세요!${RESET}`);
    console.log();
    console.log(`${YELLOW}방법 1: 환경변수 설정${RESET}`);
    console.log(`   export Novita_AI_API="your-api-key"`);
    console.log();
    console.log(`${YELLOW}방법 2: 스크립트 수정${RESET}`);
    console.log(`   7번째 줄의 'YOUR_API_KEY_HERE'를 실제 API 키로 변경`);
    console.log();
    return;
  }
  
  console.log(`${BLUE}📝 테스트 설정:${RESET}`);
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   API Key: ${NOVITA_API_KEY.substring(0, 10)}...`);
  console.log();
  
  const testCases = [
    {
      name: "테스트 1: 기본 인사 (프롬프트 없음)",
      message: "안녕하세요",
      systemPrompt: null,
      temperature: 0.7,
      maxTokens: 200
    },
    {
      name: "테스트 2: 기본 인사 (간단한 프롬프트)",
      message: "안녕하세요",
      systemPrompt: "당신은 친절한 AI 어시스턴트입니다.",
      temperature: 0.7,
      maxTokens: 200
    },
    {
      name: "테스트 3: 기본 인사 (복잡한 프롬프트)",
      message: "안녕하세요",
      systemPrompt: `당신은 학생들의 학습을 돕는 친절하고 전문적인 AI 선생님입니다.

**역할:**
- 학생들이 개념을 쉽게 이해할 수 있도록 명확하고 간단한 설명 제공
- 질문에 대해 단계별로 차근차근 설명
- 학생의 수준에 맞춰 적절한 예시와 비유 사용`,
      temperature: 0.7,
      maxTokens: 200
    },
    {
      name: "테스트 4: 낮은 Temperature (0.3)",
      message: "안녕하세요",
      systemPrompt: "당신은 친절한 AI 어시스턴트입니다.",
      temperature: 0.3,
      maxTokens: 200
    },
    {
      name: "테스트 5: 매우 낮은 Temperature (0.1)",
      message: "안녕하세요",
      systemPrompt: "당신은 친절한 AI 어시스턴트입니다.",
      temperature: 0.1,
      maxTokens: 200
    },
    {
      name: "테스트 6: 짧은 max_tokens (50)",
      message: "안녕하세요",
      systemPrompt: "당신은 친절한 AI 어시스턴트입니다.",
      temperature: 0.7,
      maxTokens: 50
    },
    {
      name: "테스트 7: 수학 질문",
      message: "10 + 5는 얼마인가요?",
      systemPrompt: "당신은 친절한 수학 선생님입니다.",
      temperature: 0.3,
      maxTokens: 200
    },
    {
      name: "테스트 8: 지식 베이스 포함",
      message: "파이썬에 대해 알려줘",
      systemPrompt: `당신은 친절한 AI 어시스턴트입니다.

--- 지식 베이스 ---
파이썬은 프로그래밍 언어입니다.
귀도 반 로섬이 1991년에 만들었습니다.
간단하고 읽기 쉬운 문법이 특징입니다.
--- 지식 베이스 끝 ---

위 지식 베이스를 참고하여 답변하세요.`,
      temperature: 0.5,
      maxTokens: 300
    }
  ];
  
  const results = [];
  let repetitionCount = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${YELLOW}[${i + 1}/${testCases.length}] ${testCase.name}${RESET}`);
    console.log(`${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`   메시지: "${testCase.message}"`);
    console.log();
    
    const result = await testDeepSeek(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
    
    if (result.success) {
      console.log(`${GREEN}✓ 성공${RESET} - ${result.responseTime}ms`);
      console.log(`   응답 길이: ${result.responseLength}자`);
      console.log(`   Finish reason: ${result.finishReason}`);
      console.log(`   Token 사용: ${result.usage?.total_tokens || 0} (입력: ${result.usage?.prompt_tokens || 0}, 출력: ${result.usage?.completion_tokens || 0})`);
      console.log();
      console.log(`   ${CYAN}응답 미리보기:${RESET}`);
      console.log(`   "${result.response.substring(0, 150)}${result.response.length > 150 ? '...' : ''}"`);
      console.log();
      
      if (result.hasRepetition) {
        repetitionCount++;
        console.log(`   ${RED}⚠️⚠️⚠️  경고: 반복 패턴 감지! ⚠️⚠️⚠️${RESET}`);
        result.repetitions.forEach(rep => {
          console.log(`   ${RED}• ${rep.name}: ${JSON.stringify(rep.matches)}${RESET}`);
        });
        console.log();
        console.log(`   ${RED}전체 응답:${RESET}`);
        console.log(`   "${result.response}"`);
      } else {
        console.log(`   ${GREEN}✓ 반복 패턴 없음${RESET}`);
      }
    } else {
      console.log(`   ${RED}✗ 실패${RESET}`);
      console.log(`   HTTP Status: ${result.httpStatus || 'N/A'}`);
      console.log(`   오류: ${result.error?.substring(0, 300) || 'Unknown error'}`);
    }
    
    console.log();
    
    // API 부하 방지
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 결과 요약
  console.log(`${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║                        결과 요약                          ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();
  
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / testCases.length * 100).toFixed(1);
  const repetitionRate = (repetitionCount / successCount * 100).toFixed(1);
  
  console.log(`${BLUE}📊 전체 통계:${RESET}`);
  console.log(`   • 총 테스트: ${testCases.length}개`);
  console.log(`   • ${successCount === testCases.length ? GREEN : YELLOW}성공: ${successCount}개 (${successRate}%)${RESET}`);
  console.log(`   • ${RED}실패: ${testCases.length - successCount}개${RESET}`);
  console.log(`   • ${repetitionCount > 0 ? RED : GREEN}반복 패턴 발생: ${repetitionCount}개 (${repetitionRate}% of success)${RESET}`);
  console.log();
  
  // 상세 결과
  console.log(`${BLUE}📋 상세 결과:${RESET}`);
  results.forEach((result, idx) => {
    const status = result.success ? 
      (result.hasRepetition ? `${RED}⚠${RESET}` : `${GREEN}✓${RESET}`) : 
      `${RED}✗${RESET}`;
    console.log(`   ${status} [${idx + 1}] ${result.name.replace(/^테스트 \d+: /, '')}`);
    
    if (result.success) {
      console.log(`      • ${result.responseTime}ms, ${result.responseLength}자`);
      if (result.hasRepetition) {
        console.log(`      • ${RED}반복 패턴 있음!${RESET}`);
      }
    } else {
      console.log(`      • ${RED}오류: ${result.error?.substring(0, 50)}${RESET}`);
    }
  });
  console.log();
  
  // 진단 및 권장사항
  console.log(`${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║                    진단 및 권장사항                       ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();
  
  if (repetitionCount > 0) {
    console.log(`${RED}❌ DeepSeek OCR-2에서 반복 패턴이 발견되었습니다!${RESET}`);
    console.log();
    console.log(`${YELLOW}가능한 원인:${RESET}`);
    console.log(`   1. ${YELLOW}DeepSeek OCR-2 모델 자체의 문제${RESET} (가장 가능성 높음)`);
    console.log(`   2. Temperature가 너무 높음 (>0.7)`);
    console.log(`   3. System prompt가 모델과 호환되지 않음`);
    console.log(`   4. Max tokens 설정 문제`);
    console.log(`   5. Novita AI API의 버그`);
    console.log();
    console.log(`${GREEN}해결 방법:${RESET}`);
    console.log(`   ✅ 권장 1: ${GREEN}다른 모델 사용${RESET}`);
    console.log(`      • Gemini 2.5 Flash (무료, 안정적, 한국어 우수)`);
    console.log(`      • GPT-4o mini (저렴, 빠름)`);
    console.log();
    console.log(`   ✅ 권장 2: ${GREEN}DeepSeek 파라미터 조정${RESET}`);
    console.log(`      • Temperature: 0.1~0.3 (매우 낮게)`);
    console.log(`      • Max tokens: 50~150 (짧게)`);
    console.log(`      • System prompt: 단순화 (100자 이내)`);
    console.log();
    console.log(`   ⚠️  권장 3: ${YELLOW}DeepSeek 사용 중단${RESET}`);
    console.log(`      • 반복 문제가 계속되면 DeepSeek OCR-2 대신`);
    console.log(`        Gemini 2.5 Flash를 사용하세요`);
  } else if (successCount === testCases.length) {
    console.log(`${GREEN}✅ 모든 테스트 통과! DeepSeek OCR-2가 정상 작동합니다!${RESET}`);
    console.log();
    console.log(`   현재 설정으로 프로덕션 배포 가능합니다.`);
  } else {
    console.log(`${YELLOW}⚠️  일부 테스트 실패${RESET}`);
    console.log();
    console.log(`   실패한 테스트의 오류 메시지를 확인하고`);
    console.log(`   API 키 또는 네트워크 연결을 점검하세요.`);
  }
  console.log();
}

// 실행
runTests().catch(error => {
  console.error(`${RED}치명적 오류:${RESET}`, error);
  process.exit(1);
});
