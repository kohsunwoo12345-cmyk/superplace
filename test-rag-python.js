/**
 * RAG와 Python 실제 작동 테스트
 */

const API_BASE = 'https://superplacestudy.pages.dev';

// 간단한 수학 문제 OCR 텍스트 시뮬레이션
const mathOcrText = `1. 3x + 5 = 14
   학생 답: x = 3

2. 15 ÷ 3 = ?
   학생 답: 5

3. 2 × (4 + 6) = ?
   학생 답: 20`;

// 더미 이미지 (1x1 픽셀)
const dummyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testRAGAndPython() {
  console.log('🧪 RAG와 Python 실제 작동 테스트\n');
  console.log('='.repeat(70) + '\n');
  
  try {
    console.log('📤 API 호출 중...');
    console.log(`   엔드포인트: ${API_BASE}/api/homework/precision-grading`);
    console.log(`   과목: 수학`);
    console.log(`   OCR 텍스트: ${mathOcrText.length}자\n`);
    
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/homework/precision-grading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        images: [dummyImage],
        subject: '수학',
        ocrText: mathOcrText
      })
    });
    
    const duration = Date.now() - startTime;
    const result = await response.json();
    
    console.log(`⏱️  처리 시간: ${duration}ms\n`);
    console.log('='.repeat(70) + '\n');
    
    if (result.success) {
      console.log('✅ 채점 성공!\n');
      
      console.log('📊 채점 결과:');
      console.log(`   점수: ${result.score}점`);
      console.log(`   정답: ${result.correctAnswers}/${result.totalQuestions}\n`);
      
      // RAG 검증
      console.log('🔍 RAG 검색 결과:');
      if (result.ragContext) {
        console.log('   ✅ RAG 활성화됨');
        console.log(`   📄 검색된 내용 길이: ${result.ragContext.length}자`);
        console.log(`   📝 내용 미리보기:\n${result.ragContext.substring(0, 200)}...\n`);
      } else {
        console.log('   ⚠️ RAG 검색 결과 없음 (지식 베이스가 비어있거나 RAG 비활성화)\n');
      }
      
      // Python 계산 검증
      console.log('🐍 Python SymPy 계산 결과:');
      if (result.pythonCalculations && result.pythonCalculations.length > 0) {
        console.log(`   ✅ Python 계산 성공: ${result.pythonCalculations.length}개\n`);
        
        result.pythonCalculations.forEach((calc, idx) => {
          console.log(`   ${idx + 1}. 수식: ${calc.equation}`);
          console.log(`      결과: ${calc.result}`);
          if (calc.steps && calc.steps.length > 0) {
            console.log(`      단계: ${calc.steps.join(' → ')}`);
          }
          if (calc.pythonCode) {
            console.log(`      코드: ${calc.pythonCode.substring(0, 80)}...`);
          }
          console.log('');
        });
      } else {
        console.log('   ⚠️ Python 계산 결과 없음\n');
      }
      
      // 피드백
      console.log('💬 피드백:');
      console.log(`   ${result.feedback.substring(0, 150)}...\n`);
      
      // 최종 검증
      console.log('='.repeat(70));
      console.log('🎯 최종 검증:');
      console.log('='.repeat(70));
      console.log(`   RAG 작동: ${result.ragContext ? '✅ 성공' : '❌ 실패/비활성화'}`);
      console.log(`   Python 작동: ${result.pythonCalculations?.length > 0 ? '✅ 성공' : '❌ 실패'}`);
      console.log(`   LLM 채점: ${result.totalQuestions > 0 ? '✅ 성공' : '❌ 실패'}`);
      console.log('='.repeat(70) + '\n');
      
    } else {
      console.log(`❌ 채점 실패: ${result.error || '알 수 없는 오류'}\n`);
    }
    
  } catch (error) {
    console.log(`❌ API 호출 실패: ${error.message}\n`);
  }
}

testRAGAndPython();
