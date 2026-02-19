// Cloudflare Pages Function for Text-to-Speech using Gemini API

interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { GEMINI_API_KEY } = context.env;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'TTS service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json() as any;
    const { text, voiceName = 'ko-KR-Wavenet-A' } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔊 TTS Request:', { text: text.substring(0, 100), voiceName });

    // Call Google Cloud Text-to-Speech API
    const ttsApiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    
    const requestBody = {
      input: { text },
      voice: {
        languageCode: voiceName.substring(0, 5), // Extract language code (e.g., "ko-KR")
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0,
      },
    };

    const response = await fetch(`${ttsApiUrl}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ TTS API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'TTS API failed',
          details: errorText 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json() as any;
    
    if (!data.audioContent) {
      console.error('❌ No audio content in response');
      return new Response(
        JSON.stringify({ error: 'No audio content received' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ TTS successful, audio length:', data.audioContent.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: data.audioContent, // Base64 encoded audio
        voiceName 
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
