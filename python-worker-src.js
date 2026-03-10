// Cloudflare Workers with Pyodide for Python Math Solving
// URL: https://physonsuperplacestudy.kohsunwoo12345.workers.dev

import { loadPyodide } from 'pyodide';

// Pyodide 인스턴스를 재사용하기 위한 전역 변수
let pyodideInstance = null;
let pyodideReady = false;

/**
 * Pyodide 초기화 및 SymPy 설치
 */
async function initPyodide() {
  if (pyodideInstance && pyodideReady) {
    return pyodideInstance;
  }

  console.log('🐍 Pyodide 초기화 중...');
  pyodideInstance = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
  });

  console.log('📦 SymPy 설치 중...');
  await pyodideInstance.loadPackage('sympy');
  
  pyodideReady = true;
  console.log('✅ Pyodide 준비 완료');
  
  return pyodideInstance;
}

/**
 * Python 코드로 수학 문제 풀이
 */
async function solveMathProblem(equation, method = 'sympy') {
  const pyodide = await initPyodide();
  
  // Python 코드 생성
  const pythonCode = `
from sympy import symbols, solve, simplify, sympify, Eq, sqrt, pi, E
import json

# 입력 수식
equation_str = """${equation.replace(/"/g, '\\"')}"""

result = None
steps = []
error = None

try:
    # 방정식인 경우 (= 포함)
    if '=' in equation_str:
        # 변수 정의
        x, y, z = symbols('x y z')
        
        # 수식 파싱
        left, right = equation_str.split('=')
        left = left.strip().replace('×', '*').replace('÷', '/')
        right = right.strip().replace('×', '*').replace('÷', '/')
        
        # SymPy 방정식 생성
        eq = Eq(sympify(left), sympify(right))
        
        # 방정식 풀이
        solution = solve(eq, x)
        
        if solution:
            result = str(solution[0])
            steps = [
                equation_str,
                f"Simplified: {eq}",
                f"Solution: x = {result}"
            ]
        else:
            result = "No solution"
            steps = [equation_str, "No solution found"]
    else:
        # 계산식인 경우
        cleaned = equation_str.replace('×', '*').replace('÷', '/')
        expr = sympify(cleaned)
        simplified = simplify(expr)
        result = str(simplified)
        steps = [
            equation_str,
            f"Simplified: {simplified}",
            f"Result: {result}"
        ]
        
except Exception as e:
    error = str(e)
    # Fallback: 간단한 계산 시도
    try:
        cleaned = equation_str.replace('×', '*').replace('÷', '/').replace('^', '**')
        result = str(eval(cleaned))
        steps = [equation_str, f"Computed: {result}"]
    except:
        result = None
        steps = []

# JSON 결과 출력
output = {
    "result": result,
    "steps": steps,
    "error": error
}
print(json.dumps(output))
`;

  try {
    // Python 코드 실행
    await pyodide.runPythonAsync(pythonCode);
    
    // 결과 가져오기
    const output = pyodide.globals.get('output').toJs();
    const result = output.get('result');
    const steps = Array.from(output.get('steps') || []);
    const error = output.get('error');
    
    if (error) {
      return {
        success: false,
        error: error,
        result: null,
        steps: []
      };
    }
    
    return {
      success: true,
      result: result,
      steps: steps,
      method: 'sympy',
      pythonCode: pythonCode.trim()
    };
    
  } catch (error) {
    console.error('Python 실행 오류:', error);
    return {
      success: false,
      error: error.message || 'Python execution failed',
      result: null,
      steps: []
    };
  }
}

/**
 * 메인 Worker 핸들러
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
      return new Response(null, { headers: corsHeaders });
    }
    
    // GET / - 헬스체크
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          version: '1.0',
          service: 'Python Math Solver',
          endpoints: {
            health: 'GET /',
            solve: 'POST /solve'
          },
          pyodideReady: pyodideReady
        }),
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
              error: 'equation parameter required'
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
        
        console.log(`📐 수학 문제 풀이 요청: ${equation}`);
        
        // 수학 문제 풀이
        const result = await solveMathProblem(equation, method);
        
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
    
    // 404
    return new Response(
      JSON.stringify({
        error: 'Not found',
        availableEndpoints: ['GET /', 'POST /solve']
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
