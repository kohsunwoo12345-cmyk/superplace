#!/usr/bin/env node
/**
 * 숙제 검사 AI 설정 통합 테스트
 * - 설정 저장 테스트
 * - RAG 파일 업로드 테스트
 * - 설정 불러오기 테스트
 */

const BASE_URL = process.env.BASE_URL || 'https://superplacestudy.pages.dev';

async function testHomeworkGradingConfig() {
  console.log('🚀 숙제 검사 AI 설정 통합 테스트 시작\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // 테스트 1: 설정 불러오기 (초기 상태)
  console.log('📋 테스트 1: 초기 설정 불러오기');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
    const data = await response.json();
    
    results.total++;
    if (response.ok && data.success) {
      console.log('✅ 설정 불러오기 성공');
      console.log(`   - Model: ${data.config.model}`);
      console.log(`   - Temperature: ${data.config.temperature}`);
      console.log(`   - Enable RAG: ${data.config.enableRAG}`);
      results.passed++;
    } else {
      throw new Error(data.error || 'Failed to load config');
    }
  } catch (error) {
    console.error('❌ 설정 불러오기 실패:', error.message);
    results.failed++;
  }
  console.log('');

  // 테스트 2: 설정 저장 (프롬프트 + 모델 설정)
  console.log('📋 테스트 2: 설정 저장');
  try {
    const configData = {
      systemPrompt: `테스트용 프롬프트: 숙제 이미지를 분석하고 다음 JSON 형식으로 응답하세요:
{
  "totalQuestions": 10,
  "correctAnswers": 8,
  "score": 80,
  "feedback": "잘했습니다",
  "detailedResults": []
}`,
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      maxTokens: 2000,
      topK: 40,
      topP: 0.95,
      enableRAG: 0,
      knowledgeBase: null,
    };

    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData),
    });
    const data = await response.json();
    
    results.total++;
    if (data.success) {
      console.log('✅ 설정 저장 성공');
      console.log(`   - Config ID: ${data.configId}`);
      console.log(`   - Message: ${data.message}`);
      results.passed++;
    } else {
      throw new Error(data.error || 'Failed to save config');
    }
  } catch (error) {
    console.error('❌ 설정 저장 실패:', error.message);
    results.failed++;
  }
  console.log('');

  // 테스트 3: RAG 지식 파일 업로드
  console.log('📋 테스트 3: RAG 지식 파일 업로드');
  try {
    const knowledgeContent = `
    수학 숙제 채점 기준:
    - 정답: 문제를 정확히 풀었는지 확인
    - 풀이 과정: 논리적으로 풀이 과정이 작성되었는지
    - 글씨: 읽기 쉽게 작성되었는지
    
    평가 기준:
    - 90점 이상: 매우 우수
    - 80-89점: 우수
    - 70-79점: 보통
    - 70점 미만: 노력 필요
    
    피드백 작성 시:
    - 구체적인 개선 방안 제시
    - 긍정적인 격려 포함
    - 다음 학습 방향 안내
    `;

    const response = await fetch(`${BASE_URL}/api/rag/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'homework-grading-test-knowledge.txt',
        content: knowledgeContent,
        metadata: {
          type: 'homework_grading_knowledge',
          uploadedAt: new Date().toISOString(),
        }
      }),
    });
    const data = await response.json();
    
    results.total++;
    if (response.ok && data.success) {
      console.log('✅ RAG 지식 파일 업로드 성공');
      console.log(`   - Filename: ${data.filename}`);
      console.log(`   - Chunks: ${data.chunksProcessed}`);
      console.log(`   - Vectors: ${data.vectorsInserted}`);
      results.passed++;
    } else {
      throw new Error(data.error || 'Failed to upload knowledge');
    }
  } catch (error) {
    console.error('❌ RAG 지식 파일 업로드 실패:', error.message);
    results.failed++;
  }
  console.log('');

  // 테스트 4: RAG 활성화 설정 저장
  console.log('📋 테스트 4: RAG 활성화 설정 저장');
  try {
    const knowledgeFiles = [
      {
        name: 'homework-grading-test-knowledge.txt',
        content: '수학 숙제 채점 기준...',
        size: 500,
      }
    ];

    const configDataWithRAG = {
      systemPrompt: `RAG 활성화 테스트: 첨부된 채점 기준을 참고하여 숙제를 채점하세요.`,
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      maxTokens: 2000,
      topK: 40,
      topP: 0.95,
      enableRAG: 1,
      knowledgeBase: JSON.stringify(knowledgeFiles),
    };

    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configDataWithRAG),
    });
    const data = await response.json();
    
    results.total++;
    if (data.success) {
      console.log('✅ RAG 활성화 설정 저장 성공');
      console.log(`   - Config ID: ${data.configId}`);
      results.passed++;
    } else {
      throw new Error(data.error || 'Failed to save config with RAG');
    }
  } catch (error) {
    console.error('❌ RAG 활성화 설정 저장 실패:', error.message);
    results.failed++;
  }
  console.log('');

  // 테스트 5: 최종 설정 확인
  console.log('📋 테스트 5: 최종 설정 확인');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/homework-grading-config`);
    const data = await response.json();
    
    results.total++;
    if (response.ok && data.success) {
      console.log('✅ 최종 설정 확인 성공');
      console.log(`   - Model: ${data.config.model}`);
      console.log(`   - Temperature: ${data.config.temperature}`);
      console.log(`   - Enable RAG: ${data.config.enableRAG}`);
      console.log(`   - Has Knowledge: ${Boolean(data.config.knowledgeBase)}`);
      
      if (data.config.knowledgeBase) {
        const files = JSON.parse(data.config.knowledgeBase);
        console.log(`   - Knowledge Files: ${files.length}개`);
      }
      
      results.passed++;
    } else {
      throw new Error(data.error || 'Failed to verify final config');
    }
  } catch (error) {
    console.error('❌ 최종 설정 확인 실패:', error.message);
    results.failed++;
  }
  console.log('');

  // 최종 결과
  console.log('═══════════════════════════════════════');
  console.log('📊 테스트 결과 요약');
  console.log('═══════════════════════════════════════');
  console.log(`총 테스트: ${results.total}`);
  console.log(`✅ 통과: ${results.passed}`);
  console.log(`❌ 실패: ${results.failed}`);
  console.log(`성공률: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════\n');

  if (results.failed === 0) {
    console.log('🎉 모든 테스트 통과! 숙제 검사 AI 설정 시스템이 정상 작동합니다.\n');
    console.log('📝 다음 단계:');
    console.log('   1. https://superplacestudy.pages.dev/dashboard/admin/homework-grading-config 접속');
    console.log('   2. 프롬프트 및 모델 설정');
    console.log('   3. 채점 기준 자료 파일 업로드');
    console.log('   4. 설정 저장 후 실제 숙제 채점으로 테스트');
    process.exit(0);
  } else {
    console.log('⚠️ 일부 테스트가 실패했습니다. 로그를 확인해주세요.\n');
    process.exit(1);
  }
}

testHomeworkGradingConfig().catch(error => {
  console.error('💥 테스트 실행 중 오류 발생:', error);
  process.exit(1);
});
