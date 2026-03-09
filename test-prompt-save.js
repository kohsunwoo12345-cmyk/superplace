const BASE_URL = 'https://superplacestudy.pages.dev';

async function testPromptSaveAndLoad() {
  console.log('🧪 숙제 검사 프롬프트 저장/로드 테스트 시작...\n');
  
  // 테스트 1: 현재 설정 로드
  console.log('📋 Test 1: 현재 설정 불러오기');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
    const data = await response.json();
    console.log('✅ 응답:', JSON.stringify(data, null, 2));
    console.log('✅ systemPrompt 길이:', data.config?.systemPrompt?.length || 0);
    console.log('✅ systemPrompt 첫 100자:', data.config?.systemPrompt?.substring(0, 100) || 'N/A');
  } catch (error) {
    console.error('❌ 실패:', error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 테스트 2: 새로운 프롬프트로 저장
  console.log('📋 Test 2: 새로운 프롬프트 저장');
  const testPrompt = `테스트 프롬프트 - ${new Date().toISOString()}

당신은 전문 교사입니다. 숙제를 채점하세요.

1. 문제 식별
2. 답안 확인
3. 채점

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "totalQuestions": 문제 총 개수,
  "correctAnswers": 맞은 문제 수,
  "detailedResults": [],
  "overallFeedback": "전체적인 피드백",
  "strengths": "잘한 점",
  "improvements": "개선할 점"
}`;
  
  try {
    const saveResponse = await fetch(`${BASE_URL}/api/admin/homework-grading-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: testPrompt,
        model: 'gemini-2.5-flash',
        temperature: 0.3,
        maxTokens: 2000,
        topK: 40,
        topP: 0.95,
        enableRAG: 0,
        knowledgeBase: null
      })
    });
    const saveData = await saveResponse.json();
    console.log('✅ 저장 응답:', JSON.stringify(saveData, null, 2));
  } catch (error) {
    console.error('❌ 저장 실패:', error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 테스트 3: 저장 후 다시 로드하여 확인
  console.log('📋 Test 3: 저장 후 다시 불러오기');
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  
  try {
    const verifyResponse = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
    const verifyData = await verifyResponse.json();
    console.log('✅ 검증 응답:', JSON.stringify(verifyData, null, 2));
    console.log('✅ systemPrompt 길이:', verifyData.config?.systemPrompt?.length || 0);
    console.log('✅ systemPrompt 첫 100자:', verifyData.config?.systemPrompt?.substring(0, 100) || 'N/A');
    
    if (verifyData.config?.systemPrompt?.includes('테스트 프롬프트')) {
      console.log('✅ 프롬프트 저장 확인됨!');
    } else {
      console.log('❌ 프롬프트가 저장되지 않았습니다!');
    }
  } catch (error) {
    console.error('❌ 검증 실패:', error.message);
  }
}

testPromptSaveAndLoad().catch(console.error);
