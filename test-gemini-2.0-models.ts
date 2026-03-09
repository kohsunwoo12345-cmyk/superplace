/**
 * 🧪 Gemini 2.0 모델 테스트
 * 
 * 테스트 모델:
 * - gemini-2.0-flash
 * - gemini-2.0-flash-lite
 */

const BASE_URL = process.env.TEST_BASE_URL || 'https://superplacestudy.pages.dev';

interface BotCreateResponse {
  success: boolean;
  botId: string;
  message: string;
  error?: string;
}

interface ChatResponse {
  response: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

const MODELS_TO_TEST = [
  {
    name: 'gemini-2.0-flash',
    description: 'Gemini 2.0 Flash'
  },
  {
    name: 'gemini-2.0-flash-lite',
    description: 'Gemini 2.0 Flash Lite'
  }
];

async function testBotCreation(modelName: string): Promise<string | null> {
  console.log(`\n📤 봇 생성: ${modelName}`);
  console.log('─'.repeat(60));

  const botData = {
    name: `테스트 봇 (${modelName})`,
    description: `${modelName} 모델 테스트용 봇`,
    systemPrompt: '당신은 친절한 AI 선생님입니다. 간결하게 답변하세요.',
    welcomeMessage: `안녕하세요! ${modelName} 모델입니다.`,
    starterMessage1: '수학 문제 도와줘',
    profileIcon: '🤖',
    model: modelName,
    temperature: 0.7,
    maxTokens: 500,
    topK: 40,
    topP: 0.95,
    language: 'ko',
  };

  try {
    const response = await fetch(`${BASE_URL}/api/admin/ai-bots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(botData),
    });

    const data: BotCreateResponse = await response.json();

    if (!response.ok || !data.success) {
      console.error(`❌ 봇 생성 실패 (Status: ${response.status})`);
      if (data.error) console.error(`   에러: ${data.error}`);
      return null;
    }

    console.log(`✅ 봇 생성 성공`);
    console.log(`   Bot ID: ${data.botId}`);
    return data.botId;
  } catch (error: any) {
    console.error(`❌ 요청 실패: ${error.message}`);
    return null;
  }
}

async function testChatAPI(modelName: string, botId: string): Promise<boolean> {
  console.log(`\n💬 채팅 API 테스트: ${modelName}`);
  console.log('─'.repeat(60));

  const message = '안녕하세요! 1+1은?';
  console.log(`📝 메시지: "${message}"`);

  try {
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        systemPrompt: '당신은 친절한 AI입니다. 간결하게 답변하세요.',
        model: modelName,
        temperature: 0.7,
        maxTokens: 500,
        topK: 40,
        topP: 0.95,
        botId,
        enableRAG: false,
      }),
    });

    const data: ChatResponse = await response.json();

    if (!response.ok) {
      console.error(`❌ API 호출 실패 (Status: ${response.status})`);
      if (data.error) console.error(`   에러: ${data.error}`);
      return false;
    }

    console.log(`✅ API 호출 성공`);
    console.log(`   모델: ${data.model}`);
    console.log(`   토큰: ${data.usage.totalTokens} (입력: ${data.usage.promptTokens}, 출력: ${data.usage.completionTokens})`);
    console.log(`   응답: ${data.response.substring(0, 100)}...`);
    return true;
  } catch (error: any) {
    console.error(`❌ 요청 실패: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║     🧪 Gemini 2.0 모델 테스트                                ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n🌐 Base URL: ${BASE_URL}\n`);

  const results: { model: string; botCreated: boolean; apiWorked: boolean }[] = [];

  for (const model of MODELS_TO_TEST) {
    console.log('\n' + '═'.repeat(60));
    console.log(`🔍 모델: ${model.description}`);
    console.log('═'.repeat(60));

    // Test 1: 봇 생성
    const botId = await testBotCreation(model.name);
    const botCreated = botId !== null;

    // Test 2: API 호출
    let apiWorked = false;
    if (botId) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      apiWorked = await testChatAPI(model.name, botId);
    }

    results.push({
      model: model.name,
      botCreated,
      apiWorked
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 요약
  console.log('\n' + '═'.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('═'.repeat(60));

  results.forEach((result, idx) => {
    console.log(`\n${idx + 1}. ${result.model}`);
    console.log(`   봇 생성: ${result.botCreated ? '✅' : '❌'}`);
    console.log(`   API 호출: ${result.apiWorked ? '✅' : '❌'}`);
  });

  const totalTests = results.length * 2;
  const passedTests = results.reduce((sum, r) => sum + (r.botCreated ? 1 : 0) + (r.apiWorked ? 1 : 0), 0);

  console.log(`\n총 테스트: ${totalTests}개`);
  console.log(`✅ 통과: ${passedTests}개`);
  console.log(`❌ 실패: ${totalTests - passedTests}개`);
  console.log(`📈 성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 모든 테스트 통과!');
    console.log('✅ gemini-2.0-flash: 정상 작동');
    console.log('✅ gemini-2.0-flash-lite: 정상 작동');
    process.exit(0);
  } else {
    console.log('\n⚠️  일부 테스트 실패');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ 테스트 실행 오류:', error);
  process.exit(1);
});
