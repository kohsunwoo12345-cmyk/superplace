/**
 * 정밀 숙제 채점 시스템
 * RAG → LLM (↔ Python) → JSON Output
 * OCR은 외부에서 처리, RAG와 Python만 실제 구현
 * Python: Cloudflare Sandbox SDK 사용
 */

import { getSandbox } from '@cloudflare/sandbox';

interface Env {
  DB: D1Database;
  AI: any;
  VECTORIZE: VectorizeIndex;
  GOOGLE_GEMINI_API_KEY: string;
  SANDBOX?: any; // Durable Object binding for Sandbox
}

interface PrecisionGradingRequest {
  userId: number;
  images: string[]; // Base64 images
  subject?: string;
  ocrText?: string; // 외부에서 OCR 처리한 텍스트
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
  ragContext?: string; // RAG 검색 결과
  pythonCalculations?: any[];
}

/**
 * RAG 채점 기준 검색 (실제 구현)
 */
async function searchGradingCriteria(
  queryText: string,
  subject: string,
  env: Env
): Promise<string> {
  console.log('🔍 RAG 채점 기준 검색 시작...');
  console.log(`   쿼리: ${queryText.substring(0, 100)}...`);
  
  if (!env.AI || !env.VECTORIZE) {
    console.warn('⚠️ RAG 환경 없음 (AI 또는 VECTORIZE 미설정)');
    return '';
  }

  try {
    // DB에서 RAG 설정 확인
    const config = await env.DB.prepare(
      `SELECT * FROM homework_grading_config WHERE enableRAG = 1 ORDER BY id DESC LIMIT 1`
    ).first();

    if (!config) {
      console.log('⚠️ RAG 설정 비활성화 또는 없음');
      return '';
    }

    console.log(`✅ RAG 설정 활성화 확인`);

    // 검색 쿼리 생성 (과목 + 문제 내용)
    const searchQuery = `${subject} ${queryText.substring(0, 300)} 채점 기준 정답 해설`;
    console.log(`   검색 쿼리: ${searchQuery.substring(0, 100)}...`);
    
    // Cloudflare Workers AI로 쿼리 임베딩 생성
    console.log('   임베딩 생성 중... (@cf/baai/bge-m3)');
    const embeddingResponse = await env.AI.run('@cf/baai/bge-m3', {
      text: searchQuery,
    });

    if (!embeddingResponse || !embeddingResponse.data || !embeddingResponse.data[0]) {
      console.error('❌ 임베딩 생성 실패');
      return '';
    }

    const queryEmbedding = embeddingResponse.data[0];
    console.log(`✅ 임베딩 생성 완료 (차원: ${queryEmbedding.length})`);

    // Vectorize 검색
    console.log('   Vectorize 검색 중...');
    const searchResults = await env.VECTORIZE.query(queryEmbedding, {
      topK: 3,
      filter: { type: 'homework_grading_knowledge' },
      returnMetadata: true
    });

    if (!searchResults || !searchResults.matches || searchResults.matches.length === 0) {
      console.log('⚠️ RAG 검색 결과 없음 (지식 베이스가 비어있을 수 있음)');
      return '';
    }

    console.log(`✅ RAG 검색 완료: ${searchResults.matches.length}개 관련 자료 발견`);
    
    // 검색 결과 포맷팅
    let ragContext = '\n\n【참고 자료 (채점 기준 및 해설)】\n';
    searchResults.matches.forEach((match: any, index: number) => {
      const score = (match.score * 100).toFixed(1);
      const text = match.metadata?.text || match.metadata?.content || '내용 없음';
      ragContext += `\n${index + 1}. [유사도: ${score}%]\n${text}\n`;
      console.log(`   ${index + 1}. 유사도: ${score}% | 길이: ${text.length}자`);
    });
    
    return ragContext;
    
  } catch (error: any) {
    console.error('❌ RAG 검색 실패:', error.message || error);
    return '';
  }
}

/**
 * Cloudflare Sandbox SDK로 Python SymPy 계산 (실제 구현)
 */
