import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const { botId, messages, systemPrompt } = body;

    if (!botId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // OpenAI API 호출을 위한 메시지 포맷 변환
    const apiMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 시스템 프롬프트가 있으면 추가
    if (systemPrompt) {
      apiMessages.unshift({
        role: "system",
        content: systemPrompt,
      });
    }

    // OpenAI API 호출
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error("OpenAI API 오류:", error);
      return NextResponse.json(
        { error: "AI 응답 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();
    const response = data.choices[0]?.message?.content || "응답을 생성할 수 없습니다.";

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("채팅 API 오류:", error);
    return NextResponse.json(
      { error: "메시지 전송에 실패했습니다." },
      { status: 500 }
    );
  }
}
