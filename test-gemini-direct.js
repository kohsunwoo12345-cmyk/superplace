/**
 * 간단한 Gemini API 직접 호출 테스트
 * 
 * "봐봐봐봐" 문제 진단용
 */

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const MODEL = 'gemini-2.5-flash';

async function testGeminiDirect() {
  console.log('🧪 Gemini API 직접 호출 테스트\n');
  
  const testCases = [
    {
      name: "기본 인사",
      systemPrompt: "당신은 친절한 AI 어시스턴트입니다.",
      userMessage: "안녕하세요"
    },
    {
      name: "복잡한 프롬프트",
      systemPrompt: `당신은 학생들의 학습을 돕는 친절하고 전문적인 AI 선생님입니다.

**역할:**
- 학생들이 개념을 쉽게 이해할 수 있도록 명확하고 간단한 설명 제공
- 질문에 대해 단계별로 차근차근 설명
- 학생의 수준에 맞춰 적절한 예시와 비유 사용

**답변 방식:**
1. 학생의 질문을 정확히 이해했는지 확인
2. 핵심 개념을 먼저 설명
3. 구체적인 예시나 그림으로 보충 설명
4. 연습 문제나 추가 학습 자료 제안`,
      userMessage: "안녕하세요"
    },
    {
      name: "지식 베이스 포함",
      systemPrompt: `당신은 친절한 AI 어시스턴트입니다.

--- 지식 베이스 (Knowledge Base) ---
파이썬은 프로그래밍 언어입니다.
귀도 반 로섬이 1991년에 만들었습니다.
간단하고 읽기 쉬운 문법이 특징입니다.
--- 지식 베이스 끝 ---

위 지식 베이스의 정보를 참고하여 질문에 답변하세요.`,
      userMessage: "파이썬에 대해 알려줘"
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 테스트: ${testCase.name}`);
    console.log(`   시스템 프롬프트 길이: ${testCase.systemPrompt.length}자`);
    console.log(`   사용자 메시지: "${testCase.userMessage}"`);
    
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      
      const contents = [];
      
      // 시스템 프롬프트를 대화 형식으로 추가
      contents.push({
        role: "user",
        parts: [{ text: `시스템 지침:\n${testCase.systemPrompt}` }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "알겠습니다. 지침과 자료를 참고하여 답변하겠습니다." }]
      });
      
      // 실제 사용자 메시지
      contents.push({
        role: "user",
        parts: [{ text: testCase.userMessage }]
      });
      
      const startTime = Date.now();
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2000,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        }),
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ 오류 (HTTP ${response.status}): ${errorText.substring(0, 200)}`);
        continue;
      }
      
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답 없음";
      
      console.log(`   ✅ 성공 (${responseTime}ms)`);
      console.log(`   응답 길이: ${aiResponse.length}자`);
      console.log(`   응답 미리보기:\n   "${aiResponse.substring(0, 150)}${aiResponse.length > 150 ? '...' : ''}"`);
      
      // 반복 패턴 체크
      const hasRepetition = /(.{1,5})\1{5,}/.test(aiResponse) || 
                           /봐{4,}/.test(aiResponse) || 
                           /(.)\1{10,}/.test(aiResponse);
      
      if (hasRepetition) {
        console.log(`   ⚠️  경고: 반복 패턴 감지!`);
        console.log(`   전체 응답:\n   "${aiResponse}"`);
      }
      
      // Finish reason 확인
      const finishReason = data.candidates?.[0]?.finishReason;
      console.log(`   종료 이유: ${finishReason || 'UNKNOWN'}`);
      
      // Safety ratings 확인
      const safetyRatings = data.candidates?.[0]?.safetyRatings;
      if (safetyRatings && safetyRatings.length > 0) {
        console.log(`   안전 필터:`);
        safetyRatings.forEach(rating => {
          if (rating.probability !== 'NEGLIGIBLE') {
            console.log(`      • ${rating.category}: ${rating.probability}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
    }
  }
  
  console.log('\n\n✅ 테스트 완료');
  console.log('\n💡 만약 "봐봐봐봐" 같은 반복이 보인다면:');
  console.log('   1. Temperature를 낮춰보세요 (0.3~0.5)');
  console.log('   2. Top-K를 낮춰보세요 (20~30)');
  console.log('   3. 시스템 프롬프트를 단순화하세요');
  console.log('   4. 다른 모델을 시도하세요 (gemini-2.5-flash-lite)');
  console.log('   5. Safety settings를 조정하세요');
}

testGeminiDirect().catch(error => {
  console.error('치명적 오류:', error);
  process.exit(1);
});
