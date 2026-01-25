import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ GOOGLE_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: "AI 서비스가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Gemini API용 메시지 포맷 변환
    const geminiMessages: any[] = [];
    
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
    
    messages.forEach((msg: Message, index: number) => {
      if (msg.role === 'user') {
        // 첫 사용자 메시지에 시스템 프롬프트 포함
        const content = index === 0 && systemContext 
          ? `${systemContext}${msg.content}`
          : msg.content;
        
        geminiMessages.push({
          role: 'user',
          parts: [{ text: content }]
        });
      } else if (msg.role === 'assistant') {
        geminiMessages.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    });

    console.log('📝 Gemini 메시지 생성:', {
      messageCount: geminiMessages.length,
      hasSystemPrompt: !!systemPrompt,
      hasReferenceFiles: referenceFiles && Array.isArray(referenceFiles) && referenceFiles.length > 0,
      systemContextLength: systemContext.length
    });

    console.log('🚀 Google Gemini API 호출 시작...');
    console.log('🔑 API Key 존재:', !!process.env.GOOGLE_API_KEY);
    console.log('📨 요청 데이터:', JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }, null, 2));

    // Google Gemini API 호출
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    console.log('📡 Gemini API 응답 상태:', geminiResponse.status, geminiResponse.statusText);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("❌ Gemini API 오류 (전체):", errorText);
      let errorMessage = "AI 응답 생성에 실패했습니다.";
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error("❌ Gemini API 오류 (JSON):", errorJson);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        console.error("❌ JSON 파싱 실패");
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorText.substring(0, 500) },
        { status: 500 }
      );
    }

    const data = await geminiResponse.json();
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성할 수 없습니다.";

    console.log('✅ AI 응답 생성 성공:', response.substring(0, 100) + '...');

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("❌ 채팅 API 오류:", error);
    return NextResponse.json(
      { error: "메시지 전송에 실패했습니다." },
      { status: 500 }
    );
  }
}
