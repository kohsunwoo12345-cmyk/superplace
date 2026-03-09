/**
 * Cloudflare Sandbox Python 계산 직접 테스트 엔드포인트
 */

import { getSandbox } from '@cloudflare/sandbox';

interface Env {
  SANDBOX?: any; // Durable Object binding
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { SANDBOX } = context.env;
    const body: { equation: string } = await context.request.json();
    const { equation } = body;

    console.log(`\n🐍 Cloudflare Sandbox Python 계산 테스트: ${equation}`);

    if (!SANDBOX) {
      return Response.json({
        success: false,
        error: 'SANDBOX binding not configured. Please add Durable Object binding in wrangler.toml',
        note: 'Sandbox SDK requires a Durable Object binding named SANDBOX'
      }, { status: 500 });
    }

    // Python 코드 생성
    const pythonCode = `
from sympy import symbols, solve, simplify, sympify, Eq
from sympy import sqrt, pi, E

equation_str = """${equation}"""

try:
    if '=' in equation_str:
        x = symbols('x')
        left, right = equation_str.split('=')
        eq = Eq(sympify(left.strip()), sympify(right.strip()))
        solution = solve(eq, x)
        if solution:
            print(f"정답: {solution[0]}")
        else:
            print("해가 없습니다")
    else:
        result = sympify(equation_str)
        simplified = simplify(result)
        print(f"정답: {simplified}")
except Exception as e:
    try:
        result = eval(equation_str.replace('×', '*').replace('÷', '/'))
        print(f"정답: {result}")
    except:
        print(f"계산 불가: {e}")
`;

    console.log('Cloudflare Sandbox 실행 중...');

    // Cloudflare Sandbox SDK 사용
    const sandbox = getSandbox(SANDBOX, `test-${Date.now()}`);
    
    // Python 코드 실행
    const result = await sandbox.commands.exec({
      cmd: ['python3', '-c', pythonCode]
    });
    
    console.log('✅ 실행 완료');
    console.log(`   stdout: ${result.stdout || '(empty)'}`);
    console.log(`   stderr: ${result.stderr || '(empty)'}`);
    console.log(`   exitCode: ${result.exitCode}`);

    return Response.json({
      success: result.exitCode === 0,
      equation,
      pythonCode,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      result: result.stdout?.replace('정답: ', '').trim() || null
    });

  } catch (error: any) {
    console.error('❌ 오류:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
};
