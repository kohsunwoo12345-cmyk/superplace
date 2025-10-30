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

    const { topic, keywords, tone, length } = await req.json();

    if (!topic || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: "주제와 키워드를 입력해주세요" },
        { status: 400 }
      );
    }

    // Generate blog content using AI
    const result = await AIService.generateBlogContent({
      topic,
      keywords,
      tone: tone || "professional",
      length: length || "medium",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Blog generation error:", error);
    return NextResponse.json(
      { error: "블로그 콘텐츠 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