async function calculateWithPython(
  equation: string,
  sandboxBinding?: any
): Promise<{ result: string; steps: string[]; pythonCode?: string }> {
  console.log(`🐍 Cloudflare Sandbox Python 계산 요청: ${equation}`);
  
  // Sandbox binding이 없으면 fallback
  if (!sandboxBinding) {
    console.log('   ⚠️ SANDBOX binding 없음 - Fallback 계산 사용');
    return simpleCalculation(equation);
  }
  
  try {
    // Python 코드 생성
    const pythonCode = `
from sympy import symbols, solve, simplify, sympify, Eq
from sympy import sqrt, pi, E
import re

# 수식 정리
equation_str = """${equation}"""

try:
    # 방정식인 경우 (=가 있음)
    if '=' in equation_str:
        # x, y, z 변수 정의
        x, y, z = symbols('x y z')
        
        # 수식 파싱
        left, right = equation_str.split('=')
        left = left.strip()
        right = right.strip()
        
        # SymPy로 변환
        eq = Eq(sympify(left), sympify(right))
        
        # 방정식 풀이
        solution = solve(eq, x)
        
        if solution:
            print(f"정답: {solution[0]}")
        else:
            print("해가 없습니다")
    else:
        # 계산식인 경우
        result = sympify(equation_str)
        simplified = simplify(result)
        print(f"정답: {simplified}")
        
except Exception as e:
    # 간단한 계산 시도
    try:
        result = eval(equation_str.replace('×', '*').replace('÷', '/'))
        print(f"정답: {result}")
    except:
        print(f"계산 불가: {e}")
`;

    console.log('   Cloudflare Sandbox 실행 중...');
    console.log(`   Python 코드:\n${pythonCode.substring(0, 200)}...`);
    
    // Cloudflare Sandbox SDK 사용
    const sandbox = getSandbox(sandboxBinding, `homework-${Date.now()}`);
    
    // Python 코드 실행
    const result = await sandbox.commands.exec({
      cmd: ['python3', '-c', pythonCode]
    });
    
    console.log(`   ✅ 실행 결과: ${result.stdout}`);
    
    if (result.exitCode === 0 && result.stdout) {
      const output = result.stdout.trim();
      return {
        result: output.replace('정답: ', ''),
        steps: ['Cloudflare Sandbox SymPy 계산'],
        pythonCode: pythonCode.trim()
      };
    } else {
      throw new Error(result.stderr || '출력 없음');
    }
    
  } catch (error: any) {
    console.error('❌ Cloudflare Sandbox 실패:', error.message || error);
    return simpleCalculation(equation);
  }
}

/**
 * 간단한 수학 계산 (Fallback)
 */
function simpleCalculation(equation: string): { result: string; steps: string[] } {
  try {
    const cleaned = equation.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/');
    
    // 간단한 사칙연산만 처리 (보안을 위해 제한적으로)
    if (/^[\d\+\-\*\/\(\)\.]+$/.test(cleaned)) {
      const result = eval(cleaned);
      console.log(`   Fallback 계산: ${equation} = ${result}`);
      return {
        result: result.toString(),
        steps: ['간단한 계산']
      };
    }
  } catch (error) {
    console.error('   Fallback 계산도 실패');
  }
  
  return {
    result: '계산 불가',
    steps: []
  };
}

/**
 * LLM 최종 채점 (homework_grading_config 설정 사용)
 */
