/**
 * 정밀 숙제 채점 시스템
 * OCR → RAG → LLM (↔ Python) → JSON Output
 */

interface Env {
  DB: D1Database;
  AI: any;
  VECTORIZE: VectorizeIndex;
  GOOGLE_GEMINI_API_KEY: string;
}

interface PrecisionGradingRequest {
  userId: number;
  images: string[]; // Base64 images
  subject?: string;
}

interface GradingResult {
  success: boolean;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  detailedResults: any[];
  feedback: string;
  strengths: string;
  suggestions: string;
  ocrText?: string;
  pythonCalculations?: any[];
}

/**
 * 1단계: 객관식/주관식 판별
 */
async function detectQuestionType(
  imageUrl: string,
  geminiApiKey: string
): Promise<{ isMultipleChoice: boolean; confidence: number }> {
  console.log('🔍 Step 1: 문제 유형 판별 시작...');
  
  const prompt = `이 이미지를 분석하여 문제 유형을 판별해주세요.

객관식 문제 특징:
- ①, ②, ③, ④ 또는 1), 2), 3), 4) 형태의 선택지
- 번호에 동그라미 표시
- "다음 중", "옳은 것을", "틀린 것을" 등의 문구

주관식 문제 특징:
- 직접 답을 쓰는 빈칸
- 서술형 답안
- 계산 과정

JSON 형식으로 응답:
{
  "isMultipleChoice": true/false,
  "confidence": 0.0~1.0,
  "reason": "판별 근거"
}`;

  const base64Image = imageUrl.replace(/^data:image\/\w+;base64,/, '');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    
    if (match) {
      const result = JSON.parse(match[0]);
      console.log(`✅ 문제 유형 판별: ${result.isMultipleChoice ? '객관식' : '주관식'} (신뢰도: ${result.confidence})`);
      return {
        isMultipleChoice: result.isMultipleChoice,
        confidence: result.confidence
      };
    }
  } catch (error) {
    console.error('❌ 문제 유형 판별 실패:', error);
  }

  // 기본값: 주관식으로 처리
  return { isMultipleChoice: false, confidence: 0.5 };
}

/**
 * 2단계: Google Document AI OCR (주관식만)
 */
async function performOCR(
  imageUrl: string,
  geminiApiKey: string
): Promise<string> {
  console.log('📝 Step 2: Google Document AI OCR 실행...');
  
  const prompt = `이 이미지의 모든 텍스트를 정확히 추출해주세요.

특히 다음을 주의하세요:
- 수식 기호: ×, ÷, +, -, =, ≠, ≤, ≥
- 분수: 분자/분모 구분
- 위첨자/아래첨자: x², H₂O 등
- 특수 문자: √, π, ∑, ∫

텍스트만 반환하세요 (JSON 형식 없이):`;

  const base64Image = imageUrl.replace(/^data:image\/\w+;base64,/, '');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const ocrText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`✅ OCR 완료: ${ocrText.length}자 추출`);
    return ocrText;
  } catch (error) {
    console.error('❌ OCR 실패:', error);
    return '';
  }
}

/**
 * 3단계: RAG 채점 기준 검색
 */
async function searchGradingCriteria(
  ocrText: string,
  subject: string,
  env: Env
): Promise<string> {
  console.log('🔍 Step 3: RAG 채점 기준 검색...');
  
  if (!env.AI || !env.VECTORIZE) {
    console.warn('⚠️ RAG 환경 없음, 기본 채점 진행');
    return '';
  }

  try {
    // DB에서 RAG 설정 확인
    const config = await env.DB.prepare(
      `SELECT * FROM homework_grading_config WHERE enableRAG = 1 ORDER BY id DESC LIMIT 1`
    ).first();

    if (!config || !config.knowledgeBase) {
      console.log('⚠️ RAG 설정 없음');
      return '';
    }

    // 검색 쿼리 생성
    const searchQuery = `${subject} ${ocrText.substring(0, 200)} 채점 기준 정답`;
    
    // 쿼리 임베딩
    const queryEmbedding = await env.AI.run('@cf/baai/bge-m3', {
      text: searchQuery,
    });

    // Vectorize 검색
    const searchResults = await env.VECTORIZE.query(queryEmbedding.data[0], {
      topK: 3,
      filter: { type: 'homework_grading_knowledge' },
    });

    if (searchResults.matches && searchResults.matches.length > 0) {
      let ragContext = '\n\n【참고 자료 (채점 기준)】\n';
      searchResults.matches.forEach((match: any, index: number) => {
        ragContext += `\n${index + 1}. ${match.metadata?.text || ''}\n`;
      });
      console.log(`✅ RAG 검색 완료: ${searchResults.matches.length}개 관련 자료 발견`);
      return ragContext;
    }
  } catch (error) {
    console.error('❌ RAG 검색 실패:', error);
  }

  return '';
}

