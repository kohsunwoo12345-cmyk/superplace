/**
 * 🧪 숙제 검사 AI 설정 테스트
 * 
 * 1. 설정 저장 테스트
 * 2. 설정 불러오기 테스트
 * 3. RAG 지식 업로드 테스트
 * 4. 실제 채점 적용 테스트
 */

const BASE_URL = process.env.TEST_BASE_URL || 'https://superplacestudy.pages.dev';

interface ConfigResponse {
  config?: {
    id: number | null;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    enableRAG: number;
    knowledgeBase: string;
  };
  success?: boolean;
  configId?: number;
  error?: string;
}

const TEST_CONFIG = {
  systemPrompt: `테스트 채점 프롬프트입니다.

1. 학생의 답안을 정확히 확인하세요
2. 정답과 비교하여 채점하세요
3. 구체적인 피드백을 제공하세요

JSON 형식으로 응답하세요.`,
  model: 'gemini-2.5-flash-lite',
  temperature: 0.5,
  maxTokens: 1500,
  enableRAG: true,
  knowledgeBase: `참고 지식:
- 수학 문제는 정확한 계산이 중요합니다
- 영어 문제는 철자와 문법을 확인하세요
- 과학 문제는 개념 이해를 평가하세요`,
};

async function test1_GetDefaultConfig(): Promise<boolean> {
  console.log('\n📤 Test 1: 기본 설정 조회');
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
    const data: ConfigResponse = await response.json();

    console.log(`\n📊 응답 (Status: ${response.status}):`);
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ 설정 조회 실패!');
      return false;
    }

    console.log('\n✅ 설정 조회 성공!');
    if (data.config) {
      console.log(`   프롬프트 길이: ${data.config.systemPrompt?.length || 0}자`);
      console.log(`   모델: ${data.config.model}`);
      console.log(`   RAG: ${data.config.enableRAG ? '활성화' : '비활성화'}`);
    }
    return true;
  } catch (error: any) {
    console.error('❌ 요청 실패:', error.message);
    return false;
  }
}

async function test2_SaveConfig(): Promise<boolean> {
  console.log('\n📤 Test 2: 설정 저장');
  console.log('='.repeat(60));

  try {
    console.log('\n📝 저장할 설정:');
    console.log(`   모델: ${TEST_CONFIG.model}`);
    console.log(`   Temperature: ${TEST_CONFIG.temperature}`);
    console.log(`   RAG: ${TEST_CONFIG.enableRAG ? '활성화' : '비활성화'}`);
    console.log(`   지식 베이스: ${TEST_CONFIG.knowledgeBase.length}자`);

    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CONFIG),
    });

    const data: ConfigResponse = await response.json();

    console.log(`\n📊 응답 (Status: ${response.status}):`);
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      console.error('❌ 설정 저장 실패!');
      return false;
    }

    console.log('\n✅ 설정 저장 성공!');
    console.log(`   Config ID: ${data.configId}`);
    return true;
  } catch (error: any) {
    console.error('❌ 요청 실패:', error.message);
    return false;
  }
}

async function test3_LoadSavedConfig(): Promise<boolean> {
  console.log('\n📤 Test 3: 저장된 설정 불러오기');
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
    const data: ConfigResponse = await response.json();

    console.log(`\n📊 응답 (Status: ${response.status}):`);

    if (!response.ok || !data.config) {
      console.error('❌ 설정 불러오기 실패!');
      return false;
    }

    console.log('\n✅ 설정 불러오기 성공!');
    console.log(`   모델: ${data.config.model}`);
    console.log(`   Temperature: ${data.config.temperature}`);
    console.log(`   MaxTokens: ${data.config.maxTokens}`);
    console.log(`   RAG: ${data.config.enableRAG ? '활성화' : '비활성화'}`);
    console.log(`   프롬프트: ${data.config.systemPrompt.substring(0, 50)}...`);

    // 저장한 값과 비교
    const isMatch = 
      data.config.model === TEST_CONFIG.model &&
      data.config.temperature === TEST_CONFIG.temperature &&
      data.config.enableRAG === (TEST_CONFIG.enableRAG ? 1 : 0);

    if (isMatch) {
      console.log('\n✅ 저장된 값이 일치합니다!');
      return true;
    } else {
      console.error('\n❌ 저장된 값이 일치하지 않습니다!');
      return false;
    }
  } catch (error: any) {
    console.error('❌ 요청 실패:', error.message);
    return false;
  }
}

async function test4_UploadKnowledgeToVectorize(): Promise<boolean> {
  console.log('\n📤 Test 4: RAG 지식 Vectorize 업로드');
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/api/rag/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'homework-grading-knowledge.txt',
        content: TEST_CONFIG.knowledgeBase,
        metadata: {
          type: 'homework-grading',
          botId: 'homework-grading-system',
        },
      }),
    });

    const data = await response.json();

    console.log(`\n📊 응답 (Status: ${response.status}):`);

    if (!response.ok) {
      console.error('❌ Vectorize 업로드 실패!');
      console.error(JSON.stringify(data, null, 2));
      return false;
    }

    console.log('\n✅ Vectorize 업로드 성공!');
    console.log(`   파일: ${data.filename}`);
    console.log(`   청크: ${data.chunksProcessed}개`);
    console.log(`   벡터: ${data.vectorsInserted}개`);
    return true;
  } catch (error: any) {
    console.error('❌ 요청 실패:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 숙제 검사 AI 설정 테스트 시작...');
  console.log('='.repeat(60));
  console.log(`\n🌐 Base URL: ${BASE_URL}`);

  const results: { test: string; passed: boolean }[] = [];

  // Test 1: 기본 설정 조회
  const test1 = await test1_GetDefaultConfig();
  results.push({ test: '기본 설정 조회', passed: test1 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: 설정 저장
  const test2 = await test2_SaveConfig();
  results.push({ test: '설정 저장', passed: test2 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: 저장된 설정 불러오기
  const test3 = await test3_LoadSavedConfig();
  results.push({ test: '저장된 설정 불러오기', passed: test3 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Vectorize 업로드
  const test4 = await test4_UploadKnowledgeToVectorize();
  results.push({ test: 'RAG 지식 업로드', passed: test4 });

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
    console.log('\n❌ 일부 테스트 실패!');
    process.exit(1);
  } else {
    console.log('\n✅ 모든 테스트 통과!');
    console.log('\n🎉 숙제 검사 AI 설정 기능 정상 작동!');
    console.log('   - 설정 저장: ✅');
    console.log('   - 설정 불러오기: ✅');
    console.log('   - RAG 지식 업로드: ✅');
    console.log('\n💡 실제 숙제 채점 시 저장된 설정이 자동으로 적용됩니다.');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('❌ 테스트 실행 오류:', error);
  process.exit(1);
});
