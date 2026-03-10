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
      message: '숙제 채점 Worker가 정상 작동 중입니다',
      version: '1.0.0',
      endpoints: {
        grade: 'POST /grade - 숙제 채점'
      }
    }), { headers: corsHeaders });
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
