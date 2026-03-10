addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'AI 챗봇 & 숙제 채점 Worker가 정상 작동 중입니다',
      version: '2.1.0',
      endpoints: {
        grade: 'POST /grade - 숙제 채점 (OCR + RAG + AI)',
        chat: 'POST /chat - AI 챗봇 (Cloudflare AI 번역 + Vectorize RAG)',
        'vectorize-upload': 'POST /vectorize-upload - Vectorize에 벡터 업로드'
      }
    }), { headers: corsHeaders });
  }

  // 🆕 Vectorize 업로드 엔드포인트
  if (url.pathname === '/vectorize-upload' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const { vectors } = body;

      if (!vectors || !Array.isArray(vectors)) {
        return new Response(JSON.stringify({ 
          error: 'vectors array is required' 
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      console.log(`📤 Vectorize 업로드: ${vectors.length}개 벡터`);

      if (!VECTORIZE) {
        throw new Error('VECTORIZE binding not configured');
      }

      // Vectorize에 벡터 삽입
      await VECTORIZE.insert(vectors);

      console.log(`✅ Vectorize 업로드 완료: ${vectors.length}개`);

      return new Response(JSON.stringify({
        success: true,
        message: `${vectors.length}개 벡터가 성공적으로 업로드되었습니다`,
        count: vectors.length
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('❌ Vectorize 업로드 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }

  // 🆕 AI 챗봇 RAG 엔드포인트
  if (url.pathname === '/chat' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const { 
        message, 
        botId, 
        userId, 
        enableRAG = true,
        topK = 5,
        systemPrompt = '',
        conversationHistory = []
      } = body;

      console.log(`💬 AI 챗봇 요청: botId=${botId}, userId=${userId}, message="${message.substring(0, 50)}..."`);

      // 1️⃣ Cloudflare AI로 한글 → 영어 번역 (RAG 검색용)
      let translatedQuery = message;
      if (enableRAG && /[가-힣]/.test(message)) {
        try {
          console.log('🌐 Cloudflare AI로 번역 중...');
          translatedQuery = await translateWithCloudflareAI(message);
          console.log(`✅ 번역 완료: "${translatedQuery.substring(0, 50)}..."`);
        } catch (transError) {
          console.warn('⚠️ 번역 실패, 원문 사용:', transError.message);
        }
      }

      // 2️⃣ Vectorize RAG 검색
      let ragContext = [];
      let ragEnabled = false;
      
      if (enableRAG && botId && VECTORIZE) {
        try {
          console.log('🔍 Vectorize RAG 검색 시작...');
          
          // Gemini Embedding으로 임베딩 생성
          const queryEmbedding = await generateEmbedding(translatedQuery);
          console.log(`✅ 임베딩 생성 완료 (${queryEmbedding.length}차원)`);
          
          // Vectorize 검색
          const searchResults = await VECTORIZE.query(queryEmbedding, {
            topK: topK,
            filter: { botId: botId },
            returnMetadata: true
          });
          
          if (searchResults.matches && searchResults.matches.length > 0) {
            ragEnabled = true;
            ragContext = searchResults.matches.map((match, idx) => ({
              text: match.metadata?.text || '',
              score: match.score?.toFixed(3) || 'N/A',
              fileName: match.metadata?.fileName || 'Unknown',
              index: idx + 1
            }));
            
            console.log(`✅ RAG 검색 완료: ${ragContext.length}개 관련 청크 발견`);
          } else {
            console.log('📭 관련 지식 없음');
          }
        } catch (ragError) {
          console.error('❌ RAG 검색 실패:', ragError.message);
        }
      }

      // 3️⃣ 최종 응답 생성 (Gemini)
      const aiResponse = await generateChatResponse({
        message,
        systemPrompt,
        conversationHistory,
        ragContext,
        ragEnabled
      });

      console.log(`✅ AI 응답 생성 완료 (${aiResponse.length}자)`);

      return new Response(JSON.stringify({
        success: true,
        response: aiResponse,
        ragEnabled,
        ragContextCount: ragContext.length,
        translatedQuery: translatedQuery !== message ? translatedQuery : null
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('❌ AI 챗봇 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), { status: 500, headers: corsHeaders });
    }
  }

  if (url.pathname === '/grade' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const { images = [], userId, userName = '학생', systemPrompt = '', model = 'gemini-2.5-flash', temperature = 0.3, enableRAG = false, academyId } = body;

      console.log(`📚 채점 시작: ${userName} (${userId}), 이미지 ${images.length}장`);

      const results = [];

      for (let idx = 0; idx < images.length; idx++) {
        const imageBase64 = images[idx];
        console.log(`📄 이미지 ${idx + 1}/${images.length} 처리 중...`);

        const ocrText = await ocrWithGemini(imageBase64);
        console.log(`✅ OCR 완료: ${ocrText.length} 글자`);

        const subject = detectSubject(ocrText);
        console.log(`✅ 과목 감지: ${subject}`);

        let calculation = null;
        if (subject === 'math') {
          calculation = calculateMath(ocrText);
          console.log(`✅ 수학 계산 완료`);
        }

        const grading = await finalGrading(ocrText, calculation, [], systemPrompt, temperature);
        console.log(`✅ 채점 완료: ${grading.correctAnswers}/${grading.totalQuestions} 정답`);

        results.push({
          imageIndex: idx,
          ocrText,
          subject,
          calculation,
          ragContext: [],
          grading,
        });
      }

      console.log(`🎉 전체 채점 완료: ${results.length}개 이미지`);

      return new Response(JSON.stringify({
        success: true,
        results
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('❌ 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: corsHeaders
  });
}

// 🌐 Cloudflare AI로 번역 (한글 → 영어)
async function translateWithCloudflareAI(text) {
  try {
    if (!AI) {
      console.warn('⚠️ Cloudflare AI binding 없음');
      return text;
    }

    const response = await AI.run('@cf/meta/m2m100-1.2b', {
      text: text,
      source_lang: 'ko',
      target_lang: 'en'
    });

    return response.translated_text || text;
  } catch (error) {
    console.error('❌ 번역 오류:', error);
    return text; // 실패 시 원문 반환
  }
}

// 📝 Gemini Embedding 생성
async function generateEmbedding(text) {
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

    const payload = {
      model: 'models/text-embedding-004',
      content: {
        parts: [{ text }]
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Embedding API 오류: ${response.status}`);
    }

    const result = await response.json();
    return result.embedding.values;
  } catch (error) {
    console.error('❌ Embedding 생성 오류:', error);
    throw error;
  }
}

// 🤖 최종 AI 응답 생성 (Gemini)
async function generateChatResponse({ message, systemPrompt, conversationHistory, ragContext, ragEnabled }) {
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      return 'AI API 키가 설정되지 않았습니다.';
    }

    // RAG 컨텍스트 추가
    let enhancedSystemPrompt = systemPrompt || '당신은 친절하고 유능한 AI 선생님입니다.';
    
    if (ragEnabled && ragContext.length > 0) {
      enhancedSystemPrompt += `\n\n📚 **관련 지식 베이스 (RAG):**\n`;
      ragContext.forEach(item => {
        enhancedSystemPrompt += `\n[관련 지식 ${item.index}] (유사도: ${item.score}, 파일: ${item.fileName})\n${item.text}\n`;
      });
      enhancedSystemPrompt += `\n위 지식 베이스의 정보를 참고하여 질문에 정확하게 답변해주세요.`;
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    // 메시지 구성
    const contents = [];
    
    // 시스템 프롬프트
    contents.push({
      parts: [{ text: enhancedSystemPrompt }]
    });

    // 대화 히스토리
    conversationHistory.forEach(msg => {
      contents.push({
        parts: [{ text: msg.role === 'user' ? `사용자: ${msg.content}` : `AI: ${msg.content}` }]
      });
    });

    // 현재 메시지
    contents.push({
      parts: [{ text: `사용자: ${message}` }]
    });

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API 오류: ${response.status}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }

    return 'AI 응답을 생성할 수 없습니다.';

  } catch (error) {
    console.error('❌ AI 응답 생성 오류:', error);
    return `오류: ${error.message}`;
  }
}

async function ocrWithGemini(imageBase64) {
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      return 'OCR API 키가 설정되지 않았습니다.';
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    let imageData = imageBase64;
    if (imageBase64.startsWith('data:image')) {
      imageData = imageBase64.split(',')[1];
    }

    const payload = {
      contents: [{
        parts: [
          { text: '이 이미지의 모든 텍스트와 수식을 정확하게 읽어서 그대로 텍스트로 변환해주세요. 수학 수식, 손글씨, 프린트된 텍스트 모두 포함해주세요.' },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageData
            }
          }
        ]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }

    return '텍스트를 읽을 수 없습니다.';

  } catch (error) {
    console.error('OCR 오류:', error);
    return `OCR 오류: ${error.message}`;
  }
}

function detectSubject(text) {
  const mathKeywords = ['=', '+', '-', '×', '÷', '/', '*', '방정식', '함수', '미분', '적분', '기하', '대수', '삼각', 'sin', 'cos', 'tan', '²', '³', '√'];
  const englishKeywords = ['be동사', '조동사', '시제', '문법', '어법', 'grammar', 'the', 'is', 'are', 'was', 'were', 'have', 'has'];

  const mathScore = mathKeywords.filter(k => text.includes(k)).length;
  const englishScore = englishKeywords.filter(k => text.toLowerCase().includes(k.toLowerCase())).length;

  if (mathScore > englishScore) return 'math';
  if (englishScore > mathScore) return 'english';
  return 'other';
}

function calculateMath(text) {
  try {
    const calculations = {};
    const patterns = [
      /(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/g,
      /(\d+)\s*-\s*(\d+)\s*=\s*(\d+)/g,
      /(\d+)\s*×\s*(\d+)\s*=\s*(\d+)/g,
      /(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)/g,
    ];

    patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const [full, a, b, studentAnswer] = match;
        const numA = parseInt(a);
        const numB = parseInt(b);
        const numStudent = parseInt(studentAnswer);

        let correctAnswer;
        if (full.includes('+')) correctAnswer = numA + numB;
        else if (full.includes('-')) correctAnswer = numA - numB;
        else if (full.includes('×')) correctAnswer = numA * numB;
        else if (full.includes('÷')) correctAnswer = numB !== 0 ? Math.floor(numA / numB) : 0;
        else return;

        calculations[full] = {
          studentAnswer: numStudent,
          correctAnswer,
          isCorrect: numStudent === correctAnswer
        };
      });
    });

    return Object.keys(calculations).length > 0 ? calculations : null;

  } catch (error) {
    console.error('수학 계산 오류:', error);
    return null;
  }
}

async function finalGrading(ocrText, calculation, ragContext, systemPrompt, temperature) {
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        detailedResults: [],
        overallFeedback: 'API 키가 설정되지 않았습니다.',
        strengths: '',
        improvements: ''
      };
    }

    let context = `이미지에서 읽은 내용:\n${ocrText}\n\n`;

    if (calculation) {
      context += `수학 계산 검증 결과:\n${JSON.stringify(calculation, null, 2)}\n\n`;
    }

    if (ragContext.length > 0) {
      context += `학원 지식 베이스 참고 자료:\n${ragContext.map(item => `- ${item}`).join('\n')}\n\n`;
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${context}\n\n위 내용을 바탕으로 숙제를 채점하고, 반드시 JSON 형식으로 응답해주세요.`
        }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: 2048
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      let responseText = result.candidates[0].content.parts[0].text;

      const jsonMatch = responseText.match(/```json\s*(.*?)\s*```/s);
      if (jsonMatch) {
        responseText = jsonMatch[1];
      }

      return JSON.parse(responseText);
    }

    return {
      totalQuestions: 0,
      correctAnswers: 0,
      detailedResults: [],
      overallFeedback: 'AI 응답을 받을 수 없습니다.',
      strengths: '',
      improvements: ''
    };

  } catch (error) {
    console.error('최종 채점 오류:', error);
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      detailedResults: [],
      overallFeedback: `채점 오류: ${error.message}`,
      strengths: '',
      improvements: ''
    };
  }
}
