/**
 * 실제 숙제 검사 시스템 테스트
 * 
 * 테스트 시나리오:
 * 1. 간단한 수학 문제 (OCR 텍스트 제공)
 * 2. 복잡한 수학 문제 (방정식 포함)
 * 3. Python Workers 통합 확인
 * 4. RAG 지식베이스 활용 확인
 * 5. 최종 채점 결과 확인
 */

const API_BASE = 'https://superplacestudy.pages.dev';

// 색상 출력
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log('cyan', '📋', title);
  console.log('='.repeat(70));
}

// 테스트용 숙제 이미지 (1x1 픽셀, 실제로는 OCR 텍스트 사용)
const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/**
 * 테스트 1: 간단한 수학 문제 (사칙연산)
 */
async function testSimpleMath() {
  section('테스트 1: 간단한 수학 문제 (사칙연산)');
  
  const ocrText = `
수학 숙제

1. 계산하시오.
   15 + 27 = 42

2. 계산하시오.
   24 × 3 = 72

3. 계산하시오.
   100 - 35 = 65
  `;
  
  log('blue', '📝', 'OCR 텍스트:');
  console.log(ocrText.trim());
  console.log('');
  
  try {
    log('blue', '📤', 'API 호출 중...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/homework/precision-grading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        images: [TEST_IMAGE],
        subject: '수학',
        ocrText: ocrText.trim()
      })
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      log('red', '❌', `API 오류: ${response.status}`);
      console.log(errorText);
      return false;
    }
    
    const result = await response.json();
    
    log('green', '✅', `채점 완료 (${elapsed}ms)`);
    console.log('');
    
    // 결과 출력
    log('magenta', '📊', '채점 결과:');
    console.log(`   점수: ${result.score}점`);
    console.log(`   정답/총문제: ${result.correctAnswers}/${result.totalQuestions}`);
    console.log('');
    
    if (result.pythonCalculations && result.pythonCalculations.length > 0) {
      log('blue', '🐍', 'Python 계산 결과:');
      result.pythonCalculations.forEach((calc, idx) => {
        console.log(`   ${idx + 1}. ${calc.equation} = ${calc.result}`);
        console.log(`      방법: ${calc.method || 'Unknown'}`);
      });
      console.log('');
    } else {
      log('yellow', '⚠️', 'Python 계산 없음 (Fallback 사용)');
      console.log('');
    }
    
    if (result.ragContext) {
      log('blue', '📚', 'RAG 지식베이스 사용: 예');
    } else {
      log('yellow', '⚠️', 'RAG 지식베이스 사용: 아니오 (비어있음)');
    }
    console.log('');
    
    log('blue', '💬', '피드백:');
    console.log(`   ${result.feedback.substring(0, 200)}...`);
    console.log('');
    
    return result.success;
    
  } catch (error) {
    log('red', '❌', `테스트 실패: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * 테스트 2: 방정식 문제
 */
async function testEquations() {
  section('테스트 2: 방정식 문제');
  
  const ocrText = `
수학 숙제 - 방정식

1. 다음 방정식을 푸시오.
   2x + 5 = 15
   학생 답: x = 5

2. 다음 방정식을 푸시오.
   3x - 7 = 20
   학생 답: x = 9

3. 다음 방정식을 푸시오.
   5x = 25
   학생 답: x = 5
  `;
  
  log('blue', '📝', 'OCR 텍스트:');
  console.log(ocrText.trim());
  console.log('');
  
  try {
    log('blue', '📤', 'API 호출 중...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/homework/precision-grading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        images: [TEST_IMAGE],
        subject: '수학',
        ocrText: ocrText.trim()
      })
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      log('red', '❌', `API 오류: ${response.status}`);
      console.log(errorText);
      return false;
    }
    
    const result = await response.json();
    
    log('green', '✅', `채점 완료 (${elapsed}ms)`);
    console.log('');
    
    // 결과 출력
    log('magenta', '📊', '채점 결과:');
    console.log(`   점수: ${result.score}점`);
    console.log(`   정답/총문제: ${result.correctAnswers}/${result.totalQuestions}`);
    console.log('');
    
    if (result.pythonCalculations && result.pythonCalculations.length > 0) {
      log('blue', '🐍', 'Python 계산 결과:');
      result.pythonCalculations.forEach((calc, idx) => {
        console.log(`   ${idx + 1}. ${calc.equation} = ${calc.result}`);
        console.log(`      방법: ${calc.method || 'Unknown'}`);
        if (calc.steps && calc.steps.length > 1) {
          console.log(`      단계: ${calc.steps.slice(0, 3).join(' → ')}`);
        }
      });
      console.log('');
    } else {
      log('yellow', '⚠️', 'Python 계산 없음 (Fallback 사용)');
      console.log('');
    }
    
    // 상세 결과
    if (result.detailedResults && result.detailedResults.length > 0) {
      log('blue', '📝', '상세 채점:');
      result.detailedResults.forEach((detail, idx) => {
        const status = detail.isCorrect ? '✅' : '❌';
        console.log(`   ${idx + 1}. ${status} 문제 ${detail.questionNumber || idx + 1}`);
        console.log(`      학생 답: ${detail.studentAnswer || 'N/A'}`);
        console.log(`      정답: ${detail.correctAnswer || 'N/A'}`);
        if (detail.explanation) {
          console.log(`      설명: ${detail.explanation.substring(0, 80)}...`);
        }
      });
      console.log('');
    }
    
    log('blue', '💬', '피드백:');
    console.log(`   ${result.feedback.substring(0, 200)}...`);
    console.log('');
    
    return result.success;
    
  } catch (error) {
    log('red', '❌', `테스트 실패: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * 테스트 3: 복합 문제 (계산 + 방정식)
 */
async function testMixedProblems() {
  section('테스트 3: 복합 문제 (계산 + 방정식)');
  
  const ocrText = `
수학 종합 문제

1. (10 + 5) × 2 = 30

2. 2x + 8 = 20
   x = 6

3. 144 ÷ 12 = 12

4. 3x - 5 = 10
   x = 5
  `;
  
  log('blue', '📝', 'OCR 텍스트:');
  console.log(ocrText.trim());
  console.log('');
  
  try {
    log('blue', '📤', 'API 호출 중...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/homework/precision-grading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        images: [TEST_IMAGE],
        subject: '수학',
        ocrText: ocrText.trim()
      })
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      log('red', '❌', `API 오류: ${response.status}`);
      console.log(errorText);
      return false;
    }
    
    const result = await response.json();
    
    log('green', '✅', `채점 완료 (${elapsed}ms)`);
    console.log('');
    
    // 결과 출력
    log('magenta', '📊', '채점 결과:');
    console.log(`   점수: ${result.score}점`);
    console.log(`   정답/총문제: ${result.correctAnswers}/${result.totalQuestions}`);
    console.log('');
    
    if (result.pythonCalculations && result.pythonCalculations.length > 0) {
      log('blue', '🐍', `Python 계산: ${result.pythonCalculations.length}개 수식 처리`);
      result.pythonCalculations.forEach((calc, idx) => {
        console.log(`   ${idx + 1}. ${calc.equation} = ${calc.result} [${calc.method}]`);
      });
      console.log('');
    }
    
    log('blue', '🎯', '강점:');
    console.log(`   ${result.strengths || 'N/A'}`);
    console.log('');
    
    log('blue', '💡', '개선 제안:');
    console.log(`   ${result.suggestions || 'N/A'}`);
    console.log('');
    
    return result.success;
    
  } catch (error) {
    log('red', '❌', `테스트 실패: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * 테스트 4: 오답이 포함된 문제
 */
async function testWithErrors() {
  section('테스트 4: 오답이 포함된 숙제');
  
  const ocrText = `
수학 숙제

1. 15 + 27 = 42  ✓

2. 24 × 3 = 70   (정답: 72)

3. 100 - 35 = 65 ✓

4. 2x + 5 = 15
   x = 4   (정답: x = 5)
  `;
  
  log('blue', '📝', 'OCR 텍스트 (오답 포함):');
  console.log(ocrText.trim());
  console.log('');
  
  try {
    log('blue', '📤', 'API 호출 중...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/homework/precision-grading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        images: [TEST_IMAGE],
        subject: '수학',
        ocrText: ocrText.trim()
      })
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      log('red', '❌', `API 오류: ${response.status}`);
      console.log(errorText);
      return false;
    }
    
    const result = await response.json();
    
    log('green', '✅', `채점 완료 (${elapsed}ms)`);
    console.log('');
    
    // 결과 출력
    log('magenta', '📊', '채점 결과:');
    console.log(`   점수: ${result.score}점`);
    console.log(`   정답/총문제: ${result.correctAnswers}/${result.totalQuestions}`);
    console.log('');
    
    // 오답 확인
    if (result.correctAnswers < result.totalQuestions) {
      const wrongCount = result.totalQuestions - result.correctAnswers;
      log('yellow', '⚠️', `오답: ${wrongCount}개 발견 (정상)`);
      console.log('');
    }
    
    if (result.pythonCalculations && result.pythonCalculations.length > 0) {
      log('blue', '🐍', 'Python 계산으로 정답 확인:');
      result.pythonCalculations.forEach((calc, idx) => {
        console.log(`   ${idx + 1}. ${calc.equation} = ${calc.result}`);
      });
      console.log('');
    }
    
    log('blue', '💬', '피드백:');
    console.log(`   ${result.feedback}`);
    console.log('');
    
    return result.success;
    
  } catch (error) {
    log('red', '❌', `테스트 실패: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * 메인 테스트 실행
 */
async function runAllTests() {
  console.log('\n' + '█'.repeat(70));
  log('cyan', '🧪', '실제 숙제 검사 시스템 테스트');
  console.log('█'.repeat(70));
  
  const startTime = Date.now();
  
  const results = {
    test1: await testSimpleMath(),
    test2: await testEquations(),
    test3: await testMixedProblems(),
    test4: await testWithErrors()
  };
  
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // 최종 요약
  section('📊 테스트 결과 요약');
  
  console.log('');
  log(results.test1 ? 'green' : 'red', results.test1 ? '✅' : '❌', '테스트 1: 간단한 수학 문제');
  log(results.test2 ? 'green' : 'red', results.test2 ? '✅' : '❌', '테스트 2: 방정식 문제');
  log(results.test3 ? 'green' : 'red', results.test3 ? '✅' : '❌', '테스트 3: 복합 문제');
  log(results.test4 ? 'green' : 'red', results.test4 ? '✅' : '❌', '테스트 4: 오답 포함 숙제');
  console.log('');
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  log('blue', '⏱️', `총 소요 시간: ${elapsedTime}초`);
  log('blue', '📈', `통과율: ${passCount}/${totalTests} (${Math.round(passCount/totalTests*100)}%)`);
  console.log('');
  
  if (passCount === totalTests) {
    log('green', '🎉', '모든 테스트 통과!');
    console.log('');
    log('green', '✅', '숙제 검사 시스템이 정상 작동합니다.');
  } else {
    log('yellow', '⚠️', '일부 테스트 실패');
    console.log('');
    log('yellow', '📝', '실패한 테스트를 확인하고 디버깅하세요.');
  }
  
  console.log('█'.repeat(70) + '\n');
  
  process.exit(passCount === totalTests ? 0 : 1);
}

// 테스트 실행
runAllTests().catch(error => {
  log('red', '💥', `치명적 오류: ${error.message}`);
  console.error(error);
  process.exit(1);
});
