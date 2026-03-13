--affaffb51011fc379d7eac8629d0babf0ec6d640b24cf4aba149734454d7
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
      version: "2.4.0",
      endpoints: {
        grade: "POST /grade - \uC219\uC81C \uCC44\uC810 (OCR + RAG + AI)",
        chat: "POST /chat - AI \uCC57\uBD07 (Cloudflare AI \uBC88\uC5ED + Vectorize RAG)",
        solve: "POST /solve - \uC218\uD559 \uBB38\uC81C \uD480\uC774 (\uBC29\uC815\uC2DD \uBC0F \uACC4\uC0B0)",
        "vectorize-upload": "POST /vectorize-upload - Vectorize\uC5D0 \uBCA1\uD130 \uC5C5\uB85C\uB4DC",
        "generate-embedding": "POST /generate-embedding - Cloudflare AI \uC784\uBCA0\uB529 \uC0DD\uC131"
      }
    }), { headers: corsHeaders });
  }
  if (url.pathname === "/solve" && request.method === "POST") {
    try {
      const body = await request.json();
      const { equation, method = "javascript" } = body;
      if (!equation) {
        return new Response(JSON.stringify({
          success: false,
          error: "equation parameter is required"
        }), { status: 400, headers: corsHeaders });
      }
      console.log(`\u{1F4D0} \uC218\uD559 \uBB38\uC81C \uD480\uC774 \uC694\uCCAD: ${equation}`);
      const result = solveMathProblem(equation.trim(), method);
      return new Response(JSON.stringify(result), { headers: corsHeaders });
    } catch (error) {
      console.error("\u274C \uC218\uD559 \uD480\uC774 \uC624\uB958:", error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
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
            topK: Math.max(topK * 3, 50),
            // 최소 50개 검색
            returnMetadata: "all"
          });
          if (searchResults.matches && searchResults.matches.length > 0) {
            const filteredMatches = searchResults.matches.filter(
              (match) => match.metadata && String(match.metadata.botId) === String(botId)
            ).slice(0, topK);
            if (filteredMatches.length > 0) {
              ragEnabled = true;
              ragContext = filteredMatches.map((match, idx) => ({
                text: match.metadata?.text || "",
                score: match.score?.toFixed(3) || "N/A",
                fileName: match.metadata?.fileName || "Unknown",
                index: idx + 1
              }));
            }
          }
        } catch (ragError) {
          console.error("\u274C RAG \uAC80\uC0C9 \uC2E4\uD328:", ragError.message);
        }
      }
      const aiResponse = await generateChatResponse({
        message,
        systemPrompt,
        conversationHistory,
        ragContext,
        ragEnabled
      }, env);
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
        error: error.message
      }), { status: 500, headers: corsHeaders });
    }
  }
  if (url.pathname === "/grade" && request.method === "POST") {
    const apiKey = request.headers.get("X-API-Key");
    const expectedKey = env.WORKER_API_KEY || env.API_KEY;
    const validKeys = [
      expectedKey,
      'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u', // Pages API Key
      'xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb'  // Workers API Token
    ].filter(Boolean);
    
    if (!apiKey || !validKeys.includes(apiKey)) {
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
        const ocrText = await ocrWithGemini(imageBase64, env);
        const subject = detectSubject(ocrText);
        let calculation = null;
        if (subject === "math") {
          calculation = calculateMath(ocrText);
        }
        const grading = await finalGrading(ocrText, calculation, [], systemPrompt, temperature, env);
        results.push({
          imageIndex: idx,
          ocrText,
          subject,
          calculation,
          ragContext: [],
          grading
        });
      }
      return new Response(JSON.stringify({
        success: true,
        results
      }), { headers: corsHeaders });
    } catch (error) {
      console.error("\u274C \uC624\uB958:", error.message);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
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
    if (!env.AI) return text;
    const response = await env.AI.run("@cf/meta/m2m100-1.2b", {
      text,
      source_lang: "ko",
      target_lang: "en"
    });
    return response.translated_text || text;
  } catch (error) {
    return text;
  }
}
__name(translateWithCloudflareAI, "translateWithCloudflareAI");
async function generateEmbedding(text, env) {
  try {
    if (!env.AI) throw new Error("Cloudflare AI binding missing");
    const response = await env.AI.run("@cf/baai/bge-m3", {
      text
    });
    return response.data[0];
  } catch (error) {
    throw error;
  }
}
__name(generateEmbedding, "generateEmbedding");
async function generateChatResponse({ message, systemPrompt, conversationHistory, ragContext, ragEnabled }, env) {
  try {
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return "AI API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";
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
    const contents = [{ parts: [{ text: enhancedSystemPrompt }] }];
    conversationHistory.forEach((msg) => contents.push({ parts: [{ text: msg.role === "user" ? `\uC0AC\uC6A9\uC790: ${msg.content}` : `AI: ${msg.content}` }] }));
    contents.push({ parts: [{ text: `\uC0AC\uC6A9\uC790: ${message}` }] });
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } })
    });
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "AI \uC751\uB2F5\uC744 \uC0DD\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.";
  } catch (error) {
    return "AI \uC751\uB2F5 \uC0DD\uC131 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.";
  }
}
__name(generateChatResponse, "generateChatResponse");
function solveMathProblem(equation, method) {
  const isEquation = equation.includes("=");
  if (isEquation) {
    return solveEquation(equation);
  } else {
    return calculateExpression(equation);
  }
}
__name(solveMathProblem, "solveMathProblem");
function solveEquation(equation) {
  try {
    const [left, right] = equation.split("=").map((s) => s.trim());
    const leftTokens = parseExpression(left);
    const rightValue = evaluateExpression(right);
    let aCoeff = 0;
    let bConst = 0;
    for (const token of leftTokens) {
      if (token.type === "variable") aCoeff += token.coefficient || 1;
      else if (token.type === "constant") bConst += token.value;
    }
    if (aCoeff === 0) return { success: false, error: "No variable x found" };
    const solution = (rightValue - bConst) / aCoeff;
    return {
      success: true,
      result: solution.toString(),
      steps: [equation, `${aCoeff}x + ${bConst} = ${rightValue}`, `${aCoeff}x = ${rightValue - bConst}`, `x = ${solution}`],
      method: "javascript-solver"
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
__name(solveEquation, "solveEquation");
function parseExpression(expr2) {
  const tokens = [];
  const pattern = /(\d+\.?\d*)|([a-z])|([+\-×÷*/])/gi;
  let matches = expr2.replace(/\s/g, "").matchAll(pattern);
  let currentCoeff = 1;
  let currentSign = 1;
  for (const match of matches) {
    const [full, num, variable, operator] = match;
    if (num) currentCoeff = parseFloat(num);
    else if (variable) {
      tokens.push({ type: "variable", variable: variable.toLowerCase(), coefficient: currentSign * currentCoeff });
      currentCoeff = 1;
    } else if (operator) {
      if (operator === "+") currentSign = 1;
      else if (operator === "-") currentSign = -1;
    }
  }
  return tokens;
}
__name(parseExpression, "parseExpression");
function evaluateExpression(expr) {
  const cleaned = expr.replace(/\s/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
  if (!/^[\d\+\-\*\/\(\)\.]+$/.test(cleaned)) throw new Error("Invalid characters");
  return eval(cleaned);
}
__name(evaluateExpression, "evaluateExpression");
function calculateExpression(equation) {
  try {
    const result = evaluateExpression(equation);
    return { success: true, result: result.toString(), steps: [equation, `= ${result}`], method: "javascript-solver" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
__name(calculateExpression, "calculateExpression");
async function ocrWithGemini(imageBase64, env) {
  try {
    const apiKey = env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return "OCR API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    let imageData = imageBase64.startsWith("data:image") ? imageBase64.split(",")[1] : imageBase64;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "\uC774\uBBF8\uC9C0\uC758 \uD14D\uC2A4\uD2B8\uB97C \uCD94\uCD9C\uD558\uC138\uC694." }, { inline_data: { mime_type: "image/jpeg", data: imageData } }] }] })
    });
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "\uD14D\uC2A4\uD2B8 \uCD94\uCD9C \uC2E4\uD328";
  } catch (error) {
    return `OCR \uC624\uB958: ${error.message}`;
  }
}
__name(ocrWithGemini, "ocrWithGemini");
function detectSubject(text) {
  const mathKeywords = ["=", "+", "-", "\xD7", "\xF7", "/", "*", "\uBC29\uC815\uC2DD", "\uD568\uC218"];
  return mathKeywords.some((k) => text.includes(k)) ? "math" : "other";
}
__name(detectSubject, "detectSubject");
function calculateMath(text) {
  return null;
}
__name(calculateMath, "calculateMath");
async function finalGrading(ocrText, calculation, ragContext, systemPrompt, temperature, env) {
  return { totalQuestions: 0, correctAnswers: 0 };
}
__name(finalGrading, "finalGrading");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map

--affaffb51011fc379d7eac8629d0babf0ec6d640b24cf4aba149734454d7--
