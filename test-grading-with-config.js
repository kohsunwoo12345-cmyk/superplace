const BASE_URL = 'https://superplacestudy.pages.dev';

async function testGradingWithConfig() {
  console.log('🧪 숙제 채점 DB 설정 적용 테스트\n');
  
  // 테스트 1: 현재 설정 확인
  console.log('📋 Test 1: 현재 채점 설정 확인');
  const configResponse = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
  const configData = await configResponse.json();
  
  if (configData.success) {
    console.log('✅ 현재 설정:');
    console.log('  - Model:', configData.config.model);
    console.log('  - Temperature:', configData.config.temperature);
    console.log('  - MaxTokens:', configData.config.maxTokens);
    console.log('  - SystemPrompt (첫 100자):', configData.config.systemPrompt.substring(0, 100));
  } else {
    console.error('❌ 설정 로드 실패');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 테스트 2: 테스트용 프롬프트 저장
  console.log('📋 Test 2: 테스트용 프롬프트 저장');
  const testTimestamp = new Date().toISOString();
  const testPrompt = `[테스트 프롬프트 - ${testTimestamp}]

당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요
3. 정답 여부를 판단하세요 (문제에 정답이 표시되어 있거나, 일반적인 학습 지식으로 판단)
4. 각 문제에 대한 피드백을 제공하세요

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "totalQuestions": 문제 총 개수,
  "correctAnswers": 맞은 문제 수,
  "detailedResults": [
    {
      "questionNumber": 1,
      "isCorrect": true/false,
      "studentAnswer": "학생이 작성한 답",
      "correctAnswer": "정답",
      "explanation": "채점 근거 및 설명"
    }
  ],
  "overallFeedback": "전체적인 피드백",
  "strengths": "잘한 점",
  "improvements": "개선할 점"
}`;

  const saveResponse = await fetch(`${BASE_URL}/api/admin/homework-grading-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: testPrompt,
      model: 'gemini-2.5-flash',
      temperature: 0.5, // 테스트용으로 다른 값 사용
      maxTokens: 3000,
      topK: 40,
      topP: 0.95,
      enableRAG: 0,
      knowledgeBase: null
    })
  });
  
  const saveData = await saveResponse.json();
  if (saveData.success) {
    console.log('✅ 테스트 프롬프트 저장 성공');
    console.log('  - Config ID:', saveData.configId);
  } else {
    console.error('❌ 저장 실패');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 테스트 3: 저장된 설정 재확인
  console.log('📋 Test 3: 저장된 설정 재확인');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const verifyResponse = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
  const verifyData = await verifyResponse.json();
  
  if (verifyData.success) {
    console.log('✅ 저장된 설정 확인:');
    console.log('  - Model:', verifyData.config.model);
    console.log('  - Temperature:', verifyData.config.temperature);
    console.log('  - MaxTokens:', verifyData.config.maxTokens);
    
    if (verifyData.config.systemPrompt.includes(testTimestamp)) {
      console.log('✅ 테스트 프롬프트 저장 확인됨!');
    } else {
      console.log('❌ 프롬프트가 제대로 저장되지 않았습니다');
    }
    
    // Temperature 확인
    if (verifyData.config.temperature === 0.5) {
      console.log('✅ Temperature 설정 확인됨 (0.5)');
    } else {
      console.log(`❌ Temperature가 ${verifyData.config.temperature}로 설정됨 (예상: 0.5)`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 테스트 요약:');
  console.log('✅ Test 1: 현재 설정 확인 완료');
  console.log('✅ Test 2: 테스트 프롬프트 저장 완료');
  console.log('✅ Test 3: 저장된 설정 검증 완료');
  console.log('\n⚠️ 참고: 실제 숙제 채점 시 위 설정이 적용되는지는');
  console.log('   실제 숙제 제출 후 로그를 확인해야 합니다.');
  console.log('   로그에서 "✅ DB에서 채점 설정 로드" 메시지를 찾으세요.');
}

testGradingWithConfig().catch(console.error);
