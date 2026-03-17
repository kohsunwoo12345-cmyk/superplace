const fetch = require('node-fetch');

async function testAssignAPI() {
  console.log('=== AI 봇 할당 API 400 에러 디버깅 ===\n');
  
  // 실제 API 호출 (에러 확인용)
  const testData = {
    botId: 'test-bot-123',
    userId: 'test-user-456',
    duration: 30,
    durationUnit: 'day'
  };
  
  console.log('테스트 요청 데이터:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('https://superplacestudy.pages.dev/api/admin/ai-bots/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('\nAPI 응답 상태:', response.status);
    console.log('API 응답 내용:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('API 호출 에러:', error.message);
  }
}

testAssignAPI();
