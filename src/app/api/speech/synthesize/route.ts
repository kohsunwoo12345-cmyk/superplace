import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST: 텍스트를 음성으로 변환 (OpenAI TTS)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '텍스트가 필요합니다' }, { status: 400 });
    }

    // 텍스트가 너무 길면 잘라내기 (4096자 제한)
    const truncatedText = text.slice(0, 4096);

    // OpenAI TTS API 호출
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // 또는 'tts-1-hd' (고품질)
        input: truncatedText,
        voice: 'alloy', // alloy, echo, fable, onyx, nova, shimmer
        speed: 1.0, // 0.25 ~ 4.0
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('TTS API 오류:', error);
      return NextResponse.json(
        { error: '음성 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // 오디오 스트림을 Buffer로 변환
    const audioBuffer = await response.arrayBuffer();

    // MP3 형식으로 반환
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('음성 생성 오류:', error);
    return NextResponse.json(
      { error: '음성 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
