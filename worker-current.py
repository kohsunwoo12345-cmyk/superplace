--f1f6e6673affe6cc80e2e0967c246a23daf65f214588a216bcb8af54c54a
Content-Disposition: form-data; name="worker.js"

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env, ctx);
  }
};
async function handleRequest(request, env, ctx) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  const url = new URL(request.url);
  if (url.pathname === "/" || url.pathname === "") {
    return new Response(JSON.stringify({
      status: "ok",
      message: "AI \uCC57\uBD07 & \uC219\uC81C \uCC44\uC810 Worker\uAC00 \uC815\uC0C1 \uC791\uB3D9 \uC911\uC785\uB2C8\uB2E4",
      version: "2.3.0",
      endpoints: {
        grade: "POST /grade - \uC219\uC81C \uCC44\uC810 (OCR + RAG + AI)",
        chat: "POST /chat - AI \uCC57\uBD07 (Cloudflare AI \uBC88\uC5ED + Vectorize RAG)",
        "vectorize-upload": "POST /vectorize-upload - Vectorize\uC5D0 \uBCA1\uD130 \uC5C5\uB85C\uB4DC",
        "generate-embedding": "POST /generate-embedding - Cloudflare AI \uC784\uBCA0\uB529 \uC0DD\uC131"
      }
    }), { headers: corsHeaders });
  }
  if (url.pathname === "/generate-embedding" && request.method === "POST") {
    const apiKey = request.headers.get("X-API-Key");
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders
      });
    }
    try {
      const body = await request.json();
      const { text } = body;
      if (!text) {
        return new Response(JSON.stringify({
          error: "text is required"
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      console.log(`\u{1F527} \uC784\uBCA0\uB529 \uC0DD\uC131 \uC694\uCCAD: \uD14D\uC2A4\uD2B8 \uAE38\uC774 ${text.length}\uC790`);
      const embedding = await generateEmbedding(text, env);
      console.log(`\u2705 \uC784\uBCA0\uB529 \uC0DD\uC131 \uC644\uB8CC: ${embedding.length}\uCC28\uC6D0`);
      return new Response(JSON.stringify({
        success: true,
        embedding,
        dimensions: embedding.length
      }), { headers: corsHeaders });
    } catch (error) {
      console.error("\u274C \uC784\uBCA0\uB529 \uC0DD\uC131 \uC624\uB958:", error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }
  if (url.pathname === "/vectorize-upload" && request.method === "POST") {
    const apiKey = request.headers.get("X-API-Key");
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders
      });
    }
    try {
      const body = await request.json();
      const { vectors } = body;
      if (!vectors || !Array.isArray(vectors)) {
        return new Response(JSON.stringify({
          error: "vectors array is required"
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      console.log(`\u{1F4E4} Vectorize \uC5C5\uB85C\uB4DC: ${vectors.length}\uAC1C \uBCA1\uD130`);
      if (!env.VECTORIZE) {
        throw new Error("VECTORIZE binding not configured");
      }
      await env.VECTORIZE.insert(vectors);
      console.log(`\u2705 Vectorize \uC5C5\uB85C\uB4DC \uC644\uB8CC: ${vectors.length}\uAC1C`);
      return new Response(JSON.stringify({
        success: true,
        message: `${vectors.length}\uAC1C \uBCA1\uD130\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC5C5\uB85C\uB4DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4`,
        count: vectors.length
      }), { headers: corsHeaders });
    } catch (error) {
      console.error("\u274C Vectorize \uC5C5\uB85C\uB4DC \uC624\uB958:", error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }
  if (url.pathname === "/chat" && request.method === "POST") {
    const apiKey = request.headers.get("X-API-Key");
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
        systemPrompt = "",
        conversationHistory = []
      } = body;
      console.log(`\u{1F4AC} AI \uCC57\uBD07 \uC694\uCCAD: botId=${botId}, userId=${userId}, message="${message.substring(0, 50)}..."`);
      let translatedQuery = message;
      if (enableRAG && /[가-힣]/.test(message)) {
        try {
          console.log("\u{1F310} Cloudflare AI\uB85C \uBC88\uC5ED \uC911...");
          translatedQuery = await translateWithCloudflareAI(message, env);
          console.log(`\u2705 \uBC88\uC5ED \uC644\uB8CC: "${translatedQuery.substring(0, 50)}..."`);
        } catch (transError) {
          console.warn("\u26A0\uFE0F \uBC88\uC5ED \uC2E4\uD328, \uC6D0\uBB38 \uC0AC\uC6A9:", transError.message);
        }
      }
      let ragContext = [];
      let ragEnabled = false;
      if (enableRAG && botId && env.VECTORIZE) {
        try {
          console.log("\u{1F50D} Vectorize RAG \uAC80\uC0C9 \uC2DC\uC791...");
          console.log(`  botId: ${botId}`);
          const queryEmbedding = await generateEmbedding(translatedQuery, env);
          console.log(`\u2705 \uC784\uBCA0\uB529 \uC0DD\uC131 \uC644\uB8CC (${queryEmbedding.length}\uCC28\uC6D0)`);
          const searchResults = await env.VECTORIZE.query(queryEmbedding, {
            topK: topK * 3,
            // 더 많이 가져와서 필터링
            returnMetadata: "all"
          });
          console.log(`  \uAC80\uC0C9 \uACB0\uACFC: ${searchResults.matches?.length || 0}\uAC1C`);
          if (searchResults.matches && searchResults.matches.length > 0) {
            const filteredMatches = searchResults.matches.filter(
              (match) => match.metadata && String(match.metadata.botId) === String(botId)
            ).slice(0, topK);
            console.log(`  \uD544\uD130\uB9C1 \uD6C4: ${filteredMatches.length}\uAC1C`);
            if (filteredMatches.length > 0) {
              ragEnabled = true;
              ragContext = filteredMatches.map((match, idx) => ({
                text: match.metadata?.text || "",
                score: match.score?.toFixed(3) || "N/A",
                fileName: match.metadata?.fileName || "Unknown",
                index: idx + 1
              }));
              console.log(`\u2705 RAG \uAC80\uC0C9 \uC644\uB8CC: ${ragContext.length}\uAC1C \uAD00\uB828 \uCCAD\uD06C \uBC1C\uACAC`);
            } else {
              console.log("\u{1F4ED} \uD574\uB2F9 botId\uC5D0 \uB300\uD55C \uC9C0\uC2DD \uC5C6\uC74C");
            }
          } else {
            console.log("\u{1F4ED} \uAD00\uB828 \uC9C0\uC2DD \uC5C6\uC74C");
          }
        } catch (ragError) {
          console.error("\u274C RAG \uAC80\uC0C9 \uC2E4\uD328:", ragError.message);
          console.error("  \uC0C1\uC138:", ragError.stack);
        }
      }
      const aiResponse = await generateChatResponse({
        message,
        systemPrompt,
        conversationHistory,
        ragContext,
        ragEnabled
      }, env);
      console.log(`\u2705 AI \uC751\uB2F5 \uC0DD\uC131 \uC644\uB8CC (${aiResponse.length}\uC790)`);
      return new Response(JSON.stringify({
        success: true,
        response: aiResponse,
        ragEnabled,
        ragContextCount: ragContext.length,
        translatedQuery: translatedQuery !== message ? translatedQuery : null
      }), { headers: corsHeaders });
    } catch (error) {
      console.error("\u274C AI \uCC57\uBD07 \uC624\uB958:", error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), { status: 500, headers: corsHeaders });
    }
  }
  if (url.pathname === "/grade" && request.method === "POST") {
    const apiKey = request.headers.get("X-API-Key");
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders
      });
    }
    try {
      const body = await request.json();
      const { images = [], userId, userName = "\uD559\uC0DD", systemPrompt = "", model = "gemini-2.5-flash", temperature = 0.3, enableRAG = false, academyId } = body;
      console.log(`\u{1F4DA} \uCC44\uC810 \uC2DC\uC791: ${userName} (${userId}), \uC774\uBBF8\uC9C0 ${images.length}\uC7A5`);
      const results = [];
      for (let idx = 0; idx < images.length; idx++) {
        const imageBase64 = images[idx];
        console.log(`\u{1F4C4} \uC774\uBBF8\uC9C0 ${idx + 1}/${images.length} \uCC98\uB9AC \uC911...`);
        const ocrText = await ocrWithGemini(imageBase64, env);
        console.log(`\u2705 OCR \uC644\uB8CC: ${ocrText.length} \uAE00\uC790`);
        const subject = detectSubject(ocrText);
        console.log(`\u2705 \uACFC\uBAA9 \uAC10\uC9C0: ${subject}`);
        let calculation = null;
        if (subject === "math") {
          calculation = calculateMath(ocrText);
          console.log(`\u2705 \uC218\uD559 \uACC4\uC0B0 \uC644\uB8CC`);
        }
        const grading = await finalGrading(ocrText, calculation, [], systemPrompt, temperature, env);
        console.log(`\u2705 \uCC44\uC810 \uC644\uB8CC: ${grading.correctAnswers}/${grading.totalQuestions} \uC815\uB2F5`);
        results.push({
          imageIndex: idx,
          ocrText,
          subject,
          calculation,
          ragContext: [],
          grading
        });
      }
      console.log(`\u{1F389} \uC804\uCCB4 \uCC44\uC810 \uC644\uB8CC: ${results.length}\uAC1C \uC774\uBBF8\uC9C0`);
      return new Response(JSON.stringify({
        success: true,
        results
      }), { headers: corsHeaders });
    } catch (error) {
      console.error("\u274C \uC624\uB958:", error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), { status: 500, headers: corsHeaders });
    }
  }
  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: corsHeaders
  });
}
__name(handleRequest, "handleRequest");
async function translateWithCloudflareAI(text, env) {
  try {
    if (!env.AI) {
      console.warn("\u26A0\uFE0F Cloudflare AI binding \uC5C6\uC74C");
      return text;
    }
    const response = await env.AI.run("@cf/meta/m2m100-1.2b", {
      text,
      source_lang: "ko",
      target_lang: "en"
    });
    return response.translated_text || text;
  } catch (error) {
    console.error("\u274C \uBC88\uC5ED \uC624\uB958:", error);
    return text;
  }
}
__name(translateWithCloudflareAI, "translateWithCloudflareAI");
async function generateEmbedding(text, env) {
  try {
    if (!env.AI) {
      throw new Error("Cloudflare AI binding\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    console.log(`\u{1F527} Cloudflare AI Embedding \uC0DD\uC131 \uC2DC\uC791 (\uD14D\uC2A4\uD2B8 \uAE38\uC774: ${text.length}\uC790)`);
    const response = await env.AI.run("@cf/baai/bge-large-en-v1.5", {
      text
    });
    if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error("Cloudflare AI\uAC00 \uC720\uD6A8\uD55C \uC784\uBCA0\uB529\uC744 \uBC18\uD658\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    const embedding = response.data[0];
    console.log(`\u2705 Cloudflare AI Embedding \uC0DD\uC131 \uC644\uB8CC (${embedding.length}\uCC28\uC6D0)`);
    return embedding;
  } catch (error) {
    console.error("\u274C Cloudflare AI Embedding \uC0DD\uC131 \uC624\uB958:", error);
    throw error;
  }
}
__name(generateEmbedding, "generateEmbedding");
async function generateChatResponse({ message, systemPrompt, conversationHistory, ragContext, ragEnabled }, env) {
  try {
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return "AI API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";
    }
    let enhancedSystemPrompt = systemPrompt || "\uB2F9\uC2E0\uC740 \uCE5C\uC808\uD558\uACE0 \uC720\uB2A5\uD55C AI \uC120\uC0DD\uB2D8\uC785\uB2C8\uB2E4.";
    if (ragEnabled && ragContext.length > 0) {
      enhancedSystemPrompt += `

\u{1F4DA} **\uAD00\uB828 \uC9C0\uC2DD \uBCA0\uC774\uC2A4 (RAG):**
`;
      ragContext.forEach((item) => {
        enhancedSystemPrompt += `
[\uAD00\uB828 \uC9C0\uC2DD ${item.index}] (\uC720\uC0AC\uB3C4: ${item.score}, \uD30C\uC77C: ${item.fileName})
${item.text}
`;
      });
      enhancedSystemPrompt += `
\uC704 \uC9C0\uC2DD \uBCA0\uC774\uC2A4\uC758 \uC815\uBCF4\uB97C \uCC38\uACE0\uD558\uC5EC \uC9C8\uBB38\uC5D0 \uC815\uD655\uD558\uAC8C \uB2F5\uBCC0\uD574\uC8FC\uC138\uC694.`;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const contents = [];
    contents.push({
      parts: [{ text: enhancedSystemPrompt }]
    });
    conversationHistory.forEach((msg) => {
      contents.push({
        parts: [{ text: msg.role === "user" ? `\uC0AC\uC6A9\uC790: ${msg.content}` : `AI: ${msg.content}` }]
      });
    });
    contents.push({
      parts: [{ text: `\uC0AC\uC6A9\uC790: ${message}` }]
    });
    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Gemini API \uC624\uB958: ${response.status}`);
    }
    const result = await response.json();
    if (result.candidates && result.candidates.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }
    return "AI \uC751\uB2F5\uC744 \uC0DD\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.";
  } catch (error) {
    console.error("\u274C AI \uC751\uB2F5 \uC0DD\uC131 \uC624\uB958:", error);
    return `\uC624\uB958: ${error.message}`;
  }
}
__name(generateChatResponse, "generateChatResponse");
async function ocrWithGemini(imageBase64, env) {
  try {
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return "OCR API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    let imageData = imageBase64;
    if (imageBase64.startsWith("data:image")) {
      imageData = imageBase64.split(",")[1];
    }
    const payload = {
      contents: [{
        parts: [
          { text: "\uC774 \uC774\uBBF8\uC9C0\uC758 \uBAA8\uB4E0 \uD14D\uC2A4\uD2B8\uC640 \uC218\uC2DD\uC744 \uC815\uD655\uD558\uAC8C \uC77D\uC5B4\uC11C \uADF8\uB300\uB85C \uD14D\uC2A4\uD2B8\uB85C \uBCC0\uD658\uD574\uC8FC\uC138\uC694. \uC218\uD559 \uC218\uC2DD, \uC190\uAE00\uC528, \uD504\uB9B0\uD2B8\uB41C \uD14D\uC2A4\uD2B8 \uBAA8\uB450 \uD3EC\uD568\uD574\uC8FC\uC138\uC694." },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageData
            }
          }
        ]
      }]
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.candidates && result.candidates.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }
    return "\uD14D\uC2A4\uD2B8\uB97C \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.";
  } catch (error) {
    console.error("OCR \uC624\uB958:", error);
    return `OCR \uC624\uB958: ${error.message}`;
  }
}
__name(ocrWithGemini, "ocrWithGemini");
function detectSubject(text) {
  const mathKeywords = ["=", "+", "-", "\xD7", "\xF7", "/", "*", "\uBC29\uC815\uC2DD", "\uD568\uC218", "\uBBF8\uBD84", "\uC801\uBD84", "\uAE30\uD558", "\uB300\uC218", "\uC0BC\uAC01", "sin", "cos", "tan", "\xB2", "\xB3", "\u221A"];
  const englishKeywords = ["be\uB3D9\uC0AC", "\uC870\uB3D9\uC0AC", "\uC2DC\uC81C", "\uBB38\uBC95", "\uC5B4\uBC95", "grammar", "the", "is", "are", "was", "were", "have", "has"];
  const mathScore = mathKeywords.filter((k) => text.includes(k)).length;
  const englishScore = englishKeywords.filter((k) => text.toLowerCase().includes(k.toLowerCase())).length;
  if (mathScore > englishScore) return "math";
  if (englishScore > mathScore) return "english";
  return "other";
}
__name(detectSubject, "detectSubject");
function calculateMath(text) {
  try {
    const calculations = {};
    const patterns = [
      /(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/g,
      /(\d+)\s*-\s*(\d+)\s*=\s*(\d+)/g,
      /(\d+)\s*×\s*(\d+)\s*=\s*(\d+)/g,
      /(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)/g
    ];
    patterns.forEach((pattern) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match) => {
        const [full, a, b, studentAnswer] = match;
        const numA = parseInt(a);
        const numB = parseInt(b);
        const numStudent = parseInt(studentAnswer);
        let correctAnswer;
        if (full.includes("+")) correctAnswer = numA + numB;
        else if (full.includes("-")) correctAnswer = numA - numB;
        else if (full.includes("\xD7")) correctAnswer = numA * numB;
        else if (full.includes("\xF7")) correctAnswer = numB !== 0 ? Math.floor(numA / numB) : 0;
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
    console.error("\uC218\uD559 \uACC4\uC0B0 \uC624\uB958:", error);
    return null;
  }
}
__name(calculateMath, "calculateMath");
async function finalGrading(ocrText, calculation, ragContext, systemPrompt, temperature, env) {
  try {
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        detailedResults: [],
        overallFeedback: "API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
        strengths: "",
        improvements: ""
      };
    }
    let context = `\uC774\uBBF8\uC9C0\uC5D0\uC11C \uC77D\uC740 \uB0B4\uC6A9:
${ocrText}

`;
    if (calculation) {
      context += `\uC218\uD559 \uACC4\uC0B0 \uAC80\uC99D \uACB0\uACFC:
${JSON.stringify(calculation, null, 2)}

`;
    }
    if (ragContext.length > 0) {
      context += `\uD559\uC6D0 \uC9C0\uC2DD \uBCA0\uC774\uC2A4 \uCC38\uACE0 \uC790\uB8CC:
${ragContext.map((item) => `- ${item}`).join("\n")}

`;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{
          text: `${systemPrompt}

${context}

\uC704 \uB0B4\uC6A9\uC744 \uBC14\uD0D5\uC73C\uB85C \uC219\uC81C\uB97C \uCC44\uC810\uD558\uACE0, \uBC18\uB4DC\uC2DC JSON \uD615\uC2DD\uC73C\uB85C \uC751\uB2F5\uD574\uC8FC\uC138\uC694.`
        }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: 2048
      }
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      overallFeedback: "AI \uC751\uB2F5\uC744 \uBC1B\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
      strengths: "",
      improvements: ""
    };
  } catch (error) {
    console.error("\uCD5C\uC885 \uCC44\uC810 \uC624\uB958:", error);
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      detailedResults: [],
      overallFeedback: `\uCC44\uC810 \uC624\uB958: ${error.message}`,
      strengths: "",
      improvements: ""
    };
  }
}
__name(finalGrading, "finalGrading");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map

--f1f6e6673affe6cc80e2e0967c246a23daf65f214588a216bcb8af54c54a--
