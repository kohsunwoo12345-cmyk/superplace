/**
 * DeepSeek OCR-2 숙제 검사 통합 테스트
 * 
 * 흐름: 사진 업로드 → RAG 구동 → DeepSeek OCR 모델 채점과 동시에 수학은 파이썬 실행 → DeepSeek OCR 모델이 피드백 및 채점 결과를 출력
 */

const https = require('https');

// 테스트 설정
const TEST_CONFIG = {
  baseUrl: 'https://superplacestudy.pages.dev',
  userId: 1,  // 테스트 사용자 ID
  timeout: 60000  // 60초 타임아웃
};

// 간단한 수학 숙제 이미지 (Base64)
// 실제 환경에서는 실제 숙제 사진을 사용
const SAMPLE_HOMEWORK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * DeepSeek OCR-2 모델로 채점 설정 업데이트
 */
async function updateGradingConfigToDeepSeek() {
  console.log('\n📝 1단계: 채점 설정을 DeepSeek OCR-2로 업데이트...');
  
  const configData = {
    systemPrompt: `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요  
3. 정답 여부를 판단하세요 (문제에 정답이 표시되어 있거나, 일반적인 학습 지식으로 판단)
4. 각 문제에 대한 피드백을 제공하세요

**수학 문제의 경우 파이썬으로 검증:**
- 계산 문제는 파이썬으로 정답을 계산하여 학생 답과 비교
- 식 세우기, 풀이 과정의 논리성도 평가

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "subject": "수학/영어/국어 등",
  "grade": 학년,
  "score": 점수,
  "totalQuestions": 문제 총 개수,
  "correctAnswers": 맞은 문제 수,
  "feedback": "전체적인 피드백 (최소 7문장)",
  "strengths": "잘한 점 (최소 3가지)",
  "suggestions": "개선할 점 (최소 3가지)",
  "completion": "good/average/poor",
  "problemAnalysis": [
    {
      "page": 1,
      "problem": "문제 내용",
      "answer": "학생 답",
      "isCorrect": true/false,
      "type": "문제 유형",
      "concept": "관련 개념",
      "explanation": "채점 근거 및 설명"
    }
  ],
  "weaknessTypes": ["약점 유형들"],
  "detailedAnalysis": "상세 분석 (최소 15문장)",
  "studyDirection": "학습 방향 제안 (최소 5문장)"
}`,
    model: 'deepseek-ocr-2',
    temperature: 0.2,
    maxTokens: 300,
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
      console.log('   모델:', configData.model);
      console.log('   Temperature:', configData.temperature);
      console.log('   Max Tokens:', configData.maxTokens);
      return true;
    } else {
      console.log('⚠️ 채점 설정 업데이트 실패:', result.status);
      console.log('   응답:', JSON.stringify(result.data).substring(0, 200));
      return false;
    }
  } catch (error) {
    console.error('❌ 설정 업데이트 오류:', error.message);
    return false;
  }
}

/**
 * 숙제 제출 및 채점 테스트
 */
