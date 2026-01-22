import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Google Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '메시지를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Google Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Gemini Pro 모델 사용
    const model = genAI.getGenerativeModel({ 
      model: 'models/gemini-pro',
    });

    // 대화 히스토리를 Gemini 형식으로 변환
    const chatHistory = history?.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })) || [];

    // 채팅 세션 시작
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // 메시지 전송 및 응답 받기
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // 에러 메시지 상세화
    let errorMessage = 'AI 응답을 생성하는 중 오류가 발생했습니다.';
    
    if (error.message?.includes('API key')) {
      errorMessage = 'API 키가 유효하지 않습니다.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API 할당량이 초과되었습니다.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '응답 시간이 초과되었습니다. 다시 시도해주세요.';
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
