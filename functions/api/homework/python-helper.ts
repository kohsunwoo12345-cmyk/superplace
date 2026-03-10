/**
 * Python Worker 헬퍼 함수
 * Cloudflare Workers Python 통합으로 수학 문제 검증
 */

interface PythonExecutionResult {
  success: boolean;
  result: string | null;
  equation?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

/**
 * Python Worker를 통해 수학 식 계산
 */
export async function executeMathProblem(
  equation: string,
  pythonWorkerUrl: string
): Promise<PythonExecutionResult> {
  try {
    console.log(`🐍 Python Worker 호출: ${equation}`);
    
    // /solve 엔드포인트로 요청
    const url = pythonWorkerUrl.endsWith('/solve') ? pythonWorkerUrl : `${pythonWorkerUrl}/solve`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ equation }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Python Worker 오류 (${response.status}):`, errorText);
      return {
        success: false,
        result: null,
        error: `Python Worker returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log(`✅ Python 계산 완료:`, data.result);

    return {
      success: data.success,
      result: data.result,
      equation: data.equation,
      stdout: data.stdout,
      stderr: data.stderr,
    };
  } catch (error: any) {
    console.error('❌ Python Worker 호출 실패:', error.message);
    return {
      success: false,
      result: null,
      error: error.message,
    };
  }
}

/**
 * 문제 분석에서 수학 계산식 추출
 */
export function extractMathExpressions(problemAnalysis: any[]): string[] {
  const expressions: string[] = [];
  
  for (const problem of problemAnalysis) {
    // 문제 텍스트에서 수식 패턴 찾기
    const problemText = problem.problem || '';
    
    // 패턴 1: "3 + 5", "10 - 2", "4 × 3", "12 ÷ 3"
    const simplePattern = /(\d+)\s*([+\-×÷*/])\s*(\d+)/g;
    let match;
    
    while ((match = simplePattern.exec(problemText)) !== null) {
      const expr = match[0].replace('×', '*').replace('÷', '/');
      expressions.push(expr);
    }
    
    // 패턴 2: "2x + 3 = 7" 같은 방정식
    const equationPattern = /[\d\w\s+\-*/()]+\s*=\s*[\d\w\s+\-*/()]+/g;
    const equations = problemText.match(equationPattern);
    if (equations) {
      expressions.push(...equations);
    }
  }
  
  return [...new Set(expressions)]; // 중복 제거
}

/**
 * 학생 답안이 Python 계산 결과와 일치하는지 검증
 */
export function verifyStudentAnswer(
  studentAnswer: string,
  pythonResult: string | null
): boolean {
  if (!pythonResult) return false;
  
  // 숫자 추출 및 비교
  const studentNum = parseFloat(studentAnswer.replace(/[^\d.-]/g, ''));
  const pythonNum = parseFloat(pythonResult.replace(/[^\d.-]/g, ''));
  
  if (isNaN(studentNum) || isNaN(pythonNum)) {
    // 문자열 직접 비교
    return studentAnswer.trim().toLowerCase() === pythonResult.trim().toLowerCase();
  }
  
  // 숫자 비교 (오차 허용 0.01)
  return Math.abs(studentNum - pythonNum) < 0.01;
}

/**
 * 문제 분석에 Python 검증 결과 추가
 */
export async function enhanceProblemAnalysisWithPython(
  problemAnalysis: any[],
  pythonWorkerUrl: string
): Promise<any[]> {
  const enhanced = [...problemAnalysis];
  
  for (let i = 0; i < enhanced.length; i++) {
    const problem = enhanced[i];
    
    // 수학 문제만 검증
    if (!problem.type || !problem.type.includes('수학') && !problem.type.includes('계산')) {
      continue;
    }
    
    // 문제에서 식 추출
    const expressions = extractMathExpressions([problem]);
    
    if (expressions.length === 0) continue;
    
    // 첫 번째 식으로 Python 검증
    const pythonResult = await executeMathProblem(expressions[0], pythonWorkerUrl);
    
    if (pythonResult.success && pythonResult.result) {
      // Python 결과와 학생 답안 비교
      const isCorrectByPython = verifyStudentAnswer(
        problem.answer || '',
        pythonResult.result
      );
      
      // 원래 AI 판정과 Python 판정이 다르면 경고
      if (problem.isCorrect !== isCorrectByPython) {
        console.log(`⚠️ AI vs Python 판정 불일치 - 문제 ${problem.questionNumber || i + 1}`);
        console.log(`   AI 판정: ${problem.isCorrect}, Python 판정: ${isCorrectByPython}`);
        console.log(`   학생 답: ${problem.answer}, Python 계산: ${pythonResult.result}`);
        
        // Python 결과를 우선하여 수정
        problem.isCorrect = isCorrectByPython;
        problem.pythonVerified = true;
        problem.pythonResult = pythonResult.result;
        problem.explanation += ` [Python 검증: ${pythonResult.result}]`;
      } else {
        problem.pythonVerified = true;
        problem.pythonResult = pythonResult.result;
      }
    }
  }
  
  return enhanced;
}
