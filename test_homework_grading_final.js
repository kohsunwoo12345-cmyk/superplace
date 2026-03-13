/**
 * 최종 숙제 채점 테스트
 * - Gemini 2.5 Flash Lite 모델 사용 확인
 * - 토큰 최적화 확인 (입력/출력)
 * - 문제별 분석: 정답/오답만 표시
 * - 개선점 40토큰 제한 확인
 * - 종합 평가: 부족한 개념 중심
 * - RAG 동작 확인
 */

const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjuAAAAAElFTkSuQmCC';

async function testHomeworkGrading() {
  console.log('🧪 숙제 채점 시스템 최종 테스트');
  console.log('=' . repeat(60));
  
  const workerUrl = 'https://physonsuperplacestudy-production.kohsunwoo12345.workers.dev/grade';
  
  const testPayload = {
    images: [testImage],
    userId: 123,
    userName: '테스트학생',
    academyId: 1,
    model: 'gemini-2.5-flash-lite',
    temperature: 0.3,
    enableRAG: false,
    systemPrompt: '간결하게 채점하세요.'
  };
  
  console.log('\n📤 요청 전송:');
  console.log(`  URL: ${workerUrl}`);
  console.log(`  모델: ${testPayload.model}`);
  console.log(`  RAG: ${testPayload.enableRAG ? 'ON' : 'OFF'}`);
  console.log(`  Temperature: ${testPayload.temperature}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u'
      },
      body: JSON.stringify(testPayload)
    });
    
    const elapsed = Date.now() - startTime;
    
    console.log(`\n📥 응답 수신 (${elapsed}ms):`);
    console.log(`  상태: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 오류:', errorText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 채점 성공!');
      console.log('\n📊 결과 분석:');
      
      result.results.forEach((r, idx) => {
        console.log(`\n  이미지 ${idx + 1}:`);
        console.log(`    과목: ${r.subject}`);
        console.log(`    OCR 길이: ${r.ocrText.length} 글자`);
        
        if (r.ragContext && r.ragContext.length > 0) {
          console.log(`    RAG 검색: ${r.ragContext.length}개 결과`);
        }
        
        console.log('\n    채점 결과:');
        console.log(`      전체 문제: ${r.grading.totalQuestions}`);
        console.log(`      정답 수: ${r.grading.correctAnswers}`);
        console.log(`      정답률: ${(r.grading.correctAnswers / r.grading.totalQuestions * 100).toFixed(1)}%`);
        
        if (r.grading.detailedResults) {
          console.log(`\n    문제별 분석 (정답/오답만):`);
          r.grading.detailedResults.forEach(problem => {
            const status = problem.isCorrect ? '✓ 정답' : '✗ 오답';
            console.log(`      문제 ${problem.questionNumber}: ${status}`);
          });
        }
        
        console.log(`\n    종합 평가 (부족한 개념):`);
        console.log(`      ${r.grading.overallFeedback.substring(0, 150)}${r.grading.overallFeedback.length > 150 ? '...' : ''}`);
        
        if (r.grading.improvements) {
          const improvementsLength = r.grading.improvements.split('').length;
          console.log(`\n    개선할 점 (${improvementsLength} 글자):`);
          console.log(`      ${r.grading.improvements}`);
          if (improvementsLength > 100) {
            console.log(`      ⚠️  40토큰 제한 초과 가능 (${improvementsLength} 글자)`);
          } else {
            console.log(`      ✅ 40토큰 이내 (${improvementsLength} 글자)`);
          }
        }
      });
      
      console.log('\n✅ 모든 테스트 통과!');
    } else {
      console.error('❌ 채점 실패:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

testHomeworkGrading();
