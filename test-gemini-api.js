// Gemini API 테스트 스크립트
// 환경 변수 GOOGLE_GEMINI_API_KEY가 설정되어 있어야 합니다

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const MODEL = "gemini-1.5-pro";

async function testGeminiAPI() {
  console.log("🧪 Gemini API 테스트 시작...\n");
  
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    console.error("❌ GOOGLE_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
    console.log("\n설정 방법:");
    console.log("  export GOOGLE_GEMINI_API_KEY='your-api-key-here'");
    console.log("  node test-gemini-api.js");
    return;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  
  const testMessage = "안녕하세요! 간단한 인사로 응답해주세요.";
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: testMessage,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 100,
      topK: 40,
      topP: 0.95,
    },
  };

  try {
    console.log("📤 요청 전송 중...");
    console.log(`   모델: ${MODEL}`);
    console.log(`   메시지: "${testMessage}"\n`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📊 응답 상태: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API 오류 발생:");
      console.error(errorText);
      return;
    }

    const data = await response.json();
    
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (responseText) {
      console.log("✅ 성공! Gemini API 응답:\n");
      console.log("─".repeat(60));
      console.log(responseText);
      console.log("─".repeat(60));
      
      if (data.usageMetadata) {
        console.log("\n📈 사용량 정보:");
        console.log(`   입력 토큰: ${data.usageMetadata.promptTokenCount || 0}`);
        console.log(`   출력 토큰: ${data.usageMetadata.candidatesTokenCount || 0}`);
        console.log(`   총 토큰: ${data.usageMetadata.totalTokenCount || 0}`);
      }
    } else {
      console.log("⚠️  응답은 받았지만 텍스트를 추출할 수 없습니다.");
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error("❌ 테스트 실패:", error.message);
  }
}

// 실행
testGeminiAPI();
