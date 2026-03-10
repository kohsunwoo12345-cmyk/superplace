/**
 * 실제 이미지를 사용한 숙제 검사 테스트
 * 
 * 이 스크립트는 생성된 실제 숙제 이미지를 사용하여
 * 전체 시스템을 테스트합니다.
 */

const fs = require('fs');
const path = require('path');

// 테스트 설정
const API_ENDPOINT = 'https://superplacestudy.pages.dev/api/homework/precision-grading';
const IMAGE_PATH = path.join(__dirname, 'test-homework-real.jpg');

// 테스트 실행
async function runRealImageTest() {
  console.log('🧪 실제 숙제 이미지 테스트 시작\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. 이미지 파일 확인
    console.log('\n📁 Step 1: 이미지 파일 확인');
    if (!fs.existsSync(IMAGE_PATH)) {
      throw new Error(`이미지 파일을 찾을 수 없습니다: ${IMAGE_PATH}`);
    }
    
    const fileStats = fs.statSync(IMAGE_PATH);
    console.log(`✅ 파일 존재: ${IMAGE_PATH}`);
    console.log(`   크기: ${(fileStats.size / 1024).toFixed(2)} KB`);
    
    // 2. 이미지를 Base64로 변환
    console.log('\n🔄 Step 2: 이미지 Base64 변환');
    const imageBuffer = fs.readFileSync(IMAGE_PATH);
    const base64Image = imageBuffer.toString('base64');
    console.log(`✅ Base64 변환 완료 (${base64Image.length} 문자)`);
    
    // 3. API 요청 준비
    console.log('\n📤 Step 3: API 요청 준비');
    const requestBody = {
      userId: 'test-user-001',
      images: [`data:image/jpeg;base64,${base64Image}`],
      subject: 'math',
      ocrText: `Math Homework - Grade 8

1. 15 + 27 = 42
2. 24 × 3 = 72
3. 2x + 5 = 15, x = 5
4. 48 ÷ 6 = 8
5. 3x - 7 = 20, x = 9`
    };
    
    console.log('📋 요청 데이터:');
    console.log(`   - userId: ${requestBody.userId}`);
    console.log(`   - 이미지 수: ${requestBody.images.length}`);
    console.log(`   - 과목: ${requestBody.subject}`);
    console.log(`   - OCR 텍스트 길이: ${requestBody.ocrText.length} 문자`);
    
    // 4. API 호출
    console.log('\n🚀 Step 4: API 호출');
    console.log(`   엔드포인트: ${API_ENDPOINT}`);
    
    const startTime = Date.now();
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ 응답 수신 (${responseTime}초)`);
    console.log(`   상태 코드: ${response.status}`);
    
    // 5. 응답 분석
    console.log('\n📊 Step 5: 응답 분석');
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 오류 (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    // 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('📈 채점 결과');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 성공 여부: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`📊 점수: ${result.score}점`);
    console.log(`✓ 정답 수: ${result.correctAnswers}/${result.totalQuestions}`);
    
    if (result.detailedResults && result.detailedResults.length > 0) {
      console.log('\n📝 문제별 채점 결과:');
      result.detailedResults.forEach((item, index) => {
        console.log(`\n   ${index + 1}. ${item.question || '문제 ' + (index + 1)}`);
        console.log(`      학생 답: ${item.studentAnswer}`);
        console.log(`      정답: ${item.correctAnswer}`);
        console.log(`      결과: ${item.isCorrect ? '✅ 정답' : '❌ 오답'}`);
        if (item.feedback) {
          console.log(`      피드백: ${item.feedback}`);
        }
      });
    }
    
    if (result.feedback) {
      console.log('\n💬 전체 피드백:');
      console.log(`   ${result.feedback}`);
    }
    
    if (result.strengths) {
      console.log('\n💪 강점:');
      if (Array.isArray(result.strengths)) {
        result.strengths.forEach(s => console.log(`   ✓ ${s}`));
      } else {
        console.log(`   ${result.strengths}`);
      }
    }
    
    if (result.suggestions) {
      console.log('\n📌 개선 제안:');
      if (Array.isArray(result.suggestions)) {
        result.suggestions.forEach(s => console.log(`   → ${s}`));
      } else {
        console.log(`   ${result.suggestions}`);
      }
    }
    
    if (result.ragContext) {
      console.log('\n🔍 RAG 지식베이스 사용: ✅');
    }
    
    if (result.pythonCalculations && result.pythonCalculations.length > 0) {
      console.log('\n🐍 Python 계산 사용:');
      result.pythonCalculations.forEach((calc, idx) => {
        console.log(`   ${idx + 1}. ${calc.equation} = ${calc.result} (${calc.method})`);
      });
    }
    
    // 6. 테스트 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('✅ 테스트 완료!');
    console.log('='.repeat(60));
    console.log(`\n⏱️  응답 시간: ${responseTime}초`);
    console.log(`🎯 점수: ${result.score}점`);
    console.log(`📊 정답률: ${((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)}%`);
    
    // 성공 여부 판단
    const isSuccess = result.success && result.score >= 80;
    
    if (isSuccess) {
      console.log('\n🎉 테스트 성공! 시스템이 정상적으로 작동합니다.');
      process.exit(0);
    } else {
      console.log('\n⚠️  테스트 경고: 점수가 80점 미만입니다.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('\n상세 오류:');
    console.error(error);
    process.exit(1);
  }
}

// 테스트 실행
console.log('🚀 실제 이미지 테스트 시작...\n');
runRealImageTest();
