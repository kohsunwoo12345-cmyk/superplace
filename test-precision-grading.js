const fs = require('fs');

const BASE_URL = 'https://superplacestudy.pages.dev';

// 간단한 수학 문제 이미지 생성 (Base64)
function createTestImage() {
  // 실제로는 실제 숙제 이미지를 사용해야 하지만, 
  // 테스트를 위해 텍스트 이미지를 생성하는 것처럼 시뮬레이션
  
  // 빈 1x1 PNG 이미지 (실제 테스트에서는 실제 이미지 사용)
  const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  return base64;
}

async function testPrecisionGrading() {
  console.log('🧪 정밀 채점 시스템 테스트\n');
  
  const testData = {
    userId: 1,
    images: [createTestImage()],
    subject: '수학'
  };
  
  console.log('📋 Test: 정밀 채점 API 호출');
  console.log('- 과목:', testData.subject);
  console.log('- 이미지 수:', testData.images.length);
  
  try {
    const response = await fetch(`${BASE_URL}/api/homework/precision-grading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ 채점 성공!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 점수: ${result.score}점`);
      console.log(`📝 총 문제 수: ${result.totalQuestions}`);
      console.log(`✅ 정답 수: ${result.correctAnswers}`);
      
      if (result.ocrText) {
        console.log(`\n📝 OCR 추출 텍스트 (${result.ocrText.length}자):`);
        console.log(result.ocrText.substring(0, 200) + '...');
      }
      
      if (result.pythonCalculations && result.pythonCalculations.length > 0) {
        console.log(`\n🐍 Python 계산 결과 (${result.pythonCalculations.length}개):`);
        result.pythonCalculations.forEach((calc, i) => {
          console.log(`  ${i + 1}. ${calc.equation}`);
          console.log(`     결과: ${calc.result}`);
          if (calc.pythonCode) {
            console.log(`     코드: ${calc.pythonCode.substring(0, 100)}...`);
          }
        });
      }
      
      console.log('\n📋 피드백:');
      console.log(result.feedback);
      
      console.log('\n💪 강점:');
      console.log(result.strengths);
      
      console.log('\n📈 개선 사항:');
      console.log(result.suggestions);
      
    } else {
      console.error('\n❌ 채점 실패:', result.error);
    }
    
  } catch (error) {
    console.error('❌ API 호출 오류:', error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 테스트 완료');
  console.log('\n⚠️ 참고: 실제 숙제 이미지로 테스트하려면');
  console.log('   실제 Base64 인코딩된 이미지를 사용하세요.');
}

testPrecisionGrading().catch(console.error);
