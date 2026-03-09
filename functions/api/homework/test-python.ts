/**
 * Python SymPy 계산 직접 테스트 엔드포인트
 */

interface Env {
  GOOGLE_GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { GOOGLE_GEMINI_API_KEY } = context.env;
    const body: { equation: string } = await context.request.json();
    const { equation } = body;

    if (!GOOGLE_GEMINI_API_KEY) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log(`\n🐍 Python 계산 테스트: ${equation}`);

    const prompt = `다음 수학 문제를 Python SymPy를 사용하여 정확히 계산해주세요:

문제: ${equation}

Python 코드를 작성하고 실행하여 결과를 반환하세요.

예시:
\`\`\`python
from sympy import *
x = symbols('x')
result = solve(3*x + 5 - 14, x)
print(f"정답: {result}")
\`\`\``;

    console.log('Gemini Code Execution API 호출 중...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          tools: [{
            codeExecution: {}
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API 오류:', error);
      return Response.json({ 
        error: `Gemini API error: ${response.status}`,
        details: error
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('Gemini 응답:', JSON.stringify(data, null, 2));

    const parts = data.candidates?.[0]?.content?.parts || [];
    
    let pythonCode = '';
    let executionResult = '';
    
    for (const part of parts) {
      if (part.executableCode) {
        pythonCode = part.executableCode.code;
        console.log(`✅ Python 코드:\n${pythonCode}`);
      }
      if (part.codeExecutionResult) {
        executionResult = part.codeExecutionResult.output || '';
        console.log(`✅ 실행 결과: ${executionResult}`);
      }
    }

    return Response.json({
      success: true,
      equation,
      pythonCode,
      executionResult,
      fullResponse: data
    });

  } catch (error: any) {
    console.error('❌ 오류:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
};
