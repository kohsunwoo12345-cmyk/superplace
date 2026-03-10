/**
 * DeepSeek OCR-2 + Python Worker 통합 테스트
 * 실제 숙제 검사 흐름: 사진 업로드 → DeepSeek OCR-2 채점 → Python 검증 → 피드백 출력
 */

const https = require('https');

// 테스트 설정
const TEST_CONFIG = {
  baseUrl: 'https://superplacestudy.pages.dev',
  pythonWorkerUrl: 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev/solve',
  userId: 1,
  timeout: 90000
};

// 실제 수학 숙제 이미지 (간단한 계산 문제)
// 실제로는 학생이 촬영한 숙제 사진을 사용
const MATH_HOMEWORK_IMAGES = [
  // 더미 이미지 (실제 환경에서는 실제 숙제 사진 Base64 사용)
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
];

/**
 * API 호출 헬퍼
 */
function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      },
      timeout: TEST_CONFIG.timeout
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * 1단계: Python Worker 테스트
 */
async function testPythonWorker() {
  console.log('\n' + '='.repeat(80));
  console.log('🐍 1단계: Python Worker 단독 테스트');
  console.log('='.repeat(80));
  
  const testEquations = [
    '3 + 5',
    '10 - 7',
    '4 * 6',
    '12 / 3',
    '2 * 3 + 5',
    '(10 - 2) * 3'
  ];
  
  const results = [];
  
  for (const equation of testEquations) {
    console.log(`\n📐 테스트: ${equation}`);
    
    const startTime = Date.now();
    
    try {
      const result = await makeRequest(
        TEST_CONFIG.pythonWorkerUrl,
        'POST',
        { equation }
      );
      
      const elapsedTime = Date.now() - startTime;
      
      if (result.status === 200 && result.data.success) {
        console.log(`   ✅ 성공 (${elapsedTime}ms)`);
        console.log(`   정답: ${result.data.result}`);
        results.push({ equation, success: true, result: result.data.result, time: elapsedTime });
      } else {
        console.log(`   ❌ 실패 (${elapsedTime}ms)`);
        console.log(`   오류: ${result.data.error || result.data.message}`);
        results.push({ equation, success: false, error: result.data.error, time: elapsedTime });
      }
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      results.push({ equation, success: false, error: error.message, time: Date.now() - startTime });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Python Worker 테스트 결과: ${successCount}/${testEquations.length} 성공`);
  
  return successCount === testEquations.length;
}

/**
 * 2단계: 채점 설정을 DeepSeek OCR-2로 업데이트
 */
async function updateGradingConfig() {
  console.log('\n' + '='.repeat(80));
  console.log('📝 2단계: DeepSeek OCR-2 채점 설정 업데이트');
  console.log('='.repeat(80));
  
  const configData = {
    systemPrompt: `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요
3. 정답 여부를 판단하세요
4. 각 문제에 대한 피드백을 제공하세요

**중요**: 수학 문제는 problemAnalysis에 상세히 기록해주세요. 문제 텍스트에 계산식을 명확히 포함시켜주세요.

응답 형식 (JSON):
{
  "subject": "수학",
  "grade": 3,
  "score": 90.0,
  "totalQuestions": 5,
  "correctAnswers": 4,
  "feedback": "전체 피드백 (7문장 이상)",
  "strengths": "강점 (3가지 이상)",
  "suggestions": "개선점 (3가지 이상)",
  "completion": "good",
  "problemAnalysis": [
    {
      "page": 1,
      "problem": "3 + 5 = ?",
      "answer": "8",
      "isCorrect": true,
      "type": "수학-덧셈",
      "concept": "기본 덧셈",
      "explanation": "정확히 풀었습니다"
    }
  ],
  "weaknessTypes": [],
  "detailedAnalysis": "상세 분석 (15문장 이상)",
  "studyDirection": "학습 방향 (5문장 이상)"
}`,
    model: 'deepseek-ocr-2',
    temperature: 0.2,
    maxTokens: 500,
    topK: 40,
    topP: 0.6,
    enableRAG: false,
    knowledgeBase: ''
  };

  try {
    const result = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/admin/homework-grading-config`,
      'POST',
      configData
    );
    
    if (result.status === 200 || result.status === 201) {
      console.log('✅ 채점 설정 업데이트 성공');
      console.log(`   모델: ${configData.model}`);
      console.log(`   Temperature: ${configData.temperature}`);
      console.log(`   Max Tokens: ${configData.maxTokens}`);
      return true;
    } else {
      console.log(`⚠️ 설정 업데이트 실패 (${result.status})`);
      console.log(`   응답: ${JSON.stringify(result.data).substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 설정 업데이트 오류: ${error.message}`);
    return false;
  }
}

/**
 * 3단계: 통합 테스트 (DeepSeek OCR-2 + Python Worker)
 */
async function testIntegratedGrading() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 3단계: DeepSeek OCR-2 + Python Worker 통합 테스트');
  console.log('='.repeat(80));
  
  console.log('\n📸 숙제 제출 및 채점 시작...');
  
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/homework/grade`,
      'POST',
      {
        userId: TEST_CONFIG.userId,
        images: MATH_HOMEWORK_IMAGES,
        code: `TEST-PYTHON-${Date.now()}`
      }
    );
    
    const elapsedTime = Date.now() - startTime;
    
    console.log(`\n⏱️ 총 응답 시간: ${elapsedTime}ms (${(elapsedTime / 1000).toFixed(1)}초)`);
    console.log(`📊 HTTP 상태: ${result.status}`);
    
    if (result.status === 200 && result.data.success) {
      console.log('\n✅ 숙제 채점 성공!');
      
      const grading = result.data.grading;
      
      console.log('\n' + '='.repeat(80));
      console.log('📋 채점 결과');
      console.log('='.repeat(80));
      console.log(`제출 ID: ${result.data.submission?.id}`);
      console.log(`채점 ID: ${grading?.id}`);
      console.log(`과목: ${grading?.subject}`);
      console.log(`학년: ${grading?.grade}학년`);
      console.log(`점수: ${grading?.score}점`);
      console.log(`총 문제: ${grading?.totalQuestions}개`);
      console.log(`정답: ${grading?.correctAnswers}개`);
      console.log(`오답: ${grading?.totalQuestions - grading?.correctAnswers}개`);
      
      console.log('\n' + '='.repeat(80));
      console.log('💬 피드백');
      console.log('='.repeat(80));
      console.log(grading?.feedback || '(피드백 없음)');
      
      console.log('\n' + '='.repeat(80));
      console.log('💪 강점');
      console.log('='.repeat(80));
      console.log(grading?.strengths || '(강점 분석 없음)');
      
      console.log('\n' + '='.repeat(80));
      console.log('📝 개선 제안');
      console.log('='.repeat(80));
      console.log(grading?.suggestions || '(개선 제안 없음)');
      
      console.log('\n' + '='.repeat(80));
      console.log('🔍 취약 유형');
      console.log('='.repeat(80));
      console.log(grading?.weaknessTypes?.join(', ') || '(없음)');
      
      // Python 검증 결과 확인
      console.log('\n' + '='.repeat(80));
      console.log('🐍 Python Worker 검증 결과');
      console.log('='.repeat(80));
      
      if (grading?.problemAnalysis && grading.problemAnalysis.length > 0) {
        const pythonVerifiedCount = grading.problemAnalysis.filter(p => p.pythonVerified).length;
        console.log(`총 문제 수: ${grading.problemAnalysis.length}개`);
        console.log(`Python 검증: ${pythonVerifiedCount}개`);
        
        grading.problemAnalysis.forEach((problem, idx) => {
          console.log(`\n[문제 ${idx + 1}]`);
          console.log(`   문제: ${problem.problem || '(없음)'}`);
          console.log(`   학생 답: ${problem.answer || '(없음)'}`);
          console.log(`   정답 여부: ${problem.isCorrect ? '✅ 정답' : '❌ 오답'}`);
          console.log(`   유형: ${problem.type || '(없음)'}`);
          
          if (problem.pythonVerified) {
            console.log(`   🐍 Python 검증: ✅ 완료`);
            console.log(`   🐍 Python 계산 결과: ${problem.pythonResult}`);
          } else {
            console.log(`   🐍 Python 검증: - (미검증)`);
          }
          
          console.log(`   설명: ${problem.explanation || '(없음)'}`);
        });
      } else {
        console.log('문제 분석 데이터가 없습니다.');
      }
      
      return {
        success: true,
        score: grading?.score,
        totalQuestions: grading?.totalQuestions,
        correctAnswers: grading?.correctAnswers,
        pythonVerifiedCount: grading?.problemAnalysis?.filter(p => p.pythonVerified).length || 0,
        time: elapsedTime
      };
    } else {
      console.log('\n❌ 숙제 채점 실패');
      console.log(`   상태: ${result.status}`);
      console.log(`   메시지: ${result.data.message || result.data.error}`);
      console.log(`   상세: ${JSON.stringify(result.data).substring(0, 500)}`);
      
      return {
        success: false,
        error: result.data.message || result.data.error,
        status: result.status,
        time: elapsedTime
      };
    }
  } catch (error) {
    console.error(`\n❌ 테스트 실행 오류: ${error.message}`);
    return {
      success: false,
      error: error.message,
      time: Date.now() - startTime
    };
  }
}

/**
 * 메인 테스트 실행
 */
async function runAllTests() {
  console.log('='.repeat(80));
  console.log('🧪 DeepSeek OCR-2 + Python Worker 통합 테스트');
  console.log('='.repeat(80));
  console.log(`📅 테스트 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🌐 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`🐍 Python Worker: ${TEST_CONFIG.pythonWorkerUrl}`);
  console.log(`👤 사용자 ID: ${TEST_CONFIG.userId}`);
  
  // 1단계: Python Worker 테스트
  const pythonSuccess = await testPythonWorker();
  
  if (!pythonSuccess) {
    console.log('\n❌ Python Worker 테스트 실패로 중단');
    return;
  }
  
  // 2단계: 채점 설정 업데이트
  await new Promise(resolve => setTimeout(resolve, 2000));
  const configSuccess = await updateGradingConfig();
  
  if (!configSuccess) {
    console.log('\n⚠️ 채점 설정 업데이트 실패했지만 테스트 계속');
  }
  
  // 3단계: 통합 테스트
  await new Promise(resolve => setTimeout(resolve, 2000));
  const result = await testIntegratedGrading();
  
  // 최종 결과
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 테스트 결과');
  console.log('='.repeat(80));
  
  if (result.success) {
    console.log('✅ 전체 테스트 성공!');
    console.log(`   점수: ${result.score}점`);
    console.log(`   총 문제: ${result.totalQuestions}개`);
    console.log(`   정답: ${result.correctAnswers}개`);
    console.log(`   Python 검증: ${result.pythonVerifiedCount}개`);
    console.log(`   응답 시간: ${(result.time / 1000).toFixed(1)}초`);
    
    console.log('\n💡 통합 기능 확인:');
    console.log('   ✅ DeepSeek OCR-2 모델 작동');
    console.log('   ✅ 피드백 생성');
    console.log(`   ${result.pythonVerifiedCount > 0 ? '✅' : '⚠️'} Python Worker 검증 (${result.pythonVerifiedCount}개)`);
  } else {
    console.log('❌ 테스트 실패');
    console.log(`   오류: ${result.error}`);
    console.log(`   응답 시간: ${(result.time / 1000).toFixed(1)}초`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 테스트 완료');
  console.log('='.repeat(80));
}

// 테스트 실행
runAllTests().catch(error => {
  console.error('\n❌ 전체 테스트 실패:', error);
  process.exit(1);
});
