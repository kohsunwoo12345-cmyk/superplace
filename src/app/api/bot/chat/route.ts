import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { botId, messages, systemPrompt, referenceFiles } = body;

    console.log('💬 AI 채팅 요청:', { 
      botId, 
      messageCount: messages?.length,
      hasSystemPrompt: !!systemPrompt,
      hasReferenceFiles: !!referenceFiles,
      userId: session.user.id
    });

    if (!botId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 권한 체크: 관리자가 아닌 경우 할당 여부 확인
    if (session.user.role !== "SUPER_ADMIN") {
      const assignment = await prisma.botAssignment.findFirst({
        where: {
          userId: session.user.id,
          botId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      console.log('🔐 채팅 권한 체크:', assignment ? '할당됨' : '할당 안됨');

      if (!assignment) {
        return NextResponse.json(
          { error: "이 봇에 대한 접근 권한이 없습니다." },
          { status: 403 }
        );
      }
    }

    // Google Gemini API 키 확인
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.');
      console.error('환경변수 체크:', {
        GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
        GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
      });
      return NextResponse.json(
        { error: "AI 서비스가 설정되지 않았습니다." },
        { status: 500 }
      );
    }
    
    console.log('✅ API Key 발견:', apiKey.substring(0, 10) + '...');
    console.log('🔑 API Key 길이:', apiKey.length);

    // Google Generative AI 초기화
    const genAI = new GoogleGenerativeAI(apiKey);

    // 대화 히스토리를 Gemini 형식으로 변환
    const chatHistory: any[] = [];
    
    // 시스템 프롬프트 + 지식 파일 컨텍스트 구성
    let systemContext = '';
    
    if (systemPrompt) {
      systemContext += `${systemPrompt}\n\n`;
    }
    
    if (referenceFiles && Array.isArray(referenceFiles) && referenceFiles.length > 0) {
      systemContext += `참고 자료:\n`;
      referenceFiles.forEach((file: any) => {
        if (typeof file === 'string') {
          systemContext += `- ${file}\n`;
        } else if (file.name && file.url) {
          systemContext += `- ${file.name}: ${file.url}\n`;
        }
      });
      systemContext += '\n위 참고 자료를 기반으로 답변해주세요.\n\n';
    }
    
    // 시스템 프롬프트를 히스토리 첫부분에 추가
    if (systemContext && messages.length > 0) {
      chatHistory.push({
        role: 'user',
        parts: [{ text: '당신의 역할을 설명해주세요.' }],
      });
      chatHistory.push({
        role: 'model',
        parts: [{ text: systemContext }],
      });
    }
    
    // 기존 메시지 추가 (마지막 메시지 제외)
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      chatHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    console.log('📝 Gemini 메시지 생성:', {
      historyLength: chatHistory.length,
      hasSystemPrompt: !!systemPrompt,
      hasReferenceFiles: referenceFiles && Array.isArray(referenceFiles) && referenceFiles.length > 0,
      systemContextLength: systemContext.length
    });

    console.log('🚀 Google Gemini API 호출 시작 (SDK 방식)...');

    try {
      // 모델 초기화 (gemini-2.0-flash-exp 시도, 실패시 gemini-1.5-flash)
      const MODELS_TO_TRY = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      
      let response = null;
      let usedModel = '';
      
      for (const modelName of MODELS_TO_TRY) {
        try {
          console.log(`🧪 모델 시도: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
            },
          });

          // 마지막 사용자 메시지 전송
          const lastMessage = messages[messages.length - 1];
          const result = await chat.sendMessage(lastMessage.content);
          response = await result.response;
          usedModel = modelName;
          
          console.log(`✅ ${modelName} 모델로 응답 생성 성공`);
          break;
        } catch (error: any) {
          console.error(`❌ ${modelName} 실패:`, error.message);
          if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
            throw error; // 마지막 모델도 실패하면 에러 throw
          }
          continue;
        }
      }
      
      if (!response) {
        throw new Error('모든 Gemini 모델이 실패했습니다.');
      }
      
      const text = response.text();
      console.log('✅ AI 응답 생성 성공:', text.substring(0, 100) + '...');
      console.log('🎯 사용된 모델:', usedModel);

      return NextResponse.json({
        success: true,
        response: text,
        model: usedModel,
      });
    } catch (error: any) {
      console.error("❌ Gemini API 오류:", error);
      console.error("❌ 에러 상세:", {
        message: error.message,
        stack: error.stack,
      });
      
      let errorMessage = "AI 응답 생성에 실패했습니다.";
      
      if (error.message?.includes('API key')) {
        errorMessage = 'API 키가 유효하지 않습니다.';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'API 할당량이 초과되었습니다.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '응답 시간이 초과되었습니다.';
      }
      
      return NextResponse.json(
        { error: errorMessage, details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ 채팅 API 전체 오류:", error);
    return NextResponse.json(
      { error: "메시지 전송에 실패했습니다.", details: error.message },
      { status: 500 }
    );
  }
}
