import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { gems } from '@/lib/gems/data';
import { prisma } from '@/lib/prisma';

// Google Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// 봇 정보 조회 (DB + 기본 봇)
async function getGemById(gemId: string) {
  // 1. 기본 봇에서 찾기
  const defaultGem = gems.find(g => g.id === gemId);
  if (defaultGem) {
    return defaultGem;
  }
  
  // 2. DB에서 찾기
  const dbBot = await prisma.aIBot.findFirst({
    where: {
      botId: gemId,
      isActive: true,
    },
    select: {
      botId: true,
      name: true,
      systemPrompt: true,
    },
  });
  
  if (dbBot) {
    return {
      id: dbBot.botId,
      name: dbBot.name,
      systemPrompt: dbBot.systemPrompt,
    };
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, gemId } = await request.json();

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

    // Gemini 2.0 Flash 모델 우선 시도, 실패 시 1.5 Pro로 Fallback
    const MODELS_TO_TRY = ['gemini-2.0-flash-exp', 'gemini-1.5-pro'];
    
    let model = null;
    let usedModel = '';
    
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[DEBUG] Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        // 간단한 테스트 호출로 모델이 작동하는지 확인
        usedModel = modelName;
        console.log(`[DEBUG] Successfully initialized model: ${modelName}`);
        break;
      } catch (error) {
        console.log(`[DEBUG] Model ${modelName} failed, trying next...`);
        continue;
      }
    }
    
    if (!model) {
      throw new Error('사용 가능한 Gemini 모델을 찾을 수 없습니다.');
    }

    // Gem별 시스템 프롬프트 적용
    let systemPrompt = '';
    if (gemId) {
      console.log('🔍 봇 ID:', gemId);
      const gem = await getGemById(gemId);
      console.log('✅ 봇 찾기 결과:', gem ? gem.name : '없음');
      if (gem) {
        systemPrompt = gem.systemPrompt;
        console.log('📝 시스템 프롬프트 길이:', systemPrompt.length);
      }
    }

    // 대화 히스토리를 Gemini 형식으로 변환
    const chatHistory = history?.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })) || [];

    // 시스템 프롬프트를 첫 메시지로 추가
    if (systemPrompt && chatHistory.length === 0) {
      chatHistory.unshift({
        role: 'user',
        parts: [{ text: '당신의 역할을 설명해주세요.' }],
      });
      chatHistory.push({
        role: 'model',
        parts: [{ text: systemPrompt }],
      });
    }

    // 채팅 세션 시작
    let chat;
    let result;
    let lastError = null;
    
    // 여러 모델을 순서대로 시도
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[DEBUG] Attempting chat with model: ${modelName}`);
        const testModel = genAI.getGenerativeModel({ model: modelName });
        
        chat = testModel.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          },
        });

        // 메시지 전송 및 응답 받기
        result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        
        console.log(`[DEBUG] Success with model: ${modelName}`);
        return NextResponse.json({ 
          response: text,
          model: modelName, // 디버깅용: 어떤 모델이 사용되었는지
        });
      } catch (error: any) {
        console.error(`[DEBUG] Model ${modelName} failed:`, error.message);
        lastError = error;
        continue; // 다음 모델 시도
      }
    }
    
    // 모든 모델이 실패한 경우
    throw lastError || new Error('모든 Gemini 모델이 실패했습니다.');
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    console.error('[DEBUG] Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      errorDetails: error.errorDetails,
    });
    
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
      { 
        error: errorMessage, 
        details: error.message,
        debugInfo: process.env.NODE_ENV === 'development' ? {
          apiKeyExists: !!process.env.GOOGLE_GEMINI_API_KEY,
          apiKeyPrefix: process.env.GOOGLE_GEMINI_API_KEY?.substring(0, 10) + '...',
        } : undefined
      },
      { status: 500 }
    );
  }
}