async function gradeWithLLM(
  imageUrl: string,
  providedOcrText: string,
  ragContext: string,
  subject: string,
  isMath: boolean,
  pythonCalculations: any[],
  geminiApiKey: string,
  config: any
): Promise<any> {
  console.log('🤖 LLM 최종 채점 시작...');
  
  // DB 설정에서 프롬프트 및 모델 설정 로드
  const systemPrompt = config?.systemPrompt || `당신은 전문 교사입니다.

다음 작업을 수행하세요:
1. 제공된 숙제 이미지의 모든 문제를 식별
2. 각 학생 답안 확인
3. 정답 여부 판단
4. 피드백 제공

응답은 반드시 다음 JSON 형식으로:
{
  "totalQuestions": <총 문제 수>,
  "correctAnswers": <정답 수>,
  "detailedResults": [
    {
      "questionNumber": 1,
      "isCorrect": true/false,
      "studentAnswer": "학생 답",
      "correctAnswer": "정답",
      "explanation": "설명"
    }
  ],
  "overallFeedback": "전체 피드백",
  "strengths": "잘한 점",
  "improvements": "개선할 점"
}`;

  const model = config?.model || 'gemini-2.5-flash';
  const temperature = config?.temperature || 0.3;
  const maxTokens = config?.maxTokens || 2000;

  console.log(`   모델: ${model}`);
  console.log(`   Temperature: ${temperature}, MaxTokens: ${maxTokens}`);

  // 프롬프트 구성
  let fullPrompt = systemPrompt;
  
  // OCR 텍스트 추가
  if (providedOcrText) {
    fullPrompt += `\n\n【OCR 추출 텍스트】\n${providedOcrText}`;
  }
  
  // RAG 컨텍스트 추가
  if (ragContext) {
    fullPrompt += ragContext;
  }
  
  // Python 계산 결과 추가
  if (pythonCalculations.length > 0) {
    fullPrompt += '\n\n【Python SymPy 계산 결과】\n';
    pythonCalculations.forEach((calc, idx) => {
      fullPrompt += `${idx + 1}. ${calc.equation} = ${calc.result}\n`;
      if (calc.pythonCode) {
        fullPrompt += `   코드: ${calc.pythonCode.substring(0, 100)}...\n`;
      }
    });
  }

  fullPrompt += `\n\n과목: ${subject}`;
  if (isMath) {
    fullPrompt += `\n⚠️ 수학 문제입니다. Python 계산 결과를 참고하여 정확히 채점하세요.`;
  }

  const base64Image = imageUrl.replace(/^data:image\/\w+;base64,/, '');
  
  try {
    console.log('   Gemini API 호출 중...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiApiKey}`,
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    
    if (match) {
      const result = JSON.parse(match[0]);
      console.log(`✅ LLM 채점 완료: ${result.correctAnswers}/${result.totalQuestions} 정답`);
      return result;
    } else {
      console.error('❌ JSON 파싱 실패');
      return null;
    }
  } catch (error: any) {
    console.error('❌ LLM 채점 실패:', error.message || error);
    return null;
  }
}

/**
 * 메인 정밀 채점 파이프라인
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, AI, VECTORIZE, GOOGLE_GEMINI_API_KEY, SANDBOX } = context.env;
    const body: PrecisionGradingRequest = await context.request.json();
    const { userId, images, subject = '수학', ocrText = '' } = body;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 정밀 숙제 채점 시작');
    console.log('='.repeat(60));

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

    console.log(`📚 과목: ${subject}`);
    console.log(`📄 이미지: ${images.length}장`);
    console.log(`📝 OCR 텍스트: ${ocrText ? ocrText.length + '자' : '없음'}`);

    // DB에서 채점 설정 로드
    console.log('\n📖 homework_grading_config 설정 로드 중...');
    const config = await DB.prepare(
      `SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    if (config) {
      console.log(`✅ 설정 로드 완료:`);
      console.log(`   모델: ${config.model}`);
      console.log(`   Temperature: ${config.temperature}`);
      console.log(`   MaxTokens: ${config.maxTokens}`);
      console.log(`   RAG 활성화: ${config.enableRAG ? '예' : '아니오'}`);
    } else {
      console.log('⚠️ 설정 없음, 기본값 사용');
    }

    const results: any[] = [];
    const pythonCalculations: any[] = [];
    let totalRagContext = '';

    // 각 이미지 처리
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📄 이미지 ${i + 1}/${images.length} 처리 중...`);
      console.log('─'.repeat(60));

      // Step 1: RAG 검색 (실제 구현)
      const ragContext = await searchGradingCriteria(
        ocrText || '이미지 기반 채점',
        subject,
        { DB, AI, VECTORIZE, GOOGLE_GEMINI_API_KEY }
      );
      
      if (ragContext) {
        totalRagContext += ragContext;
      }

      // Step 2: 수학 문제인 경우 Python 계산 (실제 구현)
      const isMath = subject.includes('수학') || subject.includes('Math') || subject.includes('math');
      
      if (isMath && ocrText) {
        console.log('\n🔢 수학 문제 감지 - Python SymPy 계산 시작');
        console.log(`   OCR 텍스트:\n${ocrText.substring(0, 200)}`);
        
        // 수식 추출 개선 (다양한 패턴)
        const equations: string[] = [];
        
        // 패턴 1: 방정식 (3x + 5 = 14)
        const eqPattern = /[\dxyz\s]*[\+\-\×\÷\*\/][\s\dxyz\+\-\×\÷\*\/\(\)]*\s*=\s*[\d\s\+\-\×\÷\*\/\(\)]+/gi;
        const foundEqs = ocrText.match(eqPattern) || [];
        equations.push(...foundEqs);
        
        // 패턴 2: 계산식 (15 ÷ 3, 2 × 4 + 6)
        const calcPattern = /\d+\s*[\+\-\×\÷\*\/]\s*[\d\(\)\s\+\-\×\÷\*\/]+/g;
        const foundCalcs = ocrText.match(calcPattern) || [];
        equations.push(...foundCalcs);
        
        const uniqueEquations = [...new Set(equations)]
          .filter(eq => eq.trim().length > 2)
          .slice(0, 5); // 최대 5개
        
        console.log(`   추출된 수식: ${uniqueEquations.length}개`);
        uniqueEquations.forEach((eq, idx) => {
          console.log(`      ${idx + 1}. ${eq.trim()}`);
        });
        
        if (uniqueEquations.length > 0) {
          for (const eq of uniqueEquations) {
            const calc = await calculateWithPython(eq.trim(), SANDBOX);
            if (calc.result !== '계산 불가') {
              pythonCalculations.push({ 
                equation: eq.trim(), 
                ...calc 
              });
              console.log(`      ✅ ${eq.trim()} = ${calc.result}`);
            } else {
              console.log(`      ⚠️ ${eq.trim()} - 계산 실패`);
            }
          }
          
          console.log(`\n   ✅ Python 계산 완료: ${pythonCalculations.length}개 성공`);
        } else {
          console.log('   ⚠️ 수식을 찾을 수 없습니다');
        }
      } else if (isMath && !ocrText) {
        console.log('⚠️ 수학 문제이지만 OCR 텍스트 없음 - Python 계산 건너뜀');
      }

      // Step 3: LLM 최종 채점 (homework_grading_config 설정 사용)
      console.log('\n🤖 LLM 최종 채점 시작...');
      const gradingResult = await gradeWithLLM(
        imageUrl,
        ocrText,
        ragContext,
        subject,
        isMath,
        pythonCalculations,
        GOOGLE_GEMINI_API_KEY,
        config
      );

      if (gradingResult) {
        results.push(gradingResult);
      }
    }

    // 결과 통합
    console.log('\n' + '='.repeat(60));
    console.log('📊 결과 통합 중...');
    console.log('='.repeat(60));
    
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
      ragContext: totalRagContext || undefined,
      pythonCalculations: pythonCalculations.length > 0 ? pythonCalculations : undefined
    };

    console.log(`\n✅ 정밀 채점 완료!`);
    console.log(`   점수: ${score}점 (${correctAnswers}/${totalQuestions})`);
    console.log(`   RAG 사용: ${totalRagContext ? '예' : '아니오'}`);
    console.log(`   Python 계산: ${pythonCalculations.length}개`);
    console.log('='.repeat(60) + '\n');

    return Response.json(finalResult);

  } catch (error: any) {
    console.error('\n❌ 정밀 채점 오류:', error.message || error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
};
