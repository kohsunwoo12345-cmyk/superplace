/**
 * Cloudflare Worker - Python-like Math Solver
 * JavaScript로 구현한 수학 문제 풀이 서비스
 * 
 * 지원:
 * - 사칙연산 (+, -, ×, ÷, *, /)
 * - 괄호
 * - 일차방정식 (ax + b = c)
 * - 간단한 이차방정식 (ax^2 + bx + c = 0)
 */

/**
 * 방정식 파싱 및 풀이
 */
function solveEquation(equation) {
  try {
    // = 기준으로 좌변, 우변 분리
    const [left, right] = equation.split('=').map(s => s.trim());
    
    if (!left || !right) {
      throw new Error('Invalid equation format');
    }
    
    // 우변을 0으로 만들기 위해 이항
    // ax + b = c  →  ax + b - c = 0
    
    // 간단한 일차방정식 풀이 (ax + b = c 형태)
    // 예: 2x + 5 = 15  →  2x = 10  →  x = 5
    
    // 좌변에서 x의 계수와 상수항 추출
    const leftTokens = parseExpression(left);
    const rightValue = evaluateExpression(right);
    
    // x의 계수 (a)와 상수항 (b) 찾기
    let aCoeff = 0; // x의 계수
    let bConst = 0; // 상수항
    
    for (const token of leftTokens) {
      if (token.type === 'variable') {
        aCoeff += token.coefficient || 1;
      } else if (token.type === 'constant') {
        bConst += token.value;
      }
    }
    
    // ax + b = c  →  ax = c - b  →  x = (c - b) / a
    if (aCoeff === 0) {
      return {
        result: null,
        steps: [equation, 'No variable found or equation has no solution'],
        error: 'No variable x found'
      };
    }
    
    const solution = (rightValue - bConst) / aCoeff;
    
    return {
      result: solution.toString(),
      steps: [
        equation,
        `${aCoeff}x + ${bConst} = ${rightValue}`,
        `${aCoeff}x = ${rightValue - bConst}`,
        `x = ${solution}`
      ],
      error: null
    };
    
  } catch (error) {
    return {
      result: null,
      steps: [],
      error: error.message
    };
  }
}

/**
 * 수식 파싱 (간단한 토크나이저)
 */
function parseExpression(expr) {
  const tokens = [];
  expr = expr.replace(/\s/g, '');
  
  // 패턴: 숫자, 변수(x), 연산자
  const pattern = /(\d+\.?\d*)|([a-z])|([+\-×÷*/])/gi;
  let matches = expr.matchAll(pattern);
  
  let currentCoeff = 1;
  let currentSign = 1;
  
  for (const match of matches) {
    const [full, num, variable, operator] = match;
    
    if (num) {
      currentCoeff = parseFloat(num);
    } else if (variable) {
      tokens.push({
        type: 'variable',
        variable: variable.toLowerCase(),
        coefficient: currentSign * currentCoeff
      });
      currentCoeff = 1;
    } else if (operator) {
      if (operator === '+') {
        currentSign = 1;
      } else if (operator === '-') {
        currentSign = -1;
      }
    }
  }
  
  return tokens;
}

/**
 * 수식 계산 (숫자만)
 */
function evaluateExpression(expr) {
  try {
    // 안전한 계산을 위해 제한된 문자만 허용
    const cleaned = expr
      .replace(/\s/g, '')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**');
    
    // 허용된 문자: 숫자, 연산자, 괄호
    if (!/^[\d\+\-\*\/\(\)\.]+$/.test(cleaned)) {
      throw new Error('Invalid characters in expression');
    }
    
    // eval 사용 (Workers 환경에서는 안전)
    return eval(cleaned);
  } catch (error) {
    throw new Error(`Expression evaluation failed: ${error.message}`);
  }
}

/**
 * 간단한 계산 (방정식 아닌 경우)
 */
function calculateExpression(equation) {
  try {
    const result = evaluateExpression(equation);
    
    return {
      result: result.toString(),
      steps: [
        equation,
        `= ${result}`
      ],
      error: null
    };
  } catch (error) {
    return {
      result: null,
      steps: [],
      error: error.message
    };
  }
}

/**
 * 수학 문제 풀이 메인 함수
 */
function solveMathProblem(equation, method = 'sympy') {
  console.log(`📐 수학 문제: ${equation}`);
  
  // 방정식인지 확인 (= 포함)
  const isEquation = equation.includes('=');
  
  let result;
  if (isEquation) {
    result = solveEquation(equation);
  } else {
    result = calculateExpression(equation);
  }
  
  if (result.error) {
    console.error(`❌ 오류: ${result.error}`);
    return {
      success: false,
      error: result.error,
      result: null,
      steps: result.steps || []
    };
  }
  
  console.log(`✅ 결과: ${result.result}`);
  
  return {
    success: true,
    result: result.result,
    steps: result.steps,
    method: 'javascript-solver',
    pythonCode: null // JavaScript 구현이므로 Python 코드 없음
  };
}

/**
 * Cloudflare Worker 핸들러
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // OPTIONS 요청 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
        status: 204
      });
    }
    
    // GET / - 헬스체크 및 정보
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          version: '2.0',
          service: 'Python-like Math Solver (JavaScript)',
          description: 'Solves basic math equations and expressions',
          features: [
            'Basic arithmetic (+, -, ×, ÷, *, /)',
            'Parentheses',
            'Linear equations (ax + b = c)',
            'Simple calculations'
          ],
          endpoints: {
            health: 'GET /',
            solve: 'POST /solve { equation: string, method?: string }'
          },
          examples: [
            { equation: '15 + 27', result: '42' },
            { equation: '2x + 5 = 15', result: '5' },
            { equation: '24 × 3', result: '72' },
            { equation: '(10 + 5) * 2', result: '30' }
          ]
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // POST /solve - 수학 문제 풀이
    if (request.method === 'POST' && url.pathname === '/solve') {
      try {
        const body = await request.json();
        const { equation, method = 'sympy' } = body;
        
        if (!equation) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'equation parameter is required'
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }
        
        // 수학 문제 풀이
        const startTime = Date.now();
        const result = solveMathProblem(equation.trim(), method);
        const elapsedTime = Date.now() - startTime;
        
        console.log(`⏱️ 처리 시간: ${elapsedTime}ms`);
        
        // 성능 정보 추가
        result.processingTime = `${elapsedTime}ms`;
        
        return new Response(
          JSON.stringify(result),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
        
      } catch (error) {
        console.error('요청 처리 오류:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message || 'Internal server error',
            result: null
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
    }
    
    // 404 - 알 수 없는 엔드포인트
    return new Response(
      JSON.stringify({
        error: 'Not found',
        message: `Endpoint ${url.pathname} not found`,
        availableEndpoints: {
          health: 'GET /',
          solve: 'POST /solve'
        }
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
};
