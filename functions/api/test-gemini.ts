import type { PagesFunction } from "@cloudflare/workers-types";

interface Env {
  GOOGLE_GEMINI_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GOOGLE_GEMINI_API_KEY;
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : "N/A",
    environment: "Cloudflare Pages Functions",
  };
  
  // 실제 Gemini API 호출 테스트
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "API key is missing",
        diagnostics,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  
  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const testResponse = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "안녕하세요" }]
          }
        ]
      }),
    });
    
    const responseData = await testResponse.json();
    
    return new Response(
      JSON.stringify({
        success: testResponse.ok,
        status: testResponse.status,
        statusText: testResponse.statusText,
        responseData,
        diagnostics,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        diagnostics,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
