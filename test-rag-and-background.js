/**
 * RAG 및 백그라운드 처리 테스트 스크립트
 * 
 * 이 스크립트는 다음을 테스트합니다:
 * 1. RAG 파일 업로드
 * 2. 백그라운드 숙제 제출
 * 3. 상태 조회
 */

const BASE_URL = process.env.BASE_URL || 'https://superplacestudy.pages.dev';

// 테스트 데이터
const testTextbookContent = `
초등학교 3학년 수학 교과서

1단원: 덧셈과 뺄셈
- 두 자리 수의 덧셈: 예) 25 + 13 = 38
- 세 자리 수의 덧셈: 예) 235 + 147 = 382
- 받아올림이 있는 덧셈: 예) 48 + 27 = 75
- 두 자리 수의 뺄셈: 예) 45 - 12 = 33
- 받아내림이 있는 뺄셈: 예) 52 - 18 = 34

2단원: 곱셈
- 곱셈의 기본: 2 × 3 = 6 (2를 3번 더한 것)
- 구구단: 2단부터 9단까지
- 두 자리 수와 한 자리 수의 곱셈: 예) 23 × 4 = 92

3단원: 나눗셈
- 나눗셈의 기본: 12 ÷ 3 = 4
- 나머지가 있는 나눗셈: 13 ÷ 3 = 4 나머지 1
`;

const testAnswerKey = `
초등학교 3학년 수학 정답지

1단원 연습문제:
1번. 25 + 13 = ? 정답: 38
2번. 48 + 27 = ? 정답: 75
3번. 45 - 12 = ? 정답: 33
4번. 52 - 18 = ? 정답: 34

2단원 연습문제:
5번. 2 × 3 = ? 정답: 6
6번. 7 × 8 = ? 정답: 56
7번. 23 × 4 = ? 정답: 92

3단원 연습문제:
8번. 12 ÷ 3 = ? 정답: 4
9번. 13 ÷ 3 = ? 정답: 4 나머지 1
10번. 20 ÷ 5 = ? 정답: 4
`;

// 더미 이미지 (Base64 - 매우 작은 1x1 투명 PNG)
const dummyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testRAGUpload() {
  console.log('\n=== 1. RAG 파일 업로드 테스트 ===\n');
  
  try {
    // 교과서 업로드
    console.log('📚 교과서 업로드 중...');
    const textbookResponse = await fetch(`${BASE_URL}/api/rag/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: '초등 3학년 수학 교과서',
        content: testTextbookContent,
        subject: '수학',
        grade: 3,
        fileType: 'textbook'
      })
    });
    
    const textbookResult = await textbookResponse.json();
    
    if (textbookResponse.ok) {
      console.log('✅ 교과서 업로드 성공!');
      console.log(`   - 파일 ID: ${textbookResult.fileId}`);
      console.log(`   - 청크 수: ${textbookResult.chunkCount}`);
      console.log(`   - 임베딩 수: ${textbookResult.embeddedChunks}`);
    } else {
      console.error('❌ 교과서 업로드 실패:', textbookResult.error || textbookResult.message);
    }
    
    // 정답지 업로드
    console.log('\n📝 정답지 업로드 중...');
    const answerKeyResponse = await fetch(`${BASE_URL}/api/rag/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: '초등 3학년 수학 정답지',
        content: testAnswerKey,
        subject: '수학',
        grade: 3,
        fileType: 'answer-key'
      })
    });
    
    const answerKeyResult = await answerKeyResponse.json();
    
    if (answerKeyResponse.ok) {
      console.log('✅ 정답지 업로드 성공!');
      console.log(`   - 파일 ID: ${answerKeyResult.fileId}`);
      console.log(`   - 청크 수: ${answerKeyResult.chunkCount}`);
      console.log(`   - 임베딩 수: ${answerKeyResult.embeddedChunks}`);
    } else {
      console.error('❌ 정답지 업로드 실패:', answerKeyResult.error || answerKeyResult.message);
    }
    
  } catch (error) {
    console.error('❌ RAG 업로드 테스트 중 오류:', error.message);
  }
}

