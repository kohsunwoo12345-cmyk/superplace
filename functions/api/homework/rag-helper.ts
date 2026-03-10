interface Env {
  VECTORIZE: Vectorize;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * RAG 검색 - 관련 지식 검색
 */
export async function searchRelevantKnowledge(
  query: string,
  subject: string,
  grade: number,
  VECTORIZE: Vectorize,
  GOOGLE_GEMINI_API_KEY: string,
  topK: number = 5
): Promise<{ text: string; score: number; metadata: any }[]> {
  try {
    console.log(`🔍 RAG 검색 시작: "${query.substring(0, 50)}..." (${subject}, ${grade}학년)`);

    // 1. 쿼리를 임베딩으로 변환
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: query }]
          }
        })
      }
    );

    if (!embeddingResponse.ok) {
      console.error(`❌ 쿼리 임베딩 실패: HTTP ${embeddingResponse.status}`);
      return [];
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.embedding?.values;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      console.error('❌ 쿼리 임베딩 데이터 없음');
      return [];
    }

    console.log(`✅ 쿼리 임베딩 생성 완료 (dim: ${queryEmbedding.length})`);

    // 2. Vectorize에서 유사한 청크 검색
    const searchResults = await VECTORIZE.query(queryEmbedding, {
      topK,
      filter: {
        subject,
        grade
      },
      returnMetadata: true
    });

    console.log(`📚 RAG 검색 결과: ${searchResults.matches?.length || 0}개 발견`);

    if (!searchResults.matches || searchResults.matches.length === 0) {
      console.log('⚠️ 관련 지식 없음');
      return [];
    }

    // 3. 결과 포맷팅
    const results = searchResults.matches.map((match: any) => ({
      text: match.metadata?.text || '',
      score: match.score || 0,
      metadata: {
        fileName: match.metadata?.fileName,
        fileType: match.metadata?.fileType,
        chunkIndex: match.metadata?.chunkIndex
      }
    }));

    console.log(`✅ RAG 검색 완료: 최고 점수 ${results[0]?.score.toFixed(4)}`);

    return results;

  } catch (error: any) {
    console.error('❌ RAG 검색 오류:', error.message);
    return [];
  }
}

/**
 * RAG 컨텍스트를 프롬프트에 추가
 */
export function buildRAGPrompt(
  basePrompt: string,
  ragResults: { text: string; score: number; metadata: any }[]
): string {
  if (ragResults.length === 0) {
    return basePrompt;
  }

  const ragContext = ragResults
    .map((result, idx) => {
      const source = result.metadata.fileName || 'Unknown';
      const type = result.metadata.fileType || 'reference';
      return `[참고자료 ${idx + 1}] (출처: ${source}, 유형: ${type}, 유사도: ${(result.score * 100).toFixed(1)}%)\n${result.text}`;
    })
    .join('\n\n');

  const enhancedPrompt = `
📚 **참고 지식 베이스** (총 ${ragResults.length}개):
${ragContext}

---

${basePrompt}

⚠️ 위의 참고 자료를 활용하여 더 정확하고 교육적인 피드백을 제공해주세요.
특히 교과서나 정답지의 내용과 비교하여 채점해주세요.
`;

  return enhancedPrompt;
}

/**
 * 숙제 내용에서 핵심 쿼리 추출
 */
export async function extractKeyQuery(
  homeworkImages: string[],
  subject: string,
  GOOGLE_GEMINI_API_KEY: string
): Promise<string> {
  try {
    console.log(`📝 숙제에서 핵심 쿼리 추출 중...`);

    const imageParts = homeworkImages.slice(0, 2).map((img: string) => {
      const base64Image = img.replace(/^data:image\/\w+;base64,/, '');
      return {
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Image
        }
      };
    });

    const extractPrompt = `이 ${subject} 숙제 이미지를 보고, 학생이 공부하고 있는 핵심 주제나 개념을 50자 이내로 요약해주세요.
    
예시:
- "삼각형의 넓이 구하기"
- "영어 과거시제 문법"
- "분수의 덧셈과 뺄셈"

간결하게 핵심만 추출해주세요:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: extractPrompt },
              ...imageParts
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      console.error(`❌ 쿼리 추출 실패: HTTP ${response.status}`);
      return `${subject} 기본 개념`;
    }

    const data = await response.json();
    const extractedQuery = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || `${subject} 기본 개념`;

    console.log(`✅ 추출된 쿼리: "${extractedQuery}"`);

    return extractedQuery;

  } catch (error: any) {
    console.error('❌ 쿼리 추출 오류:', error.message);
    return `${subject} 기본 개념`;
  }
}