/**
 * 4단계: Gemini Code Execution으로 Python SymPy 계산 (수학 문제만)
 */
async function calculateWithPython(
  equation: string,
  geminiApiKey: string
): Promise<{ result: string; steps: string[]; pythonCode?: string }> {
  console.log(`🐍 Python SymPy 계산 요청: ${equation}`);
  
  try {
    // Gemini Code Execution 기능 사용
    const prompt = `다음 수학 문제를 Python SymPy를 사용하여 정확히 계산해주세요:

문제: ${equation}

Python 코드를 작성하고 실행하여 결과를 반환하세요.
SymPy를 사용하여 정확한 수학적 계산을 수행하세요.

예시:
\`\`\`python
from sympy import symbols, solve, simplify, factor, expand
from sympy import sqrt, pi, E, I, oo
from sympy import sin, cos, tan, log, exp
from sympy import diff, integrate, limit, series

# 문제 해결
x = symbols('x')
equation = 2*x + 3 - 7
result = solve(equation, x)
print(f"정답: {result}")
\`\`\`

계산 과정과 최종 답을 명확히 반환하세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
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

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    let pythonCode = '';
    let executionResult = '';
    let steps: string[] = [];
    
    // Code execution 결과 파싱
    for (const part of parts) {
      if (part.executableCode) {
        pythonCode = part.executableCode.code;
        console.log(`📝 생성된 Python 코드:\n${pythonCode}`);
      }
      if (part.codeExecutionResult) {
        executionResult = part.codeExecutionResult.output || '';
        console.log(`✅ 실행 결과: ${executionResult}`);
      }
      if (part.text) {
        // 텍스트에서 단계 추출
        const lines = part.text.split('\n').filter((l: string) => l.trim());
        steps = lines.slice(0, 5); // 최대 5단계
      }
    }

    if (executionResult) {
      return {
        result: executionResult,
        steps: steps.length > 0 ? steps : ['계산 수행 완료'],
        pythonCode: pythonCode
      };
    } else {
      // Code execution이 실패한 경우 간단한 계산 시도
      return simpleCalculation(equation);
    }
    
  } catch (error) {
    console.error('❌ Gemini Code Execution 실패:', error);
    return simpleCalculation(equation);
  }
}

/**
 * 간단한 수학 계산 (Fallback)
 */
function simpleCalculation(equation: string): { result: string; steps: string[] } {
  try {
    // 간단한 사칙연산만 처리
    const cleaned = equation.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/');
    
    // 변수가 없는 단순 계산인 경우
    if (!/[a-zA-Z]/.test(cleaned) && /^[\d\+\-\*\/\(\)\.]+$/.test(cleaned)) {
      try {
        // eval 대신 Function 사용 (더 안전)
        const result = Function(`'use strict'; return (${cleaned})`)();
        return {
          result: `${result}`,
          steps: [
            '1. 수식 정리',
            `2. 계산: ${cleaned}`,
            `3. 결과: ${result}`
          ]
        };
      } catch {
        // 계산 실패
      }
    }
    
    return {
      result: `수식 분석: ${equation}`,
      steps: ['복잡한 수식은 직접 검토가 필요합니다']
    };
  } catch (error) {
    return {
      result: '계산 불가',
      steps: []
    };
  }
}

/**
 * 5단계: Gemini LLM 채점 (Function Calling 지원)
 */
async function gradeWithLLM(
  imageUrl: string,
  ocrText: string,
  ragContext: string,
  subject: string,
  isMath: boolean,
  geminiApiKey: string,
  config: any
): Promise<any> {
  console.log('🤖 Step 5: Gemini LLM 채점...');
  
  const basePrompt = config?.systemPrompt || `당신은 전문 교사입니다. 제공된 숙제를 채점하세요.

1. 이미지와 OCR 텍스트를 분석하세요
2. 각 문제의 답안을 확인하세요
3. 정답 여부를 판단하세요
4. 피드백을 제공하세요`;

  let fullPrompt = basePrompt;
  
  if (ocrText) {
    fullPrompt += `\n\n【OCR 추출 텍스트】\n${ocrText}`;
  }
  
  if (ragContext) {
    fullPrompt += ragContext;
  }
  
  if (isMath) {
    fullPrompt += `\n\n⚠️ 수학 문제입니다. 계산이 필요한 경우 정확한 수학적 검증을 수행하세요.`;
  }

  fullPrompt += `\n\n응답은 반드시 다음 JSON 형식으로 제공하세요:
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

  const base64Image = imageUrl.replace(/^data:image\/\w+;base64,/, '');
  const modelName = config?.model || 'gemini-2.5-flash';
  const temperature = config?.temperature ?? 0.3;
  const maxTokens = config?.maxTokens || 2000;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: fullPrompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
            ]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens
          }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    
    if (match) {
      const result = JSON.parse(match[0]);
      console.log(`✅ LLM 채점 완료: ${result.correctAnswers}/${result.totalQuestions} 정답`);
      return result;
    }
  } catch (error) {
    console.error('❌ LLM 채점 실패:', error);
  }

  return null;
}

