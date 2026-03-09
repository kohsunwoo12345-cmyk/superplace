/**
 * 🧪 Gemini 2.5 Flash Lite 모델 테스트
 * 
 * 1. gemini-2.5-flash-lite 모델로 AI 봇 생성
 * 2. API 응답 테스트
 * 3. RAG 통합 테스트
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
  ragEnabled: boolean;
  knowledgeUsed: boolean;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

interface UploadResponse {
  success: boolean;
  filename: string;
  chunksProcessed: number;
  vectorsInserted: number;
  message: string;
  error?: string;
}

async function testBotCreation(): Promise<string | null> {
  console.log('\n📤 Test 1: AI 봇 생성 (gemini-2.5-flash-lite)');
  console.log('='.repeat(60));

  const botData = {
    name: '테스트 봇 (Gemini 2.5 Flash Lite)',
    description: 'gemini-2.5-flash-lite 모델 테스트용 봇',
    systemPrompt: '당신은 학생들을 돕는 친절한 AI 선생님입니다. 항상 명확하고 간결하게 답변하세요.',
    welcomeMessage: '안녕하세요! Gemini 2.5 Flash Lite 모델입니다. 무엇을 도와드릴까요?',
    starterMessage1: '수학 문제 도와줘',
    starterMessage2: '영어 공부 방법 알려줘',
    starterMessage3: '과학 개념 설명해줘',
    profileIcon: '🤖',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 2000,
    topK: 40,
    topP: 0.95,
    language: 'ko',
    enableProblemGeneration: false,
  };

  try {
    console.log('\n📝 생성할 봇 정보:');
    console.log(`   이름: ${botData.name}`);
    console.log(`   모델: ${botData.model}`);
    console.log(`   설명: ${botData.description}`);

    const response = await fetch(`${BASE_URL}/api/admin/ai-bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botData),
    });

    const data: BotCreateResponse = await response.json();

    console.log(`\n📊 응답 (Status: ${response.status}):`);
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      console.error('❌ 봇 생성 실패!');
      return null;
    }

    console.log(`\n✅ 봇 생성 성공!`);
    console.log(`   Bot ID: ${data.botId}`);
    return data.botId;
  } catch (error: any) {
    console.error('❌ 봇 생성 오류:', error.message);
    return null;
  }
}

async function testChatAPI(botId: string, message: string, enableRAG: boolean = false): Promise<boolean> {
  console.log(`\n💬 Test ${enableRAG ? '3' : '2'}: 채팅 API 테스트 ${enableRAG ? '(RAG 활성화)' : '(RAG 비활성화)'}`);
  console.log('='.repeat(60));
  console.log(`📝 메시지: "${message}"`);

  try {
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        systemPrompt: '당신은 친절한 AI 선생님입니다.',
        model: 'gemini-2.5-flash-lite',
        temperature: 0.7,
        maxTokens: 500,
        topK: 40,
        topP: 0.95,
        botId,
        enableRAG,
      }),
    });

    const data: ChatResponse = await response.json();

    console.log(`\n📊 응답 (Status: ${response.status}):`);
    
    if (!response.ok) {
      console.error('❌ API 호출 실패!');
      console.error('에러:', data.error);
      return false;
    }

    console.log(`\n✅ API 호출 성공!`);
    console.log(`   모델: ${data.model}`);
    console.log(`   RAG 활성화: ${data.ragEnabled ? '✅' : '❌'}`);
    console.log(`   지식 사용: ${data.knowledgeUsed ? '✅' : '❌'}`);
    console.log(`\n📝 토큰 사용량:`);
    console.log(`   입력: ${data.usage.promptTokens} tokens`);
    console.log(`   출력: ${data.usage.completionTokens} tokens`);
    console.log(`   전체: ${data.usage.totalTokens} tokens`);
    console.log(`\n🤖 AI 응답:`);
    console.log(`   ${data.response.substring(0, 200)}${data.response.length > 200 ? '...' : ''}`);

    return true;
  } catch (error: any) {
    console.error('❌ 채팅 API 오류:', error.message);
    return false;
  }
}

async function testRAGUpload(botId: string): Promise<boolean> {
  console.log('\n📚 Test 2.5: RAG 지식 업로드');
  console.log('='.repeat(60));

  const knowledgeContent = `
슈퍼플레이스는 학생과 선생님을 위한 교육 플랫폼입니다.

주요 기능:
1. AI 봇 - 맞춤형 학습 도우미
2. 문제 생성 - 자동 문제 출제
3. 학습 분석 - 학생 성취도 추적
4. 과제 관리 - 숙제 제출 및 피드백

특징:
- Gemini 2.5 Flash Lite 모델 지원
- RAG(Retrieval-Augmented Generation) 기반 답변
- 실시간 학습 진도 추적
`;

  try {
    const response = await fetch(`${BASE_URL}/api/rag/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: `bot-${botId}-knowledge.txt`,
        content: knowledgeContent,
        metadata: {
          botId,
          testMode: true,
          uploadedAt: new Date().toISOString(),
        },
      }),
    });

    const data: UploadResponse = await response.json();

    console.log(`\n📊 응답 (Status: ${response.status}):`);

    if (!response.ok || !data.success) {
      console.error('❌ 지식 업로드 실패!');
      console.error('에러:', data.error);
      if (data.error?.includes('768 dimensions')) {
        console.warn('\n⚠️  Vectorize 인덱스 차원 문제 감지!');
        console.warn('   해결: Vectorize 인덱스를 1024 dimensions로 재생성 필요');
      }
      return false;
    }

    console.log(`\n✅ 지식 업로드 성공!`);
    console.log(`   파일: ${data.filename}`);
    console.log(`   청크: ${data.chunksProcessed}개`);
    console.log(`   벡터: ${data.vectorsInserted}개`);

    return true;
  } catch (error: any) {
    console.error('❌ 지식 업로드 오류:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Gemini 2.5 Flash Lite 모델 테스트 시작...');
  console.log('='.repeat(60));
  console.log(`\n🌐 Base URL: ${BASE_URL}`);

  const results: { test: string; passed: boolean }[] = [];

  // Test 1: 봇 생성
  const botId = await testBotCreation();
  results.push({ test: '봇 생성', passed: botId !== null });

  if (!botId) {
    console.error('\n❌ 봇 생성 실패로 인해 나머지 테스트를 건너뜁니다.');
    process.exit(1);
  }

  // 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: 일반 채팅 (RAG 비활성화)
  const chatSuccess = await testChatAPI(botId, '안녕하세요! 슈퍼플레이스에 대해 알려주세요.', false);
  results.push({ test: '일반 채팅 API', passed: chatSuccess });

  // 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2.5: RAG 지식 업로드
  const uploadSuccess = await testRAGUpload(botId);
  results.push({ test: 'RAG 지식 업로드', passed: uploadSuccess });

  if (uploadSuccess) {
    // 대기 (벡터화 완료)
    console.log('\n⏳ 벡터화 처리 대기 (3초)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: RAG 채팅 (RAG 활성화)
    const ragChatSuccess = await testChatAPI(botId, '슈퍼플레이스의 주요 기능은 무엇인가요?', true);
    results.push({ test: 'RAG 채팅 API', passed: ragChatSuccess });
  }

  // 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));

  results.forEach((result, idx) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${idx + 1}: ${result.test}`);
  });

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n총 테스트: ${totalTests}`);
  console.log(`✅ 통과: ${passedTests}`);
  console.log(`❌ 실패: ${failedTests}`);
  console.log(`📈 성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.log('\n❌ 일부 테스트가 실패했습니다!');
    process.exit(1);
  } else {
    console.log('\n✅ 모든 테스트 통과!');
    console.log('\n🎉 gemini-2.5-flash-lite 모델이 정상 작동합니다!');
    console.log(`   - Bot ID: ${botId}`);
    console.log(`   - API 응답: ✅`);
    console.log(`   - RAG 통합: ${uploadSuccess ? '✅' : '❌'}`);
    process.exit(0);
  }
}

// 테스트 실행
runTests().catch(error => {
  console.error('❌ 테스트 실행 오류:', error);
  process.exit(1);
});
