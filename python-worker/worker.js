// ES Module 형식 Worker (Cloudflare AI + D1 + R2 + Vectorize 바인딩)
export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env, ctx);
  }
};

async function handleRequest(request, env, ctx) {
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
      version: '2.4.0',
      endpoints: {
        grade: 'POST /grade - 숙제 채점 (OCR + RAG + AI)',
        chat: 'POST /chat - AI 챗봇 (Cloudflare AI 번역 + Vectorize RAG)',
        'bot/upload-knowledge': 'POST /bot/upload-knowledge - AI 봇 지식 베이스 업로드 (자동 임베딩)',
        solve: 'POST /solve - 수학 문제 풀이 (방정식 및 계산)',
        'vectorize-upload': 'POST /vectorize-upload - Vectorize에 벡터 업로드',
        'generate-embedding': 'POST /generate-embedding - Cloudflare AI 임베딩 생성'
      }
    }), { headers: corsHeaders });
  }

  // 🆕 수학 문제 풀이 엔드포인트 (/solve)
  if (url.pathname === '/solve' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { equation, method = 'javascript' } = body;
      
      if (!equation) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'equation parameter is required' 
        }), { status: 400, headers: corsHeaders });
      }
      
      console.log(`📐 수학 문제 풀이 요청: ${equation}`);
      const result = solveMathProblem(equation.trim(), method);
      
      return new Response(JSON.stringify(result), { headers: corsHeaders });
    } catch (error) {
      console.error('❌ 수학 풀이 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }

  // 🆕 Cloudflare AI Embedding 생성 엔드포인트
  if (url.pathname === '/generate-embedding' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const { text } = body;

      if (!text) {
        return new Response(JSON.stringify({ 
          error: 'text is required' 
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      console.log(`🔧 임베딩 생성 요청: 텍스트 길이 ${text.length}자`);

      const embedding = await generateEmbedding(text, env);

      console.log(`✅ 임베딩 생성 완료: ${embedding.length}차원`);

      return new Response(JSON.stringify({
        success: true,
        embedding: embedding,
        dimensions: embedding.length
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('❌ 임베딩 생성 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }

  // 🆕 Vectorize 업로드 엔드포인트
  if (url.pathname === '/vectorize-upload' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
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

      if (!env.VECTORIZE) {
        throw new Error('VECTORIZE binding not configured');
      }

      // Vectorize에 벡터 삽입
      await env.VECTORIZE.insert(vectors);

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

  // 🆕 AI 봇 지식 베이스 업로드 엔드포인트
  if (url.pathname === '/bot/upload-knowledge' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const { botId, fileName, fileContent } = body;

      if (!botId || !fileName || !fileContent) {
        return new Response(JSON.stringify({ 
          error: 'botId, fileName, fileContent are required' 
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      console.log(`📤 지식 베이스 업로드: botId=${botId}, file=${fileName}, size=${fileContent.length}자`);

      // 1️⃣ 텍스트를 청크로 분할 (500자 단위)
      const chunks = [];
      const chunkSize = 500;
      for (let i = 0; i < fileContent.length; i += chunkSize) {
        chunks.push(fileContent.slice(i, i + chunkSize));
      }

      console.log(`📋 청크 분할 완료: ${chunks.length}개`);

      // 2️⃣ 각 청크에 대해 임베딩 생성 및 Vectorize 저장
      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // 임베딩 생성
        const embedding = await generateEmbedding(chunk, env);
        
        // Vectorize 벡터 포맷 (ID는 64바이트 이하로 제한)
        // botId 해시 생성 (더 짧은 ID)
        const botIdHash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(botId)
        ).then(buf => Array.from(new Uint8Array(buf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 16) // 16자로 축약
        );
        
        vectors.push({
          id: `${botIdHash}-${i}`, // 최대 약 20자
          values: embedding,
          metadata: {
            botId: botId,
            fileName: fileName,
            chunkIndex: i,
            text: chunk,
            totalChunks: chunks.length,
            uploadedAt: new Date().toISOString()
          }
        });
      }

      console.log(`✅ 임베딩 생성 완료: ${vectors.length}개`);

      // 3️⃣ Vectorize에 벡터 삽입
      if (!env.VECTORIZE) {
        throw new Error('VECTORIZE binding not configured');
      }

      await env.VECTORIZE.insert(vectors);

      console.log(`✅ Vectorize 업로드 완료: ${vectors.length}개 벡터`);

      return new Response(JSON.stringify({
        success: true,
        message: `지식 베이스 업로드 완료: ${chunks.length}개 청크`,
        chunks: chunks.length,
        vectors: vectors.length,
        embedding: 'Cloudflare AI (@cf/baai/bge-m3)',
        vectorIndex: 'knowledge-base-embeddings'
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('❌ 지식 베이스 업로드 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }

  // 🆕 AI 챗봇 RAG 엔드포인트
  if (url.pathname === '/chat' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
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
          translatedQuery = await translateWithCloudflareAI(message, env);
          console.log(`✅ 번역 완료: "${translatedQuery.substring(0, 50)}..."`);
        } catch (transError) {
          console.warn('⚠️ 번역 실패, 원문 사용:', transError.message);
        }
      }

      // 2️⃣ Vectorize RAG 검색
      let ragContext = [];
      let ragEnabled = false;
      
      if (enableRAG && botId && env.VECTORIZE) {
        try {
          console.log('🔍 Vectorize RAG 검색 시작...');
          console.log(`  botId: ${botId}`);
          
          // Cloudflare AI Embedding으로 임베딩 생성
          const queryEmbedding = await generateEmbedding(translatedQuery, env);
          console.log(`✅ 임베딩 생성 완료 (${queryEmbedding.length}차원)`);
          
          // Vectorize 검색 (필터 없이 전체 검색 후 애플리케이션 레벨에서 필터링)
          const searchResults = await env.VECTORIZE.query(queryEmbedding, {
            topK: Math.max(topK * 3, 50), // 최소 50개 검색
            returnMetadata: 'all'
          });
          
          if (searchResults.matches && searchResults.matches.length > 0) {
            // botId로 필터링 (애플리케이션 레벨)
            const filteredMatches = searchResults.matches.filter(match => 
              match.metadata && String(match.metadata.botId) === String(botId)
            ).slice(0, topK);
            
            if (filteredMatches.length > 0) {
              ragEnabled = true;
              ragContext = filteredMatches.map((match, idx) => ({
                text: match.metadata?.text || '',
                score: match.score?.toFixed(3) || 'N/A',
                fileName: match.metadata?.fileName || 'Unknown',
                index: idx + 1
              }));
            }
          }
        } catch (ragError) {
          console.error('❌ RAG 검색 실패:', ragError.message);
        }
      }

      // 3️⃣ RAG 컨텍스트 반환 (Gemini 호출은 Pages Functions에서 처리)
      console.log(`✅ RAG 검색 완료: ${ragContext.length}개 컨텍스트`);

      return new Response(JSON.stringify({
        success: true,
        ragEnabled,
        ragContext: ragContext,
        ragContextCount: ragContext.length,
        translatedQuery: translatedQuery !== message ? translatedQuery : null,
        message: 'RAG context retrieved successfully'
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('❌ AI 챗봇 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }

  if (url.pathname === '/grade' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
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
        const ocrText = await ocrWithGemini(imageBase64, env);
        const subject = detectSubject(ocrText);

        let calculation = null;
        if (subject === 'math') {
          calculation = calculateMath(ocrText);
        }

        const grading = await finalGrading(ocrText, calculation, [], systemPrompt, temperature, env);

        results.push({
          imageIndex: idx,
          ocrText,
          subject,
          calculation,
          ragContext: [],
          grading,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        results
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('❌ 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }

  // 🌐 AI 프록시 엔드포인트 (Cloudflare AI 우선 → Gemini fallback, 지역 제한 완전 우회)
  if (url.pathname === '/gemini-proxy' && request.method === 'POST') {
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const { 
        message, 
        systemPrompt = '', 
        conversationHistory = [], 
        model = 'gemini-1.5-flash',
        geminiApiKey
      } = body;

      if (!message) {
        return new Response(JSON.stringify({ error: 'message is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      console.log(`🤖 AI 프록시 요청: model=${model}, messageLen=${message.length}`);

      // OpenAI 호환 메시지 구성 (Cloudflare AI & Gemini 공통)
      const cfMessages = [];
      if (systemPrompt && systemPrompt.trim().length > 0) {
        cfMessages.push({ role: 'system', content: systemPrompt });
      }
      for (const msg of conversationHistory) {
        const text = msg.content || (msg.parts && msg.parts[0] && msg.parts[0].text) || '';
        if (text) {
          cfMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: text
          });
        }
      }
      cfMessages.push({ role: 'user', content: message });

      // ===== 1순위: Cloudflare AI 바인딩 (지역 제한 없음) =====
      if (env.AI) {
        try {
          console.log(`🔵 Cloudflare AI 호출 시도 (@cf/meta/llama-3.3-70b-instruct-fp8-fast)`);
          const cfResult = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
            messages: cfMessages,
            max_tokens: 4096,
            temperature: 0.9,
          });
          const cfText = cfResult?.response || cfResult?.result?.response;
          if (cfText && cfText.trim().length > 0) {
            console.log(`✅ Cloudflare AI 응답 완료: ${cfText.length}자`);
            return new Response(JSON.stringify({
              success: true,
              response: cfText,
              model: 'cloudflare-llama-3.3-70b',
              provider: 'cloudflare-ai'
            }), { headers: corsHeaders });
          }
        } catch (cfErr) {
          console.warn(`⚠️ Cloudflare AI 실패: ${cfErr.message}, Gemini로 fallback`);
        }
      }

      // ===== 2순위: Gemini API (Smart Placement로 미국/유럽 엣지에서 실행) =====
      const geminiKey = geminiApiKey || env.GOOGLE_GEMINI_API_KEY;
      if (geminiKey) {
        try {
          console.log(`🟡 Gemini API 호출 시도 (model=${model})`);

          // Gemini 형식으로 변환
          const contents = [];
          if (systemPrompt && systemPrompt.trim().length > 0) {
            contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
            contents.push({ role: 'model', parts: [{ text: '네, 이해했습니다. 그 역할을 수행하겠습니다.' }] });
          }
          for (const msg of conversationHistory) {
            const text = msg.content || (msg.parts && msg.parts[0] && msg.parts[0].text) || '';
            if (text) {
              contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text }]
              });
            }
          }
          contents.push({ role: 'user', parts: [{ text: message }] });

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 1.0, maxOutputTokens: 8192 }
            })
          });

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText) {
              console.log(`✅ Gemini 응답 완료: ${responseText.length}자`);
              return new Response(JSON.stringify({
                success: true,
                response: responseText,
                model,
                provider: 'gemini'
              }), { headers: corsHeaders });
            }
          } else {
            const errText = await geminiResponse.text();
            console.warn(`⚠️ Gemini API 오류 (${geminiResponse.status}): ${errText.substring(0, 100)}`);
          }
        } catch (gemErr) {
          console.warn(`⚠️ Gemini 호출 실패: ${gemErr.message}`);
        }
      }

      // ===== 3순위: Cloudflare AI 소형 모델 (최후 수단) =====
      if (env.AI) {
        try {
          console.log(`🔵 Cloudflare AI 소형 모델 시도 (@cf/meta/llama-3.1-8b-instruct)`);
          const cfResult2 = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: cfMessages,
            max_tokens: 2048,
            temperature: 0.9,
          });
          const cfText2 = cfResult2?.response || cfResult2?.result?.response;
          if (cfText2 && cfText2.trim().length > 0) {
            console.log(`✅ Cloudflare AI 소형 모델 응답: ${cfText2.length}자`);
            return new Response(JSON.stringify({
              success: true,
              response: cfText2,
              model: 'cloudflare-llama-3.1-8b',
              provider: 'cloudflare-ai-fallback'
            }), { headers: corsHeaders });
          }
        } catch (cfErr2) {
          console.error(`❌ Cloudflare AI 소형 모델도 실패: ${cfErr2.message}`);
        }
      }

      // 모두 실패
      return new Response(JSON.stringify({
        success: false,
        error: 'AI 서비스에 연결할 수 없습니다.'
      }), { status: 503, headers: corsHeaders });

    } catch (error) {
      console.error('❌ AI 프록시 오류:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: corsHeaders
  });
}

// 🌐 Cloudflare AI로 번역 (한글 → 영어)
async function translateWithCloudflareAI(text, env) {
  try {
    if (!env.AI) return text;
    const response = await env.AI.run('@cf/meta/m2m100-1.2b', {
      text: text,
      source_lang: 'ko',
      target_lang: 'en'
    });
    return response.translated_text || text;
  } catch (error) {
    return text;
  }
}

// 📝 Cloudflare AI Embedding 생성
async function generateEmbedding(text, env) {
  try {
    if (!env.AI) throw new Error('Cloudflare AI binding missing');
    const response = await env.AI.run('@cf/baai/bge-m3', {
      text: text
    });
    return response.data[0];
  } catch (error) {
    throw error;
  }
}

// 🤖 최종 AI 응답 생성 (Gemini)
async function generateChatResponse({ message, systemPrompt, conversationHistory, ragContext, ragEnabled }, env) {
  try {
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GOOGLE_GEMINI_API_KEY not found');
      return 'AI API 키가 설정되지 않았습니다.';
    }
    
    let enhancedSystemPrompt = systemPrompt || '당신은 친절하고 유능한 AI 선생님입니다.';
    if (ragEnabled && ragContext.length > 0) {
      enhancedSystemPrompt += `\n\n📚 **관련 지식 베이스 (RAG):**\n`;
      ragContext.forEach(item => {
        enhancedSystemPrompt += `\n[관련 지식 ${item.index}] (유사도: ${item.score}, 파일: ${item.fileName})\n${item.text}\n`;
      });
      enhancedSystemPrompt += `\n위 지식 베이스의 정보를 참고하여 질문에 정확하게 답변해주세요.`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // 올바른 contents 구조 (Gemini API는 첫 메시지가 반드시 user여야 함)
    const contents = [];
    
    // 대화 기록 추가
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }
    
    // 현재 메시지 추가 (systemPrompt 포함)
    const finalMessage = enhancedSystemPrompt + '\n\n사용자 질문: ' + message;
    contents.push({
      role: 'user',
      parts: [{ text: finalMessage }]
    });

    // 첫 메시지가 user가 아니면 조정
    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.unshift({
        role: 'user',
        parts: [{ text: '시작합니다.' }]
      });
    }

    console.log('📤 Gemini API 호출:', url.replace(/key=.+/, 'key=[HIDDEN]'));
    console.log('📝 Contents 수:', contents.length, '첫 role:', contents[0]?.role);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents,
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 2048 
        } 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API 오류:', response.status, errorText);
      return `Gemini API 오류: ${response.status}`;
    }
    
    const result = await response.json();
    console.log('✅ Gemini 응답 받음');
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('❌ generateChatResponse 오류:', error.message);
    return `AI 응답 생성 오류: ${error.message}`;
  }
}

// 📐 수학 문제 풀이 로직 (JavaScript 구현)
function solveMathProblem(equation, method) {
  const isEquation = equation.includes('=');
  if (isEquation) {
    return solveEquation(equation);
  } else {
    return calculateExpression(equation);
  }
}

function solveEquation(equation) {
  try {
    const [left, right] = equation.split('=').map(s => s.trim());
    const leftTokens = parseExpression(left);
    const rightValue = evaluateExpression(right);
    
    let aCoeff = 0; let bConst = 0;
    for (const token of leftTokens) {
      if (token.type === 'variable') aCoeff += token.coefficient || 1;
      else if (token.type === 'constant') bConst += token.value;
    }
    
    if (aCoeff === 0) return { success: false, error: 'No variable x found' };
    const solution = (rightValue - bConst) / aCoeff;
    
    return {
      success: true,
      result: solution.toString(),
      steps: [equation, `${aCoeff}x + ${bConst} = ${rightValue}`, `${aCoeff}x = ${rightValue - bConst}`, `x = ${solution}`],
      method: 'javascript-solver'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function parseExpression(expr) {
  const tokens = [];
  const pattern = /(\d+\.?\d*)|([a-z])|([+\-×÷*/])/gi;
  let matches = expr.replace(/\s/g, '').matchAll(pattern);
  let currentCoeff = 1; let currentSign = 1;
  
  for (const match of matches) {
    const [full, num, variable, operator] = match;
    if (num) currentCoeff = parseFloat(num);
    else if (variable) {
      tokens.push({ type: 'variable', variable: variable.toLowerCase(), coefficient: currentSign * currentCoeff });
      currentCoeff = 1;
    } else if (operator) {
      if (operator === '+') currentSign = 1;
      else if (operator === '-') currentSign = -1;
    }
  }
  return tokens;
}

function evaluateExpression(expr) {
  const cleaned = expr.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
  if (!/^[\d\+\-\*\/\(\)\.]+$/.test(cleaned)) throw new Error('Invalid characters');
  return eval(cleaned);
}

function calculateExpression(equation) {
  try {
    const result = evaluateExpression(equation);
    return { success: true, result: result.toString(), steps: [equation, `= ${result}`], method: 'javascript-solver' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function ocrWithGemini(imageBase64, env) {
  try {
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return 'OCR API 키가 설정되지 않았습니다.';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    let imageData = imageBase64.startsWith('data:image') ? imageBase64.split(',')[1] : imageBase64;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: '이미지의 텍스트를 추출하세요.' }, { inline_data: { mime_type: 'image/jpeg', data: imageData } }] }] })
    });
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '텍스트 추출 실패';
  } catch (error) { return `OCR 오류: ${error.message}`; }
}

function detectSubject(text) {
  const mathKeywords = ['=', '+', '-', '×', '÷', '/', '*', '방정식', '함수'];
  return mathKeywords.some(k => text.includes(k)) ? 'math' : 'other';
}

function calculateMath(text) { return null; }

async function finalGrading(ocrText, calculation, ragContext, systemPrompt, temperature, env) {
  return { totalQuestions: 0, correctAnswers: 0 };
}