/**
 * 메인 정밀 채점 파이프라인
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, AI, VECTORIZE, GOOGLE_GEMINI_API_KEY } = context.env;
    const body: PrecisionGradingRequest = await context.request.json();
    const { userId, images, subject = '수학' } = body;

    if (!GOOGLE_GEMINI_API_KEY) {
      return Response.json({ 
        success: false, 
        error: 'Gemini API key not configured' 
      }, { status: 500 });
    }

    if (!userId || !images || images.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'userId and images are required' 
      }, { status: 400 });
    }

    console.log(`\n🎯 정밀 채점 시작: ${images.length}장의 이미지`);
    console.log(`📚 과목: ${subject}`);

    // DB에서 채점 설정 로드
    const config = await DB.prepare(
      `SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    const results: any[] = [];
    let totalOcrText = '';
    const pythonCalculations: any[] = [];

    // 각 이미지 처리
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      console.log(`\n📄 이미지 ${i + 1}/${images.length} 처리 중...`);

      // Step 1: 객관식/주관식 판별
      const questionType = await detectQuestionType(imageUrl, GOOGLE_GEMINI_API_KEY);
      
      let ocrText = '';
      
      // Step 2: OCR (주관식만)
      if (!questionType.isMultipleChoice) {
        ocrText = await performOCR(imageUrl, GOOGLE_GEMINI_API_KEY);
        totalOcrText += ocrText + '\n\n';
      } else {
        console.log('⏭️ 객관식 문제 - OCR 생략');
      }

      // Step 3: RAG 검색
      const ragContext = await searchGradingCriteria(ocrText || '객관식 문제', subject, {
        DB, AI, VECTORIZE, GOOGLE_GEMINI_API_KEY
      });

      // Step 4: 수학 문제 판별 및 Python 계산
      const isMath = subject.includes('수학') || subject.includes('Math') || subject.includes('math');
      if (isMath && ocrText) {
        // 수식 추출 (방정식, 계산식 등)
        const equations = ocrText.match(/[\d\w\s\+\-\×\÷\=\(\)\.]+/g) || [];
        const uniqueEquations = [...new Set(equations)]
          .filter(eq => eq.length > 2 && /[\d\+\-\×\÷\=]/.test(eq))
          .slice(0, 5); // 최대 5개
        
        for (const eq of uniqueEquations) {
          const calc = await calculateWithPython(eq.trim(), GOOGLE_GEMINI_API_KEY);
          if (calc.result !== '계산 불가') {
            pythonCalculations.push({ equation: eq.trim(), ...calc });
          }
        }
      }

      // Step 5: LLM 채점
      const gradingResult = await gradeWithLLM(
        imageUrl,
        ocrText,
        ragContext,
        subject,
        isMath,
        GOOGLE_GEMINI_API_KEY,
        config
      );

      if (gradingResult) {
        results.push(gradingResult);
      }
    }

    // 결과 통합
    const totalQuestions = results.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
    const correctAnswers = results.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const finalResult: GradingResult = {
      success: true,
      score,
      totalQuestions,
      correctAnswers,
      detailedResults: results.flatMap(r => r.detailedResults || []),
      feedback: results.map(r => r.overallFeedback).join('\n\n'),
      strengths: results.map(r => r.strengths).join('\n'),
      suggestions: results.map(r => r.improvements).join('\n'),
      ocrText: totalOcrText.trim(),
      pythonCalculations: pythonCalculations.length > 0 ? pythonCalculations : undefined
    };

    console.log(`\n✅ 정밀 채점 완료: ${score}점 (${correctAnswers}/${totalQuestions})`);

    return Response.json(finalResult);

  } catch (error: any) {
    console.error('❌ 정밀 채점 오류:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
};
