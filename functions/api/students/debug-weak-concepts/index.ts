/**
 * POST /api/students/debug-weak-concepts
 * 부족한 개념 분석 디버깅용 (Gemini 원본 응답 확인)
 */

interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB, GOOGLE_GEMINI_API_KEY } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const logs: string[] = [];
    logs.push(`🔍 Debugging weak concepts analysis for student: ${studentId}`);

    // 1. 학생의 숙제 데이터 가져오기
    let homeworkData: any[] = [];
    
    try {
      const homeworkQuery = `
        SELECT 
          id,
          userId as studentId,
          submittedAt,
          score,
          subject,
          feedback,
          completion,
          effort,
          strengths,
          suggestions
        FROM homework_submissions
        WHERE userId = ? AND score IS NOT NULL
        ORDER BY submittedAt DESC
        LIMIT 30
      `;
      
      const homeworkResult = await DB.prepare(homeworkQuery).bind(parseInt(studentId)).all();
      homeworkData = homeworkResult.results || [];
      
      if (homeworkData.length > 0) {
        logs.push(`✅ Found ${homeworkData.length} homework records`);
      } else {
        logs.push(`⚠️ No homework records found for student ${studentId}`);
      }
    } catch (dbError: any) {
      logs.push(`❌ Failed to fetch homework data: ${dbError.message}`);
      homeworkData = [];
    }

    logs.push(`📊 Total homework records: ${homeworkData.length}`);

    if (homeworkData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No homework data found for analysis",
          logs: logs
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. 숙제 데이터로 분석 컨텍스트 생성
    let analysisContext = '';
    const homeworkText = homeworkData
      .slice(0, 10)  // 최대 10개만
      .map((hw: any, idx: number) => {
        return `
숙제 ${idx + 1} (${hw.submittedAt}):
- 과목: ${hw.subject || '알 수 없음'}
- 점수: ${hw.score}점
- 피드백: ${hw.feedback || '없음'}
- 완성도: ${hw.completion || '없음'}
- 노력도: ${hw.effort || '없음'}
- 강점: ${hw.strengths || '없음'}
- 개선사항: ${hw.suggestions || '없음'}
`;
      })
      .join('\n');
    
    analysisContext = `📚 숙제 채점 데이터 (${homeworkData.length}건):\n${homeworkText}`;

    logs.push('📝 Analysis context created (length: ' + analysisContext.length + ')');

    // 3. Gemini 프롬프트 생성
    const prompt = `You are an educational AI analyzing student homework performance. Analyze the data and return ONLY valid JSON.

Student Homework Data (${homeworkData.length} submissions):
${analysisContext}

CRITICAL: Return ONLY this JSON structure with NO extra text, markdown, or explanations:

{
  "overallAssessment": "종합평가 (학생의 전반적인 학습 상태를 2-3문장으로 요약)",
  "detailedAnalysis": "상세 분석 (숙제 데이터를 바탕으로 한 구체적인 분석 내용)",
  "weaknessPatterns": [
    {
      "pattern": "약점 유형명",
      "description": "이 약점이 나타나는 이유와 패턴"
    }
  ],
  "conceptsNeedingReview": [
    {
      "concept": "복습이 필요한 개념명",
      "reason": "왜 복습이 필요한지",
      "priority": "high"
    }
  ],
  "improvementSuggestions": [
    {
      "area": "개선이 필요한 영역",
      "method": "구체적인 개선 방법"
    }
  ],
  "learningDirection": "앞으로의 학습 방향 제시 (2-3문장)"
}

Rules:
1. Focus on homework scores below 80 points
2. Identify recurring error patterns
3. Use ONLY Korean text for all values
4. Maximum 5 items per array
5. priority can be "high", "medium", or "low"
6. NO markdown, NO explanations, ONLY the JSON object
7. Ensure all JSON syntax is perfect (proper commas, quotes, brackets)`;

    logs.push('📋 Prompt created (length: ' + prompt.length + ')');

    // 4. Gemini API 호출
    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GOOGLE_GEMINI_API_KEY not configured',
          logs: logs
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    
    logs.push('🔄 Calling Gemini 2.5 Flash API...');
    
    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      logs.push(`❌ Gemini API error: ${geminiResponse.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Gemini API failed with status ${geminiResponse.status}`,
          errorDetails: errorText.substring(0, 500),
          logs: logs
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    logs.push('✅ Gemini API response received');

    // 5. 원본 응답 추출
    let responseText = '';
    try {
      responseText = geminiData.candidates[0].content.parts[0].text;
      logs.push('📝 Response text length: ' + responseText.length);
    } catch (e: any) {
      logs.push('❌ Failed to extract response text: ' + e.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to extract response from Gemini',
          geminiData: geminiData,
          logs: logs
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. JSON 파싱 시도
    let jsonString = responseText.trim();
    jsonString = jsonString.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```\s*$/gm, '');
    
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      logs.push('❌ No JSON object found in response');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No JSON object in Gemini response',
          rawResponse: responseText.substring(0, 1000),
          logs: logs
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    logs.push('📦 Extracted JSON substring (length: ' + jsonString.length + ')');

    let parsedData;
    let parseMethod = '';
    try {
      parsedData = JSON.parse(jsonString);
      parseMethod = 'Direct parse';
      logs.push('✅ JSON parsed successfully (direct)');
    } catch (e1) {
      logs.push('⚠️ Direct parse failed, trying cleaned parse');
      try {
        const cleaned = jsonString
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        parsedData = JSON.parse(cleaned);
        parseMethod = 'Cleaned parse';
        logs.push('✅ JSON parsed successfully (cleaned)');
      } catch (e2) {
        logs.push('⚠️ Cleaned parse failed, trying fixed parse');
        try {
          const fixed = jsonString
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/}\s*{/g, '},{')
            .replace(/"\s*"\s*:/g, '":')
            .replace(/:\s*"\s*"/g, ':""')
            .replace(/\s+/g, ' ')
            .trim();
          
          parsedData = JSON.parse(fixed);
          parseMethod = 'Fixed parse';
          logs.push('✅ JSON parsed successfully (fixed)');
        } catch (e3: any) {
          logs.push('❌ All parse methods failed');
          logs.push('❌ Error: ' + e3.message);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to parse JSON from Gemini response',
              parseError: e3.message,
              rawResponse: responseText.substring(0, 1000),
              extractedJson: jsonString.substring(0, 1000),
              logs: logs
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 7. 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        parseMethod: parseMethod,
        parsedData: parsedData,
        rawResponsePreview: responseText.substring(0, 500),
        logs: logs
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Debug analysis failed",
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
