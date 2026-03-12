"""
Cloudflare Worker에 /solve 엔드포인트 추가
"""
import json
import requests

ACCOUNT_ID = "e8c2bd49c64f5f1dd05cd2e19c80dd85"
WORKER_NAME = "physonsuperplacestudy"
API_TOKEN = "R6lNqS0bf8OLg4vhgzQtzIy-AaXSfNMmGlUOtjA1"

# Worker 스크립트에 /solve 엔드포인트 추가
worker_script = """
// /solve 엔드포인트 추가
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // /solve 엔드포인트 처리
    if (url.pathname === '/solve' && request.method === 'POST') {
      try {
        const body = await request.json();
        const equation = body.equation || '';
        
        // 간단한 수식 계산
        let result = null;
        try {
          // 안전한 계산 (eval 대신 간단한 파싱)
          result = evaluateExpression(equation);
        } catch (e) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid equation',
            equation: equation
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          result: String(result),
          equation: equation
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({
          success: false,
          error: e.message
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 기존 엔드포인트 처리...
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'AI 챗봇 & 숙제 채점 Worker',
      version: '2.4.0',
      endpoints: {
        solve: 'POST /solve - 수식 계산',
        grade: 'POST /grade - 숙제 채점'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function evaluateExpression(expr) {
  // 간단한 수식 계산 (더하기, 빼기, 곱하기, 나누기)
  expr = expr.replace(/\\s+/g, '');
  
  // 곱하기/나누기 기호 변환
  expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
  
  // 안전한 계산
  const parts = expr.match(/^([0-9.]+)([+\\-*/])([0-9.]+)$/);
  if (!parts) throw new Error('Invalid format');
  
  const a = parseFloat(parts[1]);
  const op = parts[2];
  const b = parseFloat(parts[3]);
  
  switch(op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b !== 0 ? a / b : 'Error';
    default: throw new Error('Unknown operator');
  }
}
"""

# API로 Worker 스크립트 업데이트
print("🔧 Workers에 /solve 엔드포인트 추가 중...")
print(f"Worker: {WORKER_NAME}")
print()

# 참고: Worker 전체 스크립트를 업로드해야 하므로
# 기존 스크립트를 가져와서 수정해야 합니다.
print("⚠️  Worker 스크립트 전체를 수동으로 업데이트해야 합니다.")
print("또는 wrangler CLI를 사용해야 합니다.")
print()
print("대안: Worker 대시보드에서 직접 편집")
print("https://dash.cloudflare.com/")