async function testBackgroundSubmission() {
  console.log('\n=== 2. 백그라운드 숙제 제출 테스트 ===\n');
  
  try {
    // 숙제 제출 (비동기)
    console.log('📤 숙제 제출 중...');
    const startTime = Date.now();
    
    const submitResponse = await fetch(`${BASE_URL}/api/homework/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        code: 'TEST-001',
        images: [dummyImageBase64]
      })
    });
    
    const submitTime = Date.now() - startTime;
    const submitResult = await submitResponse.json();
    
    if (submitResponse.status === 202) {
      console.log(`✅ 숙제 제출 성공! (응답 시간: ${submitTime}ms)`);
      console.log(`   - 제출 ID: ${submitResult.submission.id}`);
      console.log(`   - 상태: ${submitResult.submission.status}`);
      console.log(`   - 예상 완료 시간: ${submitResult.estimatedCompletionTime}`);
      
      return submitResult.submission.id;
    } else if (submitResponse.status === 503) {
      console.warn('⚠️ Queue가 설정되지 않았습니다. 동기 처리 API를 사용하세요.');
      console.log('   → POST /api/homework/grade');
      return null;
    } else {
      console.error('❌ 숙제 제출 실패:', submitResult.error || submitResult.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ 백그라운드 제출 테스트 중 오류:', error.message);
    return null;
  }
}

async function testStatusCheck(submissionId, maxRetries = 10) {
  console.log('\n=== 3. 채점 상태 조회 테스트 ===\n');
  
  if (!submissionId) {
    console.warn('⚠️ 제출 ID가 없어 상태 조회를 건너뜁니다.');
    return;
  }
  
  try {
    for (let i = 1; i <= maxRetries; i++) {
      console.log(`\n🔍 상태 조회 시도 ${i}/${maxRetries}...`);
      
      const statusResponse = await fetch(`${BASE_URL}/api/homework/status/${submissionId}`);
      const statusResult = await statusResponse.json();
      
      if (!statusResponse.ok) {
        console.error('❌ 상태 조회 실패:', statusResult.error || statusResult.message);
        return;
      }
      
      console.log(`   - 상태: ${statusResult.status}`);
      
      if (statusResult.status === 'graded') {
        console.log('\n✅ 채점 완료!');
        console.log(`   - 점수: ${statusResult.grading.score}점`);
        console.log(`   - 과목: ${statusResult.grading.subject}`);
        console.log(`   - 정답 수: ${statusResult.grading.correctAnswers}/${statusResult.grading.totalQuestions}`);
        console.log(`   - 피드백: ${statusResult.grading.feedback.substring(0, 100)}...`);
        return;
      } else if (statusResult.status === 'failed') {
        console.error('❌ 채점 실패');
        return;
      } else {
        console.log(`   ⏳ 진행 중... (${statusResult.estimatedTimeRemaining || '대기'})`);
        
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
        }
      }
    }
    
    console.warn('\n⚠️ 최대 재시도 횟수 도달. 채점이 아직 완료되지 않았습니다.');
    
  } catch (error) {
    console.error('❌ 상태 조회 테스트 중 오류:', error.message);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   RAG 및 백그라운드 처리 종합 테스트                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n🌐 테스트 URL: ${BASE_URL}`);
  console.log(`📅 테스트 시작 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n`);
  
  // 1. RAG 업로드 테스트
  await testRAGUpload();
  
  // 2. 백그라운드 제출 테스트
  const submissionId = await testBackgroundSubmission();
  
  // 3. 상태 조회 테스트
  if (submissionId) {
    await testStatusCheck(submissionId);
  }
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   테스트 완료                                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📝 테스트 요약:');
  console.log('   1. RAG 파일 업로드: 교과서 및 정답지 업로드 완료');
  console.log('   2. 백그라운드 제출: 즉시 응답 (202 Accepted) 확인');
  console.log('   3. 상태 조회: 채점 진행 상태 추적');
  console.log('\n⚠️ 참고:');
  console.log('   - Queue가 설정되지 않은 경우 503 에러가 발생할 수 있습니다.');
  console.log('   - 이 경우 기존 동기 API (/api/homework/grade)를 사용하세요.');
  console.log('   - RAG는 두 API 모두에서 자동으로 작동합니다.\n');
}

// 테스트 실행
runAllTests().catch(error => {
  console.error('\n❌ 전체 테스트 실패:', error);
  process.exit(1);
});