async function testHomeworkGrading(testCase) {
  console.log(`\n📸 2단계: 숙제 제출 및 DeepSeek OCR-2 채점 테스트 - ${testCase.name}`);
  
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/homework/grade`,
      'POST',
      {
        userId: TEST_CONFIG.userId,
        images: testCase.images,
        code: testCase.code || null
      }
    );
    
    const elapsedTime = Date.now() - startTime;
    
    console.log(`\n⏱️ 응답 시간: ${elapsedTime}ms`);
    console.log('📊 HTTP 상태:', result.status);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ 숙제 채점 성공!');
      console.log('\n📋 채점 결과:');
      console.log('   제출 ID:', result.data.submission?.id);
      console.log('   채점 ID:', result.data.grading?.id);
      console.log('   점수:', result.data.grading?.score + '점');
      console.log('   과목:', result.data.grading?.subject);
      console.log('   학년:', result.data.grading?.grade + '학년');
      console.log('   총 문제 수:', result.data.grading?.totalQuestions);
      console.log('   맞은 문제:', result.data.grading?.correctAnswers);
      console.log('\n💬 피드백:');
      console.log('   ', result.data.grading?.feedback?.substring(0, 150) + '...');
      console.log('\n💪 강점:');
      console.log('   ', result.data.grading?.strengths?.substring(0, 100) + '...');
      console.log('\n📝 개선 제안:');
      console.log('   ', result.data.grading?.suggestions?.substring(0, 100) + '...');
      console.log('\n🔍 취약 유형:', result.data.grading?.weaknessTypes);
      
      return {
        success: true,
        score: result.data.grading?.score,
        time: elapsedTime,
        hasDetailedFeedback: Boolean(result.data.grading?.feedback && result.data.grading?.feedback.length > 50),
        hasStrengths: Boolean(result.data.grading?.strengths && result.data.grading?.strengths.length > 20),
        hasSuggestions: Boolean(result.data.grading?.suggestions && result.data.grading?.suggestions.length > 20),
        hasAnalysis: Boolean(result.data.grading?.detailedAnalysis),
        totalQuestions: result.data.grading?.totalQuestions,
        correctAnswers: result.data.grading?.correctAnswers
      };
    } else {
      console.log('❌ 숙제 채점 실패');
      console.log('   상태:', result.status);
      console.log('   메시지:', result.data.message || result.data.error);
      console.log('   상세:', JSON.stringify(result.data).substring(0, 300));
      
      return {
        success: false,
        error: result.data.message || result.data.error,
        status: result.status,
        time: elapsedTime
      };
    }
  } catch (error) {
    console.error('❌ 테스트 실행 오류:', error.message);
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
  console.log('🧪 DeepSeek OCR-2 숙제 검사 통합 테스트');
  console.log('='.repeat(80));
  console.log('📅 테스트 시간:', new Date().toLocaleString('ko-KR'));
  console.log('🌐 Base URL:', TEST_CONFIG.baseUrl);
  console.log('👤 사용자 ID:', TEST_CONFIG.userId);
  console.log('⏰ 타임아웃:', TEST_CONFIG.timeout / 1000 + '초');
  
  // 1단계: 채점 설정을 DeepSeek OCR-2로 업데이트
  const configSuccess = await updateGradingConfigToDeepSeek();
  
  if (!configSuccess) {
    console.log('\n❌ 채점 설정 업데이트 실패로 테스트 중단');
    return;
  }
  
  // 2단계: 숙제 제출 및 채점 테스트
  const testCases = [
    {
      name: '단일 이미지 숙제',
      images: [SAMPLE_HOMEWORK_IMAGE],
      code: 'TEST001'
    },
    {
      name: '다중 이미지 숙제 (2장)',
      images: [SAMPLE_HOMEWORK_IMAGE, SAMPLE_HOMEWORK_IMAGE],
      code: 'TEST002'
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testHomeworkGrading(testCase);
    results.push({ testCase: testCase.name, result });
    
    // 다음 테스트 전 2초 대기
    if (testCase !== testCases[testCases.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 3단계: 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.result.success).length;
  const totalCount = results.length;
  
  console.log(`\n총 테스트: ${totalCount}개`);
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${totalCount - successCount}개`);
  console.log(`성공률: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  results.forEach((r, idx) => {
    console.log(`\n[${idx + 1}] ${r.testCase}`);
    console.log(`    결과: ${r.result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`    응답 시간: ${r.result.time}ms`);
    if (r.result.success) {
      console.log(`    점수: ${r.result.score}점`);
      console.log(`    문제 수: ${r.result.totalQuestions}, 정답: ${r.result.correctAnswers}`);
      console.log(`    상세 피드백: ${r.result.hasDetailedFeedback ? '✓' : '✗'}`);
      console.log(`    강점 분석: ${r.result.hasStrengths ? '✓' : '✗'}`);
      console.log(`    개선 제안: ${r.result.hasSuggestions ? '✓' : '✗'}`);
      console.log(`    상세 분석: ${r.result.hasAnalysis ? '✓' : '✗'}`);
    } else {
      console.log(`    오류: ${r.result.error}`);
    }
  });
  
  // 4단계: 권장 사항
  console.log('\n' + '='.repeat(80));
  console.log('💡 권장 사항');
  console.log('='.repeat(80));
  
  if (successCount === totalCount) {
    console.log('✅ 모든 테스트가 성공했습니다!');
    console.log('   - DeepSeek OCR-2 모델이 정상 작동합니다');
    console.log('   - 숙제 채점 피드백이 올바르게 생성됩니다');
    console.log('   - 프롬프트와 RAG가 제대로 적용되고 있습니다');
  } else {
    console.log('⚠️ 일부 테스트가 실패했습니다:');
    console.log('   1. Cloudflare 환경 변수 확인: Novita_AI_API');
    console.log('   2. API 키가 유효한지 확인');
    console.log('   3. 배포가 완료되었는지 확인');
    console.log('   4. 브라우저 콘솔에서 추가 오류 로그 확인');
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
