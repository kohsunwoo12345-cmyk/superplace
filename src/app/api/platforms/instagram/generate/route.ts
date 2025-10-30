import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { description, mood, targetAudience } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "게시물 설명을 입력해주세요" },
        { status: 400 }
      );
    }

    // Generate Instagram content using AI
    const result = await AIService.generateInstagramContent({
      description,
      mood,
      targetAudience,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Instagram generation error:", error);
    return NextResponse.json(
      { error: "Instagram 콘텐츠 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
