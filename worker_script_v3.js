/**
 * Cloudflare Worker - 숙제 채점 시스템 v3.0
 * 
 * 워크플로우:
 * 1. Gemini 2.5 Flash Lite: 이미지 분석 → 문제 유형/과목 파악
 * 2. Python Worker: 문제 풀이 (필요시 RAG)
 * 3. Gemini 2.5 Flash Lite: 최종 채점 및 상세 피드백
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Content-Type': 'application/json'
};

/**
 * Step 1: Gemini가 이미지를 분석하여 문제 파악
 */
async function analyzeHomeworkWithGemini(imageBase64, env) {
  const apiKey = env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_GEMINI_API_KEY 없음");
    return { 
      success: false, 
      error: "API 키가 설정되지 않았습니다" 
    };
  }

  try {
    console.log("📸 Step 1: Gemini로 이미지 분석 시작");
    
    // Base64에서 data:image/... 부분 제거
    let cleanBase64 = imageBase64;
    if (imageBase64.includes(',')) {
      cleanBase64 = imageBase64.split(',')[1];
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `이 숙제 이미지를 분석하여 다음 정보를 JSON 형식으로 반환해주세요:

{
  "subject": "math" | "english" | "science" | "korean" | "other",
  "problemType": "계산" | "서술형" | "객관식" | "주관식" | "기타",
  "extractedText": "이미지에서 추출한 모든 텍스트 (문제와 학생 답안 포함)",
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "문제 내용",
      "studentAnswer": "학생이 작성한 답",
      "needsPythonExecution": true | false
    }
  ],
  "totalQuestions": 문제 개수
}

주의사항:
- extractedText에는 이미지의 모든 텍스트를 정확히 추출
- 수학 수식, 기호, 한글, 영어 모두 포함
- 학생의 필기체도 최대한 정확히 인식
- 문제와 답안을 구분하여 questions 배열에 정리
- Python으로 계산이 필요한 문제는 needsPythonExecution: true 설정`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      })
    });

    console.log(`📡 Gemini 응답 상태: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API 오류:", errorText.substring(0, 500));
      return { 
        success: false, 
        error: `Gemini API 오류 (${response.status})` 
      };
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("❌ Gemini 응답에 candidates 없음");
      return { 
        success: false, 
        error: "Gemini가 이미지를 분석하지 못했습니다" 
      };
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log("📝 Gemini 분석 결과:", text.substring(0, 300));
    
    // JSON 추출 (```json ... ``` 형식 처리)
    let jsonText = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else if (text.includes('{')) {
      jsonText = text.substring(text.indexOf('{'));
      if (jsonText.lastIndexOf('}') > 0) {
        jsonText = jsonText.substring(0, jsonText.lastIndexOf('}') + 1);
      }
    }
    
    const analysis = JSON.parse(jsonText);
    console.log(`✅ 분석 완료: ${analysis.subject} / ${analysis.totalQuestions}문제 / ${analysis.extractedText.length}자`);
    
    return {
      success: true,
      analysis: analysis
    };

  } catch (error) {
    console.error("❌ 이미지 분석 오류:", error.message);
    console.error("Stack:", error.stack);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Step 2: Python Worker로 문제 풀이 (필요시)
 */
async function executePythonIfNeeded(questions) {
  // Python 실행이 필요한 문제만 필터링
  const pythonQuestions = questions.filter(q => q.needsPythonExecution);
  
  if (pythonQuestions.length === 0) {
    console.log("ℹ️ Python 실행 불필요");
    return { success: true, results: [] };
  }

  console.log(`🐍 Step 2: Python 실행 필요 (${pythonQuestions.length}문제)`);
  
  // 실제 Python Worker 호출은 향후 구현
  // 지금은 스킵하고 Gemini가 모든 채점 처리
  return { success: true, results: [] };
}

/**
 * Step 3: Gemini로 최종 채점 및 피드백
 */
async function gradeWithGemini(analysis, pythonResults, env) {
  const apiKey = env.GOOGLE_GEMINI_API_KEY;
  
  try {
    console.log("📝 Step 3: Gemini로 최종 채점 시작");
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    
    const prompt = `다음 학생의 숙제를 채점하고 JSON 형식으로 결과를 반환해주세요:

**과목**: ${analysis.subject}
**총 문제 수**: ${analysis.totalQuestions}

**추출된 내용**:
${analysis.extractedText}

**문제별 상세**:
${JSON.stringify(analysis.questions, null, 2)}

다음 JSON 형식으로 채점 결과를 반환해주세요:
{
  "totalQuestions": 전체 문제 수,
  "correctAnswers": 맞은 문제 수,
  "score": 점수 (0-100),
  "overallFeedback": "전체 평가 (2-3문장)",
  "strengths": "잘한 점 (구체적으로)",
  "improvements": "개선할 점 (구체적으로)",
  "detailedResults": [
    {
      "questionNumber": 1,
      "isCorrect": true,
      "studentAnswer": "학생 답",
      "correctAnswer": "정답",
      "feedback": "이 문제에 대한 피드백"
    }
  ]
}

채점 기준:
- 정확한 답인지 확인
- 풀이 과정이 있으면 과정도 평가
- 부분 점수 가능하면 반영
- 구체적이고 건설적인 피드백 제공`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      })
    });

    console.log(`📡 Gemini 채점 응답 상태: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini 채점 오류:", errorText.substring(0, 500));
      
      // 기본 피드백 반환
      return {
        totalQuestions: analysis.totalQuestions || 0,
        correctAnswers: 0,
        score: 0,
        overallFeedback: "채점 중 오류가 발생했습니다. 다시 시도해주세요.",
        strengths: "숙제를 성실하게 제출했습니다.",
        improvements: "채점 오류로 인해 정확한 피드백을 제공할 수 없습니다.",
        detailedResults: []
      };
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("❌ Gemini 채점 응답에 candidates 없음");
      throw new Error("채점 결과를 받지 못했습니다");
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log("📄 Gemini 채점 결과:", text.substring(0, 300));
    
    // JSON 추출
    let jsonText = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else if (text.includes('{')) {
      jsonText = text.substring(text.indexOf('{'));
      if (jsonText.lastIndexOf('}') > 0) {
        jsonText = jsonText.substring(0, jsonText.lastIndexOf('}') + 1);
      }
    }
    
    const grading = JSON.parse(jsonText);
    console.log(`✅ 채점 완료: ${grading.correctAnswers}/${grading.totalQuestions} 정답 (${grading.score}점)`);
    
    return grading;

  } catch (error) {
    console.error("❌ 채점 오류:", error.message);
    
    // 폴백 응답
    return {
      totalQuestions: analysis.totalQuestions || 0,
      correctAnswers: 0,
      score: 0,
      overallFeedback: "채점 중 오류가 발생했습니다.",
      strengths: "숙제를 성실하게 제출했습니다.",
      improvements: "문제를 다시 확인하고 재제출해주세요.",
      detailedResults: []
    };
  }
}

