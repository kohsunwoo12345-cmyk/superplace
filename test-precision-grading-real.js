/**
 * 정밀 채점 API 실제 테스트
 * Production 환경에서 테스트
 */

const API_BASE = 'https://superplacestudy.pages.dev';

// 간단한 수학 문제 이미지 생성 (텍스트로 시뮬레이션)
const createTestImage = (type) => {
  const canvas = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  return canvas;
};

async function testPrecisionGrading() {
  console.log('🧪 정밀 채점 API 테스트 시작...\n');
  
  const testCases = [
    {
      name: '주관식 수학 문제 (Python 계산 필요)',
      images: [createTestImage('subjective_math')],
      subject: 'math',
      expectedOCR: true,
      expectedPython: true
    },
    {
      name: '객관식 문제 (OCR 건너뛰기)',
      images: [createTestImage('multiple_choice')],
      subject: 'korean',
      expectedOCR: false,
      expectedPython: false
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 테스트: ${testCase.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/api/homework/precision-grading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          images: testCase.images,
          subject: testCase.subject
        })
      });
      
      const duration = Date.now() - startTime;
      const result = await response.json();
      
      console.log(`⏱️  처리 시간: ${duration}ms\n`);
      
      if (result.success) {
        console.log('✅ 채점 성공!');
        console.log(`📊 점수: ${result.score}점 (${result.correctAnswers}/${result.totalQuestions})`);
        console.log(`💬 피드백: ${result.feedback?.substring(0, 100)}...`);
        
        if (result.ocrText) {
          console.log(`\n📄 OCR 텍스트 추출:`);
          console.log(`   ${result.ocrText.substring(0, 150)}...`);
        }
        
        if (result.pythonCalculations && result.pythonCalculations.length > 0) {
          console.log(`\n🐍 Python 계산 결과:`);
          result.pythonCalculations.forEach((calc, idx) => {
            console.log(`   ${idx + 1}. ${calc.equation} = ${calc.result}`);
            if (calc.steps) {
              console.log(`      단계: ${calc.steps.join(' → ')}`);
            }
          });
        }
        
        // 검증
        console.log(`\n🔍 검증:`);
        console.log(`   OCR 수행: ${result.ocrText ? '✅' : '❌'} (예상: ${testCase.expectedOCR ? '✅' : '❌'})`);
        console.log(`   Python 계산: ${result.pythonCalculations?.length > 0 ? '✅' : '❌'} (예상: ${testCase.expectedPython ? '✅' : '❌'})`);
        
      } else {
        console.log(`❌ 채점 실패: ${result.error || '알 수 없는 오류'}`);
      }
      
    } catch (error) {
      console.log(`❌ API 호출 실패: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ 모든 테스트 완료!');
  console.log(`${'='.repeat(60)}\n`);
}

testPrecisionGrading();
