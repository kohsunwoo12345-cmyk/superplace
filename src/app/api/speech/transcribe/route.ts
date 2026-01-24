import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST: 음성을 텍스트로 변환 (Whisper API)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: '오디오 파일이 필요합니다' }, { status: 400 });
    }

    // OpenAI Whisper API 호출
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'ko'); // 한국어

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Whisper API 오류:', error);
      return NextResponse.json(
        { error: '음성 변환에 실패했습니다' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({ text: data.text }, { status: 200 });
  } catch (error) {
    console.error('음성 변환 오류:', error);
    return NextResponse.json(
      { error: '음성 변환 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
