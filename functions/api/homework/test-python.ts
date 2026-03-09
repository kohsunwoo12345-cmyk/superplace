/**
 * Cloudflare Sandbox Python 계산 직접 테스트 엔드포인트
 */

import { Sandbox } from '@cloudflare/sandbox';

interface Env {
  // 환경 변수 필요 없음 - Sandbox는 자동으로 설정됨
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: { equation: string } = await context.request.json();
    const { equation } = body;

    console.log(`\n🐍 Cloudflare Sandbox Python 계산 테스트: ${equation}`);

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

    console.log('Cloudflare Sandbox 실행 중...');
    console.log(`Python 코드:\n${pythonCode.substring(0, 300)}...`);

    // Cloudflare Sandbox 생성
    const sandbox = await Sandbox.create();
    
    try {
      // Python 코드 실행
      const result = await sandbox.runPython(pythonCode);
      
      console.log('✅ 실행 완료');
      console.log(`   stdout: ${result.stdout || '(empty)'}`);
      console.log(`   stderr: ${result.stderr || '(empty)'}`);

      return Response.json({
        success: true,
        equation,
        pythonCode,
        stdout: result.stdout,
        stderr: result.stderr,
        result: result.stdout?.replace('정답: ', '').trim() || null
      });
      
    } finally {
      // Sandbox 정리
      await sandbox.shutdown();
      console.log('✅ Sandbox shutdown 완료');
    }

  } catch (error: any) {
    console.error('❌ 오류:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
};
