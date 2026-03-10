/**
 * Python Workers 통합 숙제 채점 테스트
 * 
 * 테스트 시나리오:
 * 1. Python Workers 서비스 헬스체크
 * 2. 간단한 수학 문제 풀이 테스트
 * 3. 복잡한 방정식 풀이 테스트
 * 4. 실제 숙제 이미지 채점 (OCR + Python + LLM)
 */

const PYTHON_WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev';
const API_BASE = 'https://superplacestudy.pages.dev';

// 테스트용 Base64 이미지 (간단한 수학 문제)
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// 색상 출력용 유틸
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

async function testPythonWorkerHealth() {
  log('cyan', '🔍', '테스트 1: Python Workers 헬스체크');
  
  try {
    const response = await fetch(PYTHON_WORKER_URL);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      log('green', '✅', `Python Workers 정상 작동 (버전: ${data.version || 'unknown'})`);
      return true;
    } else {
      log('red', '❌', `헬스체크 실패: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    log('red', '❌', `Python Workers 연결 실패: ${error.message}`);
    return false;
  }
}

async function testSimpleMath() {
  log('cyan', '🔍', '테스트 2: 간단한 수학 문제 풀이');
  
  const testCases = [
    { equation: '15 + 27', expected: '42' },
    { equation: '100 - 35', expected: '65' },
    { equation: '12 * 8', expected: '96' },
    { equation: '144 / 12', expected: '12' },
    { equation: '2 + 3 * 4', expected: '14' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    try {
      const response = await fetch(`${PYTHON_WORKER_URL}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equation: test.equation,
          method: 'sympy'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.result.toString() === test.expected) {
        log('green', '  ✅', `${test.equation} = ${data.result} (정답)`);
        passed++;
      } else {
        log('red', '  ❌', `${test.equation}: 예상 ${test.expected}, 실제 ${data.result}`);
        failed++;
      }
    } catch (error) {
      log('red', '  ❌', `${test.equation}: ${error.message}`);
      failed++;
    }
  }
  
  log('blue', '📊', `간단한 계산 결과: ${passed}/${testCases.length} 통과`);
  return failed === 0;
}

async function testEquations() {
  log('cyan', '🔍', '테스트 3: 방정식 풀이');
  
  const equations = [
    '2x + 5 = 15',
    '3x - 7 = 20',
    'x^2 = 16',
    '2x + 3x = 25',
  ];
  
  let passed = 0;
  
  for (const eq of equations) {
    try {
      const response = await fetch(`${PYTHON_WORKER_URL}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equation: eq,
          method: 'sympy'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        log('green', '  ✅', `${eq} → x = ${data.result}`);
        passed++;
      } else {
        log('yellow', '  ⚠️', `${eq}: ${data.error || '결과 없음'}`);
      }
    } catch (error) {
      log('red', '  ❌', `${eq}: ${error.message}`);
    }
  }
  
  log('blue', '📊', `방정식 풀이 결과: ${passed}/${equations.length} 성공`);
  return passed > 0;
}

async function testHomeworkGrading() {
  log('cyan', '🔍', '테스트 4: 실제 숙제 채점 (OCR + Python + LLM)');
  
  // 테스트 OCR 텍스트 (수학 문제)
  const ocrText = `
1. 다음 식을 계산하시오.
   12 + 18 = 30
   
2. 방정식을 푸시오.
   2x + 5 = 15
   x = 5
   
3. 다음을 계산하시오.
   24 × 3 = 72
  `;
  
  try {
    log('blue', '  📤', '채점 API 호출 중...');
    
    const response = await fetch(`${API_BASE}/api/homework/precision-grading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        images: [TEST_IMAGE_BASE64],
        subject: '수학',
        ocrText: ocrText
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      log('green', '  ✅', `채점 성공: ${data.score}점 (${data.correctAnswers}/${data.totalQuestions})`);
      
      if (data.pythonCalculations && data.pythonCalculations.length > 0) {
        log('blue', '  🐍', 'Python 계산 결과:');
        data.pythonCalculations.forEach((calc, idx) => {
          log('green', '    ✓', `${calc.equation} = ${calc.result} (방법: ${calc.method})`);
        });
      }
      
      if (data.ragContext) {
        log('blue', '  📚', 'RAG 지식베이스 사용: 예');
      } else {
        log('yellow', '  ⚠️', 'RAG 지식베이스 사용: 아니오');
      }
      
      log('blue', '  💬', `피드백: ${data.feedback.substring(0, 100)}...`);
      
      return true;
    } else {
      log('red', '  ❌', `채점 실패: ${data.error}`);
      return false;
    }
  } catch (error) {
    log('red', '  ❌', `채점 API 오류: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  log('cyan', '🚀', 'Python Workers 통합 숙제 채점 테스트 시작');
  console.log('='.repeat(70) + '\n');
  
  const startTime = Date.now();
  
  // 테스트 실행
  const test1 = await testPythonWorkerHealth();
  console.log('');
  
  const test2 = await testSimpleMath();
  console.log('');
  
  const test3 = await testEquations();
  console.log('');
  
  const test4 = await testHomeworkGrading();
  console.log('');
  
  // 최종 결과
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const allPassed = test1 && test2 && test3 && test4;
  
  console.log('='.repeat(70));
  log('cyan', '📊', '테스트 결과 요약');
  console.log('='.repeat(70));
  
  log(test1 ? 'green' : 'red', test1 ? '✅' : '❌', '테스트 1: Python Workers 헬스체크');
  log(test2 ? 'green' : 'red', test2 ? '✅' : '❌', '테스트 2: 간단한 수학 문제 풀이');
  log(test3 ? 'green' : 'red', test3 ? '✅' : '❌', '테스트 3: 방정식 풀이');
  log(test4 ? 'green' : 'red', test4 ? '✅' : '❌', '테스트 4: 실제 숙제 채점');
  
  console.log('');
  log('blue', '⏱️', `총 소요 시간: ${elapsedTime}초`);
  
  if (allPassed) {
    log('green', '🎉', '모든 테스트 통과!');
  } else {
    log('red', '⚠️', '일부 테스트 실패');
  }
  
  console.log('='.repeat(70) + '\n');
  
  // Exit code
  process.exit(allPassed ? 0 : 1);
}

// 테스트 실행
runAllTests().catch(error => {
  log('red', '💥', `테스트 실행 오류: ${error.message}`);
  console.error(error);
  process.exit(1);
});
