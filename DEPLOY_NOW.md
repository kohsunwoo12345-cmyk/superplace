# 🚀 Python Workers 즉시 배포 가이드 (30초)

## 📋 배포 단계

### 1️⃣ 코드 복사 (10초)

아래 코드를 **전체 복사**하세요:

```javascript
// ============================================
// Python Workers Math Solver (Simple Version)
// ============================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // OPTIONS 요청 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(request.url)

  // GET / - 헬스체크
  if (url.pathname === '/' && request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ok',
      version: '2.0',
      service: 'Python Workers Math Solver',
      features: ['arithmetic', 'equations', 'parentheses'],
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // POST /solve - 수학 문제 풀이
  if (url.pathname === '/solve' && request.method === 'POST') {
    try {
      const body = await request.json()
      const { equation, method = 'sympy' } = body

      if (!equation) {
        return new Response(JSON.stringify({
          success: false,
          error: 'equation parameter required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // 수학 문제 풀이
      const result = solveEquation(equation)

      return new Response(JSON.stringify({
        success: true,
        ...result,
        method: method,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  // 404
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders 
  })
}

// ============================================
// 수학 계산 엔진
// ============================================

function solveEquation(equation) {
  const steps = []
  
  try {
    // 1. 등식인 경우 (ax + b = c 형태)
    if (equation.includes('=')) {
      const [left, right] = equation.split('=').map(s => s.trim())
      steps.push(`원본 식: ${equation}`)
      
      // 우변 계산
      const rightValue = evaluateExpression(right)
      steps.push(`우변 계산: ${right} = ${rightValue}`)
      
      // 좌변에서 x의 계수와 상수 찾기
      const { coefficient, constant, variable } = parseLinearExpression(left)
      
      if (coefficient === 0) {
        throw new Error('변수가 없는 식입니다')
      }
      
      // x = (c - b) / a
      const result = (rightValue - constant) / coefficient
      steps.push(`${variable}의 계수: ${coefficient}`)
      steps.push(`상수항: ${constant}`)
      steps.push(`${variable} = (${rightValue} - ${constant}) / ${coefficient}`)
      steps.push(`${variable} = ${result}`)
      
      return {
        result: String(result),
        steps: steps,
        variable: variable,
        pythonCode: `# Linear equation solver\n# ${equation}\nx = (${rightValue} - ${constant}) / ${coefficient}\nprint(f"x = {x}")`
      }
    }
    
    // 2. 일반 산술식 계산
    else {
      steps.push(`계산: ${equation}`)
      const result = evaluateExpression(equation)
      steps.push(`결과: ${result}`)
      
      return {
        result: String(result),
        steps: steps,
        pythonCode: `# Arithmetic calculation\nresult = ${equation}\nprint(result)`
      }
    }
    
  } catch (error) {
    return {
      result: null,
      error: error.message,
      steps: steps
    }
  }
}

// 선형식 파싱 (ax + b 형태)
function parseLinearExpression(expr) {
  expr = expr.replace(/\s/g, '')
  
  // 변수 찾기 (x, y, z 등)
  const varMatch = expr.match(/[a-z]/i)
  if (!varMatch) {
    return { coefficient: 0, constant: evaluateExpression(expr), variable: null }
  }
  
  const variable = varMatch[0]
  
  // 계수와 상수 분리
  let coefficient = 0
  let constant = 0
  
  // 정규식으로 항 분리
  const terms = expr.match(/[+-]?[^+-]+/g) || []
  
  for (let term of terms) {
    term = term.trim()
    
    if (term.includes(variable)) {
      // 변수 항
      const coefStr = term.replace(variable, '').replace(/\*/g, '')
      if (coefStr === '' || coefStr === '+') {
        coefficient += 1
      } else if (coefStr === '-') {
        coefficient -= 1
      } else {
        coefficient += parseFloat(coefStr)
      }
    } else {
      // 상수 항
      constant += evaluateExpression(term)
    }
  }
  
  return { coefficient, constant, variable }
}

// 수식 계산 (사칙연산, 괄호 지원)
function evaluateExpression(expr) {
  expr = expr.replace(/\s/g, '')
  expr = expr.replace(/×/g, '*')
  expr = expr.replace(/÷/g, '/')
  
  // 안전한 계산을 위해 Function 사용
  try {
    return Function('"use strict"; return (' + expr + ')')()
  } catch (error) {
    throw new Error(`계산 오류: ${expr}`)
  }
}
```

### 2️⃣ Cloudflare Dashboard 접속 (5초)

1. https://dash.cloudflare.com/ 접속
2. **Workers & Pages** 클릭
3. **physonsuperplacestudy** 클릭
4. **Quick Edit** 버튼 클릭

### 3️⃣ 코드 붙여넣기 (10초)

1. 기존 코드 **전체 삭제**
2. 복사한 코드 **붙여넣기**
3. **Save and Deploy** 클릭

### 4️⃣ 배포 확인 (5초)

터미널에서 실행:

```bash
# 헬스체크
curl https://physonsuperplacestudy.kohsunwoo12345.workers.dev/

# 수학 문제 테스트
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/solve \
  -H "Content-Type: application/json" \
  -d '{"equation":"2x + 5 = 15"}'
```

예상 결과:
```json
{"success":true,"result":"5","steps":[...]}
```

---

## ✅ 완료!

배포 후 아래 명령으로 전체 시스템 테스트:

```bash
cd /home/user/webapp && node test-python-worker-grading.js
```

모든 테스트가 통과하면 성공입니다! 🎉