/**
 * 메인 핸들러
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(JSON.stringify({
        status: "ok",
        message: "숙제 채점 Worker v3.0 (Full Gemini Workflow)",
        version: "3.0.0-GEMINI-FULL",
        model: "gemini-2.5-flash-lite",
        workflow: "Gemini → Python (optional) → Gemini",
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // 채점 엔드포인트
    if (url.pathname === "/grade" && request.method === "POST") {
      try {
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey || apiKey !== "gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u") {
          return new Response(JSON.stringify({
            success: false,
            error: "유효하지 않은 API 키"
          }), { status: 401, headers: corsHeaders });
        }

        const body = await request.json();
        const { images, userId } = body;

        if (!images || !Array.isArray(images) || images.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: "이미지가 제공되지 않음"
          }), { status: 400, headers: corsHeaders });
        }

        console.log(`\n========================================`);
        console.log(`🎯 새 채점 요청 (userId: ${userId}, 이미지: ${images.length}장)`);
        console.log(`========================================\n`);

        const results = [];
        
        for (let i = 0; i < images.length; i++) {
          console.log(`\n📷 이미지 ${i + 1}/${images.length} 처리 시작\n`);
          
          // Step 1: Gemini 이미지 분석
          const analysisResult = await analyzeHomeworkWithGemini(images[i], env);
          
          if (!analysisResult.success) {
            console.error(`❌ 이미지 ${i + 1} 분석 실패:`, analysisResult.error);
            
            results.push({
              imageIndex: i,
              success: false,
              error: analysisResult.error,
              grading: {
                totalQuestions: 0,
                correctAnswers: 0,
                score: 0,
                overallFeedback: "이미지 분석에 실패했습니다. 더 선명한 사진을 제출해주세요.",
                strengths: "숙제를 성실하게 제출했습니다.",
                improvements: "사진을 더 밝고 선명하게 촬영해주세요.",
                detailedResults: []
              }
            });
            continue;
          }

          const analysis = analysisResult.analysis;
          
          // Step 2: Python 실행 (필요시)
          const pythonResults = await executePythonIfNeeded(analysis.questions || []);
          
          // Step 3: Gemini 최종 채점
          const grading = await gradeWithGemini(analysis, pythonResults, env);
          
          results.push({
            imageIndex: i,
            success: true,
            subject: analysis.subject,
            extractedText: analysis.extractedText,
            totalQuestions: analysis.totalQuestions,
            grading: grading
          });
          
          console.log(`\n✅ 이미지 ${i + 1} 처리 완료\n`);
        }

        console.log(`\n========================================`);
        console.log(`✅ 전체 처리 완료: ${results.length}개 이미지`);
        console.log(`========================================\n`);

        return new Response(JSON.stringify({
          success: true,
          results: results
        }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (error) {
        console.error("❌ 전체 처리 오류:", error.message);
        console.error("Stack:", error.stack);
        
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // 404
    return new Response(JSON.stringify({
      error: "Not Found",
      availableEndpoints: ["/", "/grade"]
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
};
