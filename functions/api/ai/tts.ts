// Cloudflare Pages Function for Text-to-Speech using Web Speech API fallback

interface Env {
  ELEVENLABS_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { text, voiceName = 'ko-KR-Wavenet-A' } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔊 TTS Request:', { text: text.substring(0, 100), voiceName });

    // 브라우저 내장 Web Speech API를 사용하도록 클라이언트에 지시
    // 서버에서 직접 생성하지 않고 클라이언트에서 처리
    return new Response(
      JSON.stringify({ 
        success: true,
        useClientTTS: true, // 클라이언트 측 TTS 사용 플래그
        text: text,
        voiceName: voiceName,
        message: 'Use client-side TTS'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ TTS error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'TTS generation failed',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
