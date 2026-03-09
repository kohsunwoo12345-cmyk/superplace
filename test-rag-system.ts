/**
 * 🧪 RAG System Integration Test
 * 
 * 테스트 순서:
 * 1. 테스트 지식 파일 업로드 (@cf/baai/bge-m3 임베딩)
 * 2. Vectorize에 저장 확인
 * 3. 검색 쿼리 테스트
 * 4. Gemini API 응답 확인
 */

const TEST_UPLOAD_ENDPOINT = '/api/rag/upload';
const TEST_CHAT_ENDPOINT = '/api/rag/chat';

// 테스트 지식 베이스 데이터
const TEST_KNOWLEDGE = {
  filename: 'test-knowledge.txt',
  content: `
슈퍼플레이스는 선생님과 학생을 위한 혁신적인 교육 플랫폼입니다.

주요 기능:
1. AI 채팅 - Gemini AI를 활용한 학습 지원
2. RAG 지식 베이스 - 맞춤형 학습 자료 제공
3. 학습 자료 관리 - 문제지, 답안지 자동 생성
4. SMS 통합 - 학부모 소통 기능

기술 스택:
- Next.js 15 (App Router)
- Cloudflare Pages + D1 Database
- Cloudflare Workers AI (@cf/baai/bge-m3)
- Cloudflare Vectorize (벡터 데이터베이스)
- Google Gemini API

RAG 구현:
사용자가 지식 파일을 업로드하면 @cf/baai/bge-m3 모델로 임베딩하여
Vectorize에 저장합니다. 질문이 들어오면 관련 지식을 검색하고
Gemini API로 전송하여 정확한 답변을 생성합니다.

학습 자료 기능:
- 문제와 답안 자동 분리
- 문제지/답안지 별도 출력
- 다양한 문제 형식 지원 (객관식, 주관식)
- PDF 다운로드 기능

이 플랫폼은 교육 현장의 효율성을 크게 향상시킵니다.
`,
  metadata: {
    category: 'platform_info',
    language: 'ko',
  }
};

// 테스트 질의들
const TEST_QUERIES = [
  '슈퍼플레이스의 주요 기능은 무엇인가요?',
  'RAG는 어떻게 구현되어 있나요?',
  '@cf/baai/bge-m3 모델의 역할은 무엇인가요?',
  '학습 자료 관리 기능에 대해 설명해주세요.',
];

interface UploadResponse {
  success: boolean;
  filename: string;
  chunksProcessed: number;
  vectorsInserted: number;
  message: string;
  error?: string;
  details?: string;
}

interface ChatResponse {
  success: boolean;
  query: string;
  answer: string;
  sourcesUsed: number;
  sources: Array<{
    filename: string;
    chunkIndex: number;
    score: number;
    preview: string;
  }>;
  error?: string;
  details?: string;
}

async function testUpload(baseUrl: string): Promise<boolean> {
  console.log('\n📤 Test 1: Knowledge Upload with @cf/baai/bge-m3');
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${baseUrl}${TEST_UPLOAD_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_KNOWLEDGE),
    });

    const data: UploadResponse = await response.json();

    console.log(`\n📊 Upload Response (Status: ${response.status}):`);
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      console.error('❌ Upload failed!');
      return false;
    }

    console.log(`\n✅ Upload Success!`);
    console.log(`   - File: ${data.filename}`);
    console.log(`   - Chunks processed: ${data.chunksProcessed}`);
    console.log(`   - Vectors inserted: ${data.vectorsInserted}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Upload test error:', error.message);
    return false;
  }
}

async function testChat(baseUrl: string, query: string, index: number): Promise<boolean> {
  console.log(`\n💬 Test ${index + 2}: RAG Chat with Gemini`);
  console.log('='.repeat(60));
  console.log(`📝 Query: "${query}"`);

  try {
    const response = await fetch(`${baseUrl}${TEST_CHAT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        topK: 3,
      }),
    });

    const data: ChatResponse = await response.json();

    console.log(`\n📊 Chat Response (Status: ${response.status}):`);
    
    if (!response.ok || !data.success) {
      console.error('❌ Chat failed!');
      console.error('Error:', data.error || 'Unknown error');
      if (data.details) {
        console.error('Details:', data.details);
      }
      return false;
    }

    console.log(`\n✅ Chat Success!`);
    console.log(`   - Query: ${data.query}`);
    console.log(`   - Sources used: ${data.sourcesUsed}`);
    console.log(`\n📚 Sources:`);
    data.sources.forEach((source, i) => {
      console.log(`   ${i + 1}. ${source.filename} (chunk ${source.chunkIndex}, score: ${source.score.toFixed(4)})`);
      console.log(`      Preview: ${source.preview}`);
    });
    console.log(`\n🤖 Gemini Answer:`);
    console.log(`   ${data.answer.substring(0, 200)}${data.answer.length > 200 ? '...' : ''}`);

    return true;
  } catch (error: any) {
    console.error('❌ Chat test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 RAG System Integration Test Starting...');
  console.log('='.repeat(60));

  // Base URL 설정
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8788';
  console.log(`\n🌐 Base URL: ${baseUrl}`);

  const results: boolean[] = [];

  // Test 1: Upload
  const uploadSuccess = await testUpload(baseUrl);
  results.push(uploadSuccess);

  if (!uploadSuccess) {
    console.error('\n❌ Upload test failed. Skipping chat tests.');
    process.exit(1);
  }

  // Wait for vectorization to complete
  console.log('\n⏳ Waiting 2 seconds for vectorization to complete...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2-5: Chat with different queries
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const chatSuccess = await testChat(baseUrl, TEST_QUERIES[i], i);
    results.push(chatSuccess);
    
    // Wait between queries
    if (i < TEST_QUERIES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  const totalTests = results.length;
  const passedTests = results.filter(r => r).length;
  const failedTests = totalTests - passedTests;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! RAG system is working correctly.');
    console.log('\n🎉 Integration Complete:');
    console.log('   1. ✅ @cf/baai/bge-m3 임베딩');
    console.log('   2. ✅ Vectorize 저장');
    console.log('   3. ✅ 벡터 검색');
    console.log('   4. ✅ Gemini API 응답');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
